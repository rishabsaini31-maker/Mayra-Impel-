const crypto = require("crypto");
const { supabase } = require("../config/supabase");
const { logSecurityEvent } = require("./admin-security.service");
const emailService = require("./email.service");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const OTP_REQUEST_COOLDOWN_SECONDS = 60;

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

/**
 * Request recovery OTP via SMS
 * Rate limited: 1 request per minute
 */
const requestRecoveryOTP = async (userId, req) => {
  try {
    // Get user with phone number
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, phone_number, otp_requested_at")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    if (!user.phone_number) {
      throw new Error(
        "Phone number not configured. Please add it in account settings.",
      );
    }

    // Check cooldown (prevent spam)
    if (user.otp_requested_at) {
      const lastRequestTime = new Date(user.otp_requested_at);
      const timeSinceLastRequest =
        (Date.now() - lastRequestTime.getTime()) / 1000;

      if (timeSinceLastRequest < OTP_REQUEST_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(
          OTP_REQUEST_COOLDOWN_SECONDS - timeSinceLastRequest,
        );
        throw new Error(
          `Please wait ${waitTime} seconds before requesting another OTP`,
        );
      }
    }

    // Generate OTP
    const otp = generateOTP();

    // Calculate expiry
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP session (hashed for security)
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const { error: insertError } = await supabase.from("otp_sessions").insert({
      user_id: userId,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      attempts_remaining: MAX_OTP_ATTEMPTS,
      created_by_ip: req.ip,
      created_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // Update last OTP request time
    await supabase
      .from("users")
      .update({ otp_requested_at: new Date().toISOString() })
      .eq("id", userId);

    // Send OTP via SMS (using Twilio)
    try {
      const twilio = require("../config/twilio");
      await twilio.messages.create({
        body: `Your Mayra Impex recovery code is: ${otp}\n\nValid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone_number,
      });
    } catch (smsError) {
      console.error("SMS send error:", smsError);
      // Still succeed but log the issue
      await logSecurityEvent({
        userId,
        eventType: "2FA_OTP_REQUEST",
        action: "OTP_REQUEST_SMS_FAILED",
        description: `OTP requested but SMS delivery failed for ${user.phone_number}`,
        status: "failed",
        ip_address: req.ip,
        failed_reason: "SMS service error",
      });

      throw new Error("Failed to send OTP. Please try again.");
    }

    // Log successful OTP request
    await logSecurityEvent({
      userId,
      eventType: "2FA_OTP_REQUEST",
      action: "OTP_REQUEST_SUCCESS",
      description: `Recovery OTP requested and sent to ${user.phone_number.slice(-4)}`,
      status: "success",
      ip_address: req.ip,
      metadata: { phone_last_4: user.phone_number.slice(-4) },
    });

    return {
      success: true,
      message: `OTP sent to ${user.phone_number}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    };
  } catch (error) {
    console.error("Request recovery OTP error:", error);
    throw error;
  }
};

/**
 * Verify recovery OTP and issue new tokens
 */
const verifyRecoveryOTP = async (userId, otp, req) => {
  try {
    if (!otp || otp.length !== OTP_LENGTH) {
      throw new Error("Invalid OTP format");
    }

    // Hash the provided OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Find valid OTP session
    const { data: otpSession, error: otpError } = await supabase
      .from("otp_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("otp_hash", otpHash)
      .gt("expires_at", new Date().toISOString())
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpSession) {
      // OTP not found or expired - decrement attempts
      const { data: pendingSessions } = await supabase
        .from("otp_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (pendingSessions && pendingSessions.length > 0) {
        const session = pendingSessions[0];
        const attemptsRemaining = Math.max(0, session.attempts_remaining - 1);

        // Update attempts
        await supabase
          .from("otp_sessions")
          .update({ attempts_remaining: attemptsRemaining })
          .eq("id", session.id);

        // Lock account if too many attempts
        if (attemptsRemaining === 0) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await supabase
            .from("users")
            .update({ otp_locked_until: lockUntil.toISOString() })
            .eq("id", userId);

          await logSecurityEvent({
            userId,
            eventType: "2FA_OTP_VERIFY",
            action: "OTP_VERIFY_LOCKED",
            description: "Account locked after max OTP attempts",
            status: "failed",
            ip_address: req.ip,
            failed_reason: "Max attempts exceeded",
          });

          throw new Error(
            "Account locked due to too many failed attempts. Try again in 15 minutes.",
          );
        }

        await logSecurityEvent({
          userId,
          eventType: "2FA_OTP_VERIFY",
          action: "OTP_VERIFY_FAILED",
          description: `Invalid OTP (${attemptsRemaining} attempts remaining)`,
          status: "failed",
          ip_address: req.ip,
          failed_reason: "Invalid OTP",
        });

        throw new Error(
          `Invalid OTP. ${attemptsRemaining} attempts remaining.`,
        );
      }

      throw new Error("OTP expired or not found");
    }

    // Mark OTP as verified
    await supabase
      .from("otp_sessions")
      .update({
        verified_at: new Date().toISOString(),
        verified_by_ip: req.ip,
      })
      .eq("id", otpSession.id);

    // Get user data
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    // Log successful verification
    await logSecurityEvent({
      userId,
      eventType: "2FA_OTP_VERIFY",
      action: "OTP_VERIFY_SUCCESS",
      description: "Account unlocked via recovery OTP",
      status: "success",
      ip_address: req.ip,
    });

    // Reset OTP lock
    await supabase
      .from("users")
      .update({
        otp_locked_until: null,
        mfa_failed_attempts: 0,
        mfa_locked_until: null,
      })
      .eq("id", userId);

    return {
      success: true,
      message: "OTP verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Verify recovery OTP error:", error);
    throw error;
  }
};

/**
 * Check if user is OTP locked
 */
const isOTPLocked = async (userId) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("otp_locked_until")
      .eq("id", userId)
      .single();

    if (!user || !user.otp_locked_until) {
      return false;
    }

    const lockUntil = new Date(user.otp_locked_until);
    return lockUntil > new Date();
  } catch (error) {
    console.error("Check OTP lock error:", error);
    return false;
  }
};

/**
 * Add phone number to user (for 2FA setup)
 */
const addPhoneNumber = async (userId, phoneNumber) => {
  try {
    // Validate phone number format (basic E.164 validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s+/g, ""))) {
      throw new Error("Invalid phone number format");
    }

    const { error } = await supabase
      .from("users")
      .update({
        phone_number: phoneNumber,
        two_fa_enabled: true,
      })
      .eq("id", userId);

    if (error) throw error;

    await logSecurityEvent({
      userId,
      eventType: "2FA_SETUP",
      action: "PHONE_NUMBER_ADDED",
      description: `Phone number configured for 2FA: ${phoneNumber.slice(-4)}`,
      status: "success",
      metadata: { phone_last_4: phoneNumber.slice(-4) },
    });

    return { success: true, message: "Phone number successfully configured" };
  } catch (error) {
    console.error("Add phone number error:", error);
    throw error;
  }
};

module.exports = {
  requestRecoveryOTP,
  verifyRecoveryOTP,
  isOTPLocked,
  addPhoneNumber,
  generateOTP,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
};
