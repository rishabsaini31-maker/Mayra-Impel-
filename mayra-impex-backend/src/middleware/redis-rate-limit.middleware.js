const { incrementCounterWithTtl } = require("../config/redis");
const { logSecurityEvent } = require("../services/admin-security.service");

const createRedisRateLimiter = ({
  windowMs,
  max,
  keyPrefix,
  message,
  methods,
  keyGenerator,
}) => {
  const allowedMethods = methods?.map((m) => m.toUpperCase());

  return async (req, res, next) => {
    try {
      if (
        allowedMethods?.length &&
        !allowedMethods.includes(req.method.toUpperCase())
      ) {
        return next();
      }

      const identity = keyGenerator
        ? keyGenerator(req)
        : req.user?.userId || req.ip || "unknown";

      const bucket = Math.floor(Date.now() / windowMs);
      const redisKey = `${keyPrefix}:${identity}:${bucket}`;

      const count = await incrementCounterWithTtl(redisKey, windowMs);

      if (count === null) {
        return next();
      }

      if (count > max) {
        await logSecurityEvent({
          userId: req.user?.userId || null,
          eventType: "RATE_LIMIT",
          action: "RATE_LIMIT_HIT",
          description: `Rate limit exceeded for ${req.method} ${req.originalUrl}`,
          status: "failed",
          ip_address: req.ip,
          user_agent: req.get("user-agent"),
          metadata: {
            key_prefix: keyPrefix,
            count,
            max,
            window_ms: windowMs,
            path: req.originalUrl,
            method: req.method,
          },
        });

        return res.status(429).json({ error: message });
      }

      return next();
    } catch (error) {
      console.error("Redis rate limiter error:", error.message);
      return next();
    }
  };
};

const redisApiLimiter = createRedisRateLimiter({
  windowMs: Number(process.env.API_RATE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.API_RATE_LIMIT || 100),
  keyPrefix: "rl:api",
  message: "Too many requests. Please try again later.",
});

const redisAuthLimiter = createRedisRateLimiter({
  windowMs: Number(process.env.AUTH_RATE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT || 10),
  keyPrefix: "rl:auth",
  message: "Too many authentication attempts. Please try again later.",
  methods: ["POST"],
});

const redisAdminWriteLimiter = createRedisRateLimiter({
  windowMs: Number(process.env.ADMIN_WRITE_RATE_WINDOW_MS || 5 * 60 * 1000),
  max: Number(process.env.ADMIN_WRITE_RATE_LIMIT || 120),
  keyPrefix: "rl:admin:write",
  message: "Too many admin write requests. Please slow down.",
  methods: ["POST", "PUT", "PATCH", "DELETE"],
  keyGenerator: (req) => req.user?.userId || req.ip || "unknown",
});

module.exports = {
  createRedisRateLimiter,
  redisApiLimiter,
  redisAuthLimiter,
  redisAdminWriteLimiter,
};
