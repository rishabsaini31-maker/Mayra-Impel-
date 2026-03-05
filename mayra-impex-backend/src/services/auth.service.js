const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = Number(
  process.env.JWT_REFRESH_EXPIRES_DAYS || 7,
);
const MAX_TOKEN_ROTATIONS = Number(process.env.MAX_TOKEN_ROTATIONS || 10);

const createAccessToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tv: Number(user.token_version || 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

const createRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      tokenType: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` },
  );

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getRefreshExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return expiresAt.toISOString();
};

const saveRefreshToken = async ({
  refreshToken,
  userId,
  ip,
  userAgent,
  parentTokenHash = null,
  rotationCount = 0,
}) => {
  const tokenHash = hashToken(refreshToken);

  const { error } = await supabase.from("user_refresh_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: getRefreshExpiryDate(),
    created_by_ip: ip || null,
    user_agent: userAgent || null,
    parent_token_hash: parentTokenHash,
    rotation_count: rotationCount,
    rotated_at: rotationCount > 0 ? new Date().toISOString() : null,
    max_rotations: MAX_TOKEN_ROTATIONS,
  });

  if (error) throw error;
};

const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);

  const { error } = await supabase
    .from("user_refresh_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (error) throw error;
};

/**
 * Find valid refresh token and check rotation count
 * Returns null if token is invalid, expired, revoked, or exceeded rotation limit
 */
const findValidRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);

  const { data, error } = await supabase
    .from("user_refresh_tokens")
    .select(
      "id, user_id, expires_at, revoked_at, rotation_count, max_rotations",
    )
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .single();

  if (error || !data) return null;

  const isExpired = new Date(data.expires_at) <= new Date();
  if (isExpired) return null;

  // Check if token rotation limit exceeded
  if (data.rotation_count >= data.max_rotations) {
    console.warn(`Token rotation limit exceeded for user ${data.user_id}`);
    return null;
  }

  return data;
};

/**
 * Rotate refresh token - invalidate old token and issue new one
 * Implements token rotation chain to prevent token reuse
 */
const rotateRefreshToken = async ({
  oldRefreshToken,
  userId,
  ip,
  userAgent,
}) => {
  try {
    const oldTokenHash = hashToken(oldRefreshToken);

    // Get old token record to track rotation chain
    const { data: oldTokenRecord, error: fetchError } = await supabase
      .from("user_refresh_tokens")
      .select("rotation_count, max_rotations")
      .eq("token_hash", oldTokenHash)
      .is("revoked_at", null)
      .single();

    if (fetchError || !oldTokenRecord) {
      throw new Error("Invalid refresh token");
    }

    // Check rotation limit
    if (oldTokenRecord.rotation_count >= oldTokenRecord.max_rotations) {
      throw new Error("Token rotation limit exceeded. Please login again.");
    }

    // Invalidate old token
    await revokeRefreshToken(oldRefreshToken);

    // Create new token with incremented rotation count
    const user = { id: userId };
    const newRefreshToken = createRefreshToken(user);

    const newRotationCount = oldTokenRecord.rotation_count + 1;

    // Save new token with rotation tracking
    await saveRefreshToken({
      refreshToken: newRefreshToken,
      userId,
      ip,
      userAgent,
      parentTokenHash: oldTokenHash,
      rotationCount: newRotationCount,
    });

    return newRefreshToken;
  } catch (error) {
    console.error("Token rotation error:", error);
    throw error;
  }
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
  });
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  saveRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  ACCESS_TOKEN_EXPIRY,
  MAX_TOKEN_ROTATIONS,
};
