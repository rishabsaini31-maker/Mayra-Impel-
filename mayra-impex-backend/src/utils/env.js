const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

const validateEnv = () => {
  const hasAccessKeyRing = Boolean((process.env.JWT_ACCESS_KEYS || "").trim());
  const hasAccessLegacySecret = Boolean(process.env.JWT_SECRET);

  if (!hasAccessKeyRing && !hasAccessLegacySecret) {
    throw new Error("Provide JWT_ACCESS_KEYS or JWT_SECRET");
  }

  const hasRefreshKeyRing = Boolean(
    (process.env.JWT_REFRESH_KEYS || "").trim(),
  );

  if (
    !hasRefreshKeyRing &&
    !process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_SECRET
  ) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_REFRESH_SECRET is required in production");
    }
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
  }

  if (
    process.env.JWT_ACCESS_ACTIVE_KID &&
    !hasAccessKeyRing &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "JWT_ACCESS_ACTIVE_KID requires JWT_ACCESS_KEYS to be configured",
    );
  }

  if (
    process.env.JWT_REFRESH_ACTIVE_KID &&
    !hasRefreshKeyRing &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "JWT_REFRESH_ACTIVE_KID requires JWT_REFRESH_KEYS to be configured",
    );
  }

  if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required in production");
  }

  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

module.exports = {
  validateEnv,
};
