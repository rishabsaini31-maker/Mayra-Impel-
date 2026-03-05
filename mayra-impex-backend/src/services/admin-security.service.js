const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { supabase } = require("../config/supabase");
const {
  sendSecurityEventToSinks,
  evaluateSecurityAlerts,
} = require("./security-monitoring.service");

/**
 * Admin PIN Security Service
 * Handles secure storage and verification of admin backup authentication PINs
 * Only admins can set/change their PIN
 */

const ADMIN_PIN_BCRYPT_ROUNDS = 12;
const MAX_PIN_ATTEMPTS = 3;
const PIN_LOCK_MINUTES = 15;

/**
 * Hash an admin PIN for database storage
 */
const hashAdminPin = async (pin) => {
  if (!pin || typeof pin !== "string") {
    throw new Error("Invalid PIN");
  }

  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("PIN must be 4-6 digits");
  }

  return await bcrypt.hash(pin, ADMIN_PIN_BCRYPT_ROUNDS);
};

/**
 * Verify an admin PIN
 */
const verifyAdminPin = async (pin, pinHash) => {
  if (!pin || !pinHash) {
    return false;
  }

  try {
    return await bcrypt.compare(pin, pinHash);
  } catch (error) {
    console.error("PIN verification error:", error);
    return false;
  }
};

/**
 * Set admin PIN (only for admin users)
 */
const setAdminPin = async (adminId, newPin, setByUserId) => {
  try {
    // Validate PIN format
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new Error("PIN must be 4-6 numeric digits");
    }

    // Hash the PIN
    const pinHash = await hashAdminPin(newPin);

    // Update user's PIN
    const { error } = await supabase
      .from("users")
      .update({
        admin_pin_hash: pinHash,
        admin_pin_set_at: new Date().toISOString(),
        admin_pin_updated_by: setByUserId,
      })
      .eq("id", adminId)
      .eq("role", "admin");

    if (error) throw error;

    // Log the action
    await logSecurityEvent({
      userId: adminId,
      eventType: "PIN_VERIFY",
      action: "ADMIN_PIN_SET",
      description: "Admin PIN has been set/updated",
      status: "success",
      metadata: { updated_by: setByUserId },
    });

    return { success: true };
  } catch (error) {
    console.error("Set admin PIN error:", error);
    throw error;
  }
};

/**
 * Verify admin PIN during unlock
 */
const authenticateWithAdminPin = async (adminId, pin, req) => {
  try {
    // Check if account is locked
    const { data: admin, error } = await supabase
      .from("users")
      .select("admin_pin_hash, mfa_failed_attempts, mfa_locked_until")
      .eq("id", adminId)
      .eq("role", "admin")
      .single();

    if (error || !admin) {
      throw new Error("Admin not found");
    }

    // Check if temporarily locked
    if (
      admin.mfa_locked_until &&
      new Date(admin.mfa_locked_until) > new Date()
    ) {
      await logSecurityEvent({
        userId: adminId,
        eventType: "PIN_VERIFY",
        action: "PIN_VERIFY_FAILED_ACCOUNT_LOCKED",
        description: "PIN verification attempt while account is locked",
        status: "failed",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      throw new Error("Account temporarily locked after too many attempts");
    }

    if (!admin.admin_pin_hash) {
      throw new Error("Admin PIN not configured");
    }

    // Verify PIN
    const isValid = await verifyAdminPin(pin, admin.admin_pin_hash);

    if (!isValid) {
      const failedAttempts = (admin.mfa_failed_attempts || 0) + 1;
      const updatePayload = { mfa_failed_attempts: failedAttempts };

      if (failedAttempts >= MAX_PIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
        updatePayload.mfa_locked_until = lockUntil.toISOString();
      }

      await supabase.from("users").update(updatePayload).eq("id", adminId);

      await logSecurityEvent({
        userId: adminId,
        eventType: "PIN_VERIFY",
        action: "PIN_VERIFY_FAILED",
        description: `Invalid PIN attempt (${failedAttempts}/${MAX_PIN_ATTEMPTS})`,
        status: "failed",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        failed_reason: "Invalid PIN",
      });

      throw new Error("Invalid PIN");
    }

    // Reset failed attempts on success
    await supabase
      .from("users")
      .update({ mfa_failed_attempts: 0, mfa_locked_until: null })
      .eq("id", adminId);

    await logSecurityEvent({
      userId: adminId,
      eventType: "PIN_VERIFY",
      action: "PIN_VERIFY_SUCCESS",
      description: "Admin authenticated with PIN",
      status: "success",
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    return { success: true, message: "PIN verified" };
  } catch (error) {
    console.error("Admin PIN authentication error:", error);
    throw error;
  }
};

/**
 * Log security event to audit table
 */
const logSecurityEvent = async ({
  userId,
  eventType,
  action,
  description,
  status = "success",
  ip_address = null,
  user_agent = null,
  failed_reason = null,
  metadata = null,
  created_by = "system",
}) => {
  try {
    const payload = {
      user_id: userId,
      event_type: eventType,
      action,
      description,
      status,
      ip_address,
      user_agent,
      failed_reason,
      metadata,
      created_by,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from("security_audit_log").insert({
      user_id: userId,
      event_type: eventType,
      action,
      description,
      status,
      ip_address,
      user_agent,
      failed_reason,
      metadata,
      created_by,
    });

    if (error) {
      console.error("Audit log error:", error);
      // Don't throw - logging failure shouldn't break app
    }

    await Promise.all([
      sendSecurityEventToSinks(payload),
      evaluateSecurityAlerts(payload),
    ]);
  } catch (error) {
    console.error("Security event logging error:", error);
  }
};

/**
 * Get audit logs for a user
 */
const getAuditLogs = async (userId, limit = 100, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from("security_audit_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Get audit logs error:", error);
    throw error;
  }
};

/**
 * Get all suspicious activities (failed logins, rate limits, etc.)
 */
const getSuspiciousActivities = async (hoursBack = 24) => {
  try {
    const since = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("security_audit_log")
      .select("*")
      .in("status", ["failed", "suspicious"])
      .gt("created_at", since)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Get suspicious activities error:", error);
    throw error;
  }
};

module.exports = {
  hashAdminPin,
  verifyAdminPin,
  setAdminPin,
  authenticateWithAdminPin,
  logSecurityEvent,
  getAuditLogs,
  getSuspiciousActivities,
};
