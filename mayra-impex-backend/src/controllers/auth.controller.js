const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");
const emailService = require("../services/email.service");
const {
  createAccessToken,
  createRefreshToken,
  saveRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../services/auth.service");
const { sleep } = require("../middleware/security.middleware");

const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);
const FAILED_LOGIN_DELAY_MS = Number(process.env.FAILED_LOGIN_DELAY_MS || 700);

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, pair) => {
    const [rawKey, ...rawValue] = pair.split("=");
    if (!rawKey) return acc;
    acc[rawKey.trim()] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
};

const isMissingUserSecurityColumns = (error) => {
  const message = error?.message || "";
  return /failed_login_attempts|account_locked_until|deleted_at|token_version/i.test(
    message,
  );
};

class AuthController {
  // Register new customer
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .is("deleted_at", null)
        .maybeSingle();

      if (
        existingUserError &&
        !isMissingUserSecurityColumns(existingUserError)
      ) {
        throw existingUserError;
      }

      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Create user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          name,
          email: normalizedEmail,
          password_hash,
          role: "customer",
        })
        .select("id, name, email, role")
        .single();

      if (error) throw error;

      const accessToken = createAccessToken(newUser);
      const refreshToken = createRefreshToken(newUser);

      await saveRefreshToken({
        refreshToken,
        userId: newUser.id,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });

      setRefreshCookie(res, refreshToken);

      res.status(201).json({
        message: "Registration successful",
        user: newUser,
        token: accessToken,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Find user by email
      let supportsSecurityColumns = true;

      let { data: user, error } = await supabase
        .from("users")
        .select(
          "id, name, email, password_hash, role, is_blocked, failed_login_attempts, account_locked_until, token_version",
        )
        .eq("email", normalizedEmail)
        .is("deleted_at", null)
        .maybeSingle();

      if (error && isMissingUserSecurityColumns(error)) {
        supportsSecurityColumns = false;
        const fallback = await supabase
          .from("users")
          .select("id, name, email, password_hash, role, is_blocked")
          .eq("email", normalizedEmail)
          .maybeSingle();
        user = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;

      if (!user) {
        await sleep(FAILED_LOGIN_DELAY_MS);
        console.warn("Failed login attempt", {
          email: normalizedEmail,
          ip: req.ip,
          reason: "user_not_found",
        });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.is_blocked) {
        await sleep(FAILED_LOGIN_DELAY_MS);
        return res.status(403).json({ error: "Account is blocked" });
      }

      if (
        supportsSecurityColumns &&
        user.account_locked_until &&
        new Date(user.account_locked_until) > new Date()
      ) {
        await sleep(FAILED_LOGIN_DELAY_MS);
        return res.status(423).json({
          error: "Account is temporarily locked. Try again later.",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        await sleep(FAILED_LOGIN_DELAY_MS);

        if (supportsSecurityColumns) {
          const failedAttempts = (user.failed_login_attempts || 0) + 1;
          const updatePayload = { failed_login_attempts: failedAttempts };

          if (failedAttempts >= LOGIN_MAX_ATTEMPTS) {
            const lockUntil = new Date(
              Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000,
            );
            updatePayload.account_locked_until = lockUntil.toISOString();
          }

          await supabase.from("users").update(updatePayload).eq("id", user.id);
        }

        console.warn("Failed login attempt", {
          email: normalizedEmail,
          ip: req.ip,
          reason: "invalid_password",
        });

        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (supportsSecurityColumns) {
        await supabase
          .from("users")
          .update({
            failed_login_attempts: 0,
            account_locked_until: null,
          })
          .eq("id", user.id);
      }

      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);

      await saveRefreshToken({
        refreshToken,
        userId: user.id,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });

      setRefreshCookie(res, refreshToken);

      // Remove password_hash from response
      delete user.password_hash;
      delete user.failed_login_attempts;
      delete user.account_locked_until;

      res.status(200).json({
        message: "Login successful",
        user,
        token: accessToken,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }

  async refreshToken(req, res) {
    try {
      const cookieToken = parseCookies(req.headers.cookie || "").refreshToken;
      const incomingRefreshToken = req.body.refreshToken || cookieToken;

      if (!incomingRefreshToken) {
        return res.status(401).json({ error: "Refresh token is required" });
      }

      let decoded;
      try {
        decoded = jwt.verify(
          incomingRefreshToken,
          process.env.JWT_REFRESH_SECRET,
        );
      } catch (error) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      if (decoded.tokenType !== "refresh") {
        return res.status(401).json({ error: "Invalid refresh token type" });
      }

      const tokenRecord = await findValidRefreshToken(incomingRefreshToken);
      if (!tokenRecord) {
        return res
          .status(401)
          .json({ error: "Refresh token expired or revoked" });
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email, role, is_blocked, token_version")
        .eq("id", tokenRecord.user_id)
        .is("deleted_at", null)
        .single();

      if (userError || !user || user.is_blocked) {
        return res.status(401).json({ error: "User is not authorized" });
      }

      try {
        // Rotate refresh token (invalidate old, issue new with tracking)
        const newRefreshToken = await rotateRefreshToken({
          oldRefreshToken: incomingRefreshToken,
          userId: user.id,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        });

        const newAccessToken = createAccessToken(user);

        setRefreshCookie(res, newRefreshToken);

        res.status(200).json({
          message: "Token refreshed successfully",
          token: newAccessToken,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } catch (rotationError) {
        console.error("Token rotation error:", rotationError);
        return res.status(401).json({
          error: rotationError.message || "Token rotation failed",
        });
      }
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  }

  async logout(req, res) {
    try {
      const cookieToken = parseCookies(req.headers.cookie || "").refreshToken;
      const incomingRefreshToken = req.body?.refreshToken || cookieToken;

      if (incomingRefreshToken) {
        await revokeRefreshToken(incomingRefreshToken);
      }

      if (req.user?.userId) {
        const { data: currentUser, error: readError } = await supabase
          .from("users")
          .select("id, token_version")
          .eq("id", req.user.userId)
          .maybeSingle();

        const message = readError?.message || "";
        const missingTokenVersion = /token_version/i.test(message);

        if (!readError && currentUser) {
          await supabase
            .from("users")
            .update({
              token_version: Number(currentUser.token_version || 0) + 1,
            })
            .eq("id", req.user.userId);
        } else if (readError && !missingTokenVersion) {
          throw readError;
        }
      }

      clearRefreshCookie(res);

      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .eq("id", req.user.userId)
        .is("deleted_at", null)
        .single();

      if (error) throw error;

      res.status(200).json({ user });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  // Update current user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updates = {};

      if (req.body.name) {
        updates.name = req.body.name.trim();
      }

      if (req.body.email) {
        const normalizedEmail = req.body.email.toLowerCase().trim();

        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .neq("id", userId)
          .is("deleted_at", null)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
          return res.status(409).json({ error: "Email already registered" });
        }

        updates.email = normalizedEmail;
      }

      const { data: user, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .is("deleted_at", null)
        .select("id, name, email, role, created_at")
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }

  // Get all customers (admin only)
  async getAllCustomers(req, res) {
    try {
      const { data: customers, error } = await supabase
        .from("users")
        .select("id, name, email, phone, role, created_at, is_blocked")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.status(200).json({
        message: "Customers retrieved successfully",
        data: customers,
      });
    } catch (error) {
      console.error("Get all customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  }

  // Get customer by ID (admin only)
  async getCustomerById(req, res) {
    try {
      const { id } = req.params;

      const { data: customer, error } = await supabase
        .from("users")
        .select("id, name, email, phone, role, created_at, is_blocked")
        .eq("id", id)
        .eq("role", "customer")
        .is("deleted_at", null)
        .single();

      if (error || !customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.status(200).json({
        message: "Customer retrieved successfully",
        data: customer,
      });
    } catch (error) {
      console.error("Get customer by ID error:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  }

  // Block customer (admin only)
  async blockCustomer(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists and is a customer
      const { data: customer, error: fetchError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (fetchError || !customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      if (customer.role !== "customer") {
        return res
          .status(400)
          .json({ error: "You can only block customers, not admins" });
      }

      // Block the customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from("users")
        .update({ is_blocked: true })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        message: "Customer blocked successfully",
        data: updatedCustomer,
      });
    } catch (error) {
      console.error("Block customer error:", error);
      res.status(500).json({ error: "Failed to block customer" });
    }
  }

  // Unblock customer (admin only)
  async unblockCustomer(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists and is a customer
      const { data: customer, error: fetchError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (fetchError || !customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      if (customer.role !== "customer") {
        return res
          .status(400)
          .json({ error: "You can only unblock customers, not admins" });
      }

      // Unblock the customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from("users")
        .update({ is_blocked: false })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        message: "Customer unblocked successfully",
        data: updatedCustomer,
      });
    } catch (error) {
      console.error("Unblock customer error:", error);
      res.status(500).json({ error: "Failed to unblock customer" });
    }
  }

  // Get customer segments (VIP, Inactive, High spenders, New)
  async getCustomerSegments(req, res) {
    try {
      // Fetch all customers
      const { data: customers, error: customerError } = await supabase
        .from("users")
        .select("id, name, email, phone, created_at")
        .eq("role", "customer")
        .is("deleted_at", null);

      if (customerError) throw customerError;

      if (!customers || customers.length === 0) {
        return res.status(200).json({
          message: "Customer segments retrieved",
          segments: {
            vip: { count: 0, data: [] },
            inactive: { count: 0, data: [] },
            highSpenders: { count: 0, data: [] },
            new: { count: 0, data: [] },
          },
        });
      }

      // Fetch all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id, user_id, created_at");

      if (ordersError) {
        console.warn("Warning fetching orders for segments:", ordersError);
      }

      // Group orders by customer
      const ordersByCustomer = {};
      if (allOrders) {
        allOrders.forEach((order) => {
          if (!ordersByCustomer[order.user_id]) {
            ordersByCustomer[order.user_id] = [];
          }
          ordersByCustomer[order.user_id].push(order);
        });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Segment customers
      const vipCustomers = customers.filter(
        (c) => (ordersByCustomer[c.id]?.length || 0) >= 5,
      );

      const inactiveCustomers = customers.filter((c) => {
        const customerOrders = ordersByCustomer[c.id] || [];
        if (customerOrders.length === 0) return true;
        const lastOrder = customerOrders[customerOrders.length - 1];
        return new Date(lastOrder.created_at) < thirtyDaysAgo;
      });

      const highSpenders = customers.filter(
        (c) =>
          (ordersByCustomer[c.id]?.length || 0) >= 3 &&
          !vipCustomers.some((v) => v.id === c.id),
      );

      const newCustomers = customers.filter((c) => {
        const created = new Date(c.created_at);
        return created > thirtyDaysAgo;
      });

      res.status(200).json({
        message: "Customer segments retrieved",
        segments: {
          vip: { count: vipCustomers.length, data: vipCustomers },
          inactive: {
            count: inactiveCustomers.length,
            data: inactiveCustomers,
          },
          highSpenders: { count: highSpenders.length, data: highSpenders },
          new: { count: newCustomers.length, data: newCustomers },
        },
      });
    } catch (error) {
      console.error("Get segments error:", error.message);
      res.status(500).json({ error: "Failed to fetch customer segments" });
    }
  }

  // Export customers as CSV
  async exportCustomers(req, res) {
    try {
      const { data: customers, error } = await supabase
        .from("users")
        .select("id, name, email, phone, role, created_at, is_blocked")
        .eq("role", "customer")
        .is("deleted_at", null);

      if (error) throw error;

      // Convert to CSV
      const headers = ["ID", "Name", "Email", "Phone", "Status", "Joined Date"];
      const rows = customers.map((c) => [
        c.id,
        c.name,
        c.email,
        c.phone || "N/A",
        c.is_blocked ? "Blocked" : "Active",
        new Date(c.created_at).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const fileName = `customers_export_${Date.now()}.csv`;

      let emailSent = false;
      let emailWarning = null;

      try {
        await emailService.sendCSVExportEmail({
          exportType: "Customers",
          fileName,
          csvContent: csv,
          requestedBy: { email: req.user?.email },
        });
        emailSent = true;
      } catch (mailError) {
        emailWarning = mailError.message;
      }

      res.status(200).json({
        message: "Customers exported",
        csv,
        fileName,
        emailSent,
        emailWarning,
      });
    } catch (error) {
      console.error("Export customers error:", error);
      res.status(500).json({ error: "Failed to export customers" });
    }
  }

  // Bulk block/unblock customers
  async bulkUpdateCustomers(req, res) {
    try {
      const { customerIds, action } = req.body; // action: 'block' or 'unblock'

      const { data: updated, error } = await supabase
        .from("users")
        .update({ is_blocked: action === "block" })
        .in("id", customerIds)
        .select();

      if (error) throw error;

      res.status(200).json({
        message: `Customers ${action}ed successfully`,
        data: updated,
      });
    } catch (error) {
      console.error("Bulk update customers error:", error);
      res.status(500).json({ error: "Failed to bulk update customers" });
    }
  }

  // Verify admin PIN (for session unlock)
  async verifyAdminPin(req, res) {
    const {
      authenticateWithAdminPin,
      logSecurityEvent,
    } = require("../services/admin-security.service");

    try {
      const { pin } = req.body;

      if (!req.user || req.user.role !== "admin") {
        await logSecurityEvent({
          userId: req.user?.id,
          eventType: "UNAUTHORIZED_ACCESS",
          action: "PIN_VERIFY_UNAUTHORIZED",
          description: "Non-admin attempted PIN verification",
          status: "failed",
          ip_address: req.ip,
          user_agent: req.get("user-agent"),
        });

        return res.status(403).json({
          error: "Admin access required",
          success: false,
        });
      }

      // Verify PIN
      const result = await authenticateWithAdminPin(req.user.id, pin, req);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Verify admin PIN error:", error);

      const errorMessage = error.message || "PIN verification failed";

      if (
        errorMessage.includes("too many attempts") ||
        errorMessage.includes("locked")
      ) {
        return res.status(429).json({
          error: errorMessage,
          success: false,
        });
      }

      res.status(401).json({
        error: errorMessage,
        success: false,
      });
    }
  }

  // Request 2FA Recovery OTP
  async requestRecoveryOTP(req, res) {
    const {
      requestRecoveryOTP,
      isOTPLocked,
    } = require("../services/otp.service");
    const { logSecurityEvent } = require("../services/admin-security.service");

    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is OTP locked
      const locked = await isOTPLocked(req.user.id);
      if (locked) {
        return res.status(429).json({
          error: "Too many OTP attempts. Please try again in 15 minutes.",
        });
      }

      const result = await requestRecoveryOTP(req.user.id, req);

      res.status(200).json(result);
    } catch (error) {
      console.error("Request recovery OTP error:", error);
      res.status(400).json({ error: error.message || "Failed to send OTP" });
    }
  }

  // Verify 2FA Recovery OTP
  async verifyRecoveryOTP(req, res) {
    const { verifyRecoveryOTP } = require("../services/otp.service");
    const {
      createAccessToken,
      createRefreshToken,
      saveRefreshToken: saveRefresh,
      setRefreshCookie: setRefresh,
    } = require("../services/auth.service");

    try {
      const { otp } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const result = await verifyRecoveryOTP(req.user.id, otp, req);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Issue new tokens
      const accessToken = createAccessToken(result.user);
      const refreshToken = createRefreshToken(result.user);

      await saveRefresh({
        refreshToken,
        userId: result.user.id,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });

      setRefresh(res, refreshToken);

      res.status(200).json({
        success: true,
        message: "Account recovered via OTP",
        user: result.user,
        token: accessToken,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Verify recovery OTP error:", error);
      res.status(401).json({
        error: error.message || "OTP verification failed",
      });
    }
  }

  // Add phone number for 2FA setup
  async addPhoneNumber(req, res) {
    const { addPhoneNumber } = require("../services/otp.service");

    try {
      const { phoneNumber } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const result = await addPhoneNumber(req.user.id, phoneNumber);

      res.status(200).json(result);
    } catch (error) {
      console.error("Add phone number error:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to add phone number" });
    }
  }

  // Request account deletion (GDPR)
  async requestAccountDeletion(req, res) {
    const { logSecurityEvent } = require("../services/admin-security.service");
    const { requestRecoveryOTP } = require("../services/otp.service");

    try {
      const { password } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify password
      const { data: user } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", req.user.id)
        .single();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        await logSecurityEvent({
          userId: req.user.id,
          eventType: "GDPR_DELETE",
          action: "DELETE_REQUEST_FAILED",
          description: "GDPR deletion request with invalid password",
          status: "failed",
          ip_address: req.ip,
        });

        return res.status(401).json({ error: "Invalid password" });
      }

      // Send OTP for confirmation
      try {
        await requestRecoveryOTP(req.user.id, req);
      } catch (otpError) {
        return res.status(400).json({
          error: "Please configure phone number in account settings first",
        });
      }

      await logSecurityEvent({
        userId: req.user.id,
        eventType: "GDPR_DELETE",
        action: "DELETE_REQUEST_OTP_SENT",
        description: "OTP sent for account deletion confirmation",
        status: "success",
        ip_address: req.ip,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent for deletion confirmation",
        expiresIn: 300,
      });
    } catch (error) {
      console.error("Request account deletion error:", error);
      res.status(500).json({ error: "Failed to process deletion request" });
    }
  }

  // Confirm account deletion with OTP
  async confirmAccountDeletion(req, res) {
    const { verifyRecoveryOTP } = require("../services/otp.service");
    const { logSecurityEvent } = require("../services/admin-security.service");

    try {
      const { otp } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify OTP
      const otpResult = await verifyRecoveryOTP(req.user.id, otp, req);

      if (!otpResult.success) {
        return res.status(401).json(otpResult);
      }

      // Schedule deletion (30-day grace period)
      const deletionScheduledAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      );

      const { error } = await supabase.from("gdpr_deletion_requests").insert({
        user_id: req.user.id,
        deletion_scheduled_at: deletionScheduledAt.toISOString(),
        status: "pending",
        ip_address: req.ip,
      });

      if (error) throw error;

      // Log deletion request
      await logSecurityEvent({
        userId: req.user.id,
        eventType: "GDPR_DELETE",
        action: "DELETE_REQUEST_CONFIRMED",
        description: `Account deletion scheduled for ${deletionScheduledAt.toDateString()}`,
        status: "success",
        ip_address: req.ip,
        metadata: {
          deletion_scheduled: deletionScheduledAt.toISOString(),
          grace_period_days: 30,
        },
      });

      // Clear session
      clearRefreshCookie(res);

      res.status(200).json({
        success: true,
        message:
          "Account deletion confirmed. Your account will be permanently deleted in 30 days.",
        scheduledDeletionDate: deletionScheduledAt.toISOString(),
      });
    } catch (error) {
      console.error("Confirm account deletion error:", error);
      res.status(500).json({ error: "Failed to confirm deletion" });
    }
  }

  // Cancel account deletion request (within grace period)
  async cancelAccountDeletion(req, res) {
    const { logSecurityEvent } = require("../services/admin-security.service");

    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { error } = await supabase
        .from("gdpr_deletion_requests")
        .update({ status: "cancelled" })
        .eq("user_id", req.user.id)
        .eq("status", "pending");

      if (error) throw error;

      await logSecurityEvent({
        userId: req.user.id,
        eventType: "GDPR_DELETE",
        action: "DELETE_REQUEST_CANCELLED",
        description: "Account deletion request cancelled",
        status: "success",
        ip_address: req.ip,
      });

      res.status(200).json({
        success: true,
        message: "Account deletion cancelled",
      });
    } catch (error) {
      console.error("Cancel account deletion error:", error);
      res.status(500).json({ error: "Failed to cancel deletion" });
    }
  }

  // Get deletion request status
  async getDeletionStatus(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { data: deletion } = await supabase
        .from("gdpr_deletion_requests")
        .select("*")
        .eq("user_id", req.user.id)
        .eq("status", "pending")
        .single();

      if (!deletion) {
        return res.status(200).json({
          hasActiveDeletion: false,
        });
      }

      const daysRemaining = Math.ceil(
        (new Date(deletion.deletion_scheduled_at) - new Date()) /
          (1000 * 60 * 60 * 24),
      );

      res.status(200).json({
        hasActiveDeletion: true,
        scheduledDate: deletion.deletion_scheduled_at,
        daysRemaining,
        requestedAt: deletion.requested_at,
      });
    } catch (error) {
      console.error("Get deletion status error:", error);
      res.status(500).json({ error: "Failed to get deletion status" });
    }
  }
}

module.exports = new AuthController();
