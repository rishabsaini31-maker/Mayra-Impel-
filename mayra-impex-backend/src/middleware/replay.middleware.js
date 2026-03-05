const { setNonceIfNotExists } = require("../config/redis");
const { logSecurityEvent } = require("../services/admin-security.service");

const replayNonceStore = new Map();

const REPLAY_WINDOW_MS = Number(process.env.REPLAY_WINDOW_MS || 2 * 60 * 1000);
const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 5 * 60 * 1000);

const cleanupExpiredNonces = () => {
  const now = Date.now();
  for (const [key, expiresAt] of replayNonceStore.entries()) {
    if (expiresAt <= now) {
      replayNonceStore.delete(key);
    }
  }
};

setInterval(cleanupExpiredNonces, 60 * 1000).unref();

const protectAgainstReplay = async (req, res, next) => {
  try {
    const nonce = req.header("x-client-nonce");
    const timestampHeader = req.header("x-client-timestamp");

    if (!req.user?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!nonce || !timestampHeader) {
      return res.status(400).json({
        error: "Missing replay protection headers",
      });
    }

    if (typeof nonce !== "string" || nonce.length < 16 || nonce.length > 128) {
      return res.status(400).json({ error: "Invalid nonce" });
    }

    const timestamp = Number(timestampHeader);
    if (!Number.isFinite(timestamp)) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > REPLAY_WINDOW_MS) {
      return res.status(400).json({
        error: "Request timestamp outside allowed window",
      });
    }

    const key = `replay:${req.user.userId}:${nonce}`;

    if (process.env.REDIS_URL) {
      const accepted = await setNonceIfNotExists(key, NONCE_TTL_MS);
      if (!accepted) {
        await logSecurityEvent({
          userId: req.user.userId,
          eventType: "REPLAY_PROTECTION",
          action: "REPLAY_DETECTED",
          description: `Replay request blocked on ${req.method} ${req.originalUrl}`,
          status: "suspicious",
          ip_address: req.ip,
          user_agent: req.get("user-agent"),
          metadata: {
            nonce,
            path: req.originalUrl,
            method: req.method,
          },
        });

        return res.status(409).json({ error: "Replay request detected" });
      }

      return next();
    }

    if (replayNonceStore.has(key)) {
      await logSecurityEvent({
        userId: req.user.userId,
        eventType: "REPLAY_PROTECTION",
        action: "REPLAY_DETECTED",
        description: `Replay request blocked on ${req.method} ${req.originalUrl}`,
        status: "suspicious",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        metadata: {
          nonce,
          path: req.originalUrl,
          method: req.method,
        },
      });

      return res.status(409).json({ error: "Replay request detected" });
    }

    replayNonceStore.set(key, now + NONCE_TTL_MS);

    return next();
  } catch (error) {
    return res.status(500).json({ error: "Replay protection failed" });
  }
};

module.exports = {
  protectAgainstReplay,
};
