const axios = require("axios");
const { incrementCounterWithTtl, connectRedis } = require("../config/redis");

const SERVICE_NAME = process.env.SECURITY_SERVICE_NAME || "mayra-impex-backend";
const DATADOG_SITE = process.env.DATADOG_SITE || "datadoghq.com";

const BRUTE_FORCE_WINDOW_MS = Number(
  process.env.ALERT_BRUTE_FORCE_WINDOW_MS || 5 * 60 * 1000,
);
const BRUTE_FORCE_THRESHOLD = Number(
  process.env.ALERT_BRUTE_FORCE_THRESHOLD || 8,
);
const OTP_ABUSE_WINDOW_MS = Number(
  process.env.ALERT_OTP_ABUSE_WINDOW_MS || 10 * 60 * 1000,
);
const OTP_ABUSE_THRESHOLD = Number(process.env.ALERT_OTP_ABUSE_THRESHOLD || 5);
const REPLAY_WINDOW_MS = Number(
  process.env.ALERT_REPLAY_WINDOW_MS || 10 * 60 * 1000,
);
const REPLAY_THRESHOLD = Number(process.env.ALERT_REPLAY_THRESHOLD || 2);
const ADMIN_ANOMALY_WINDOW_MS = Number(
  process.env.ALERT_ADMIN_ANOMALY_WINDOW_MS || 60 * 60 * 1000,
);
const ADMIN_ANOMALY_THRESHOLD = Number(
  process.env.ALERT_ADMIN_ANOMALY_THRESHOLD || 2,
);

const safePost = async (url, payload, headers = {}) => {
  if (!url) return;

  try {
    await axios.post(url, payload, {
      timeout: Number(process.env.SIEM_HTTP_TIMEOUT_MS || 4000),
      headers,
    });
  } catch (error) {
    console.error("SIEM delivery failed:", error.message);
  }
};

const sendToSentry = async (payload) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    // Optional dependency: install @sentry/node to enable native Sentry ingestion.
    const Sentry = require("@sentry/node");
    if (!Sentry.getCurrentHub().getClient()) {
      Sentry.init({ dsn, tracesSampleRate: 0 });
    }

    Sentry.captureMessage(
      payload.message || payload.event_type || "security_event",
      {
        level: payload.alert ? "warning" : "info",
        tags: {
          event_type: payload.event_type,
          action: payload.action,
          service: SERVICE_NAME,
        },
        extra: payload,
      },
    );
  } catch (error) {
    console.error(
      "Sentry is configured but @sentry/node is unavailable. Install it to enable Sentry forwarding.",
    );
  }
};

const sendToDatadog = async (payload) => {
  const apiKey = process.env.DATADOG_API_KEY;
  if (!apiKey) return;

  const url = `https://http-intake.logs.${DATADOG_SITE}/api/v2/logs`;
  await safePost(url, [payload], {
    "Content-Type": "application/json",
    "DD-API-KEY": apiKey,
  });
};

const sendToElk = async (payload) => {
  const endpoint = process.env.ELK_LOG_INGEST_URL;
  await safePost(endpoint, payload, {
    "Content-Type": "application/json",
  });
};

const sendToWebhook = async (payload) => {
  const url = process.env.SECURITY_SIEM_WEBHOOK_URL;
  const authToken = process.env.SECURITY_SIEM_WEBHOOK_TOKEN;

  await safePost(url, payload, {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });
};

const sendSecurityEventToSinks = async (event) => {
  const payload = {
    ...event,
    service: SERVICE_NAME,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  await Promise.all([
    sendToWebhook(payload),
    sendToElk(payload),
    sendToDatadog(payload),
    sendToSentry(payload),
  ]);
};

const emitAlert = async ({
  alertType,
  severity = "high",
  title,
  message,
  identity,
  metadata = {},
}) => {
  const payload = {
    alert: true,
    alert_type: alertType,
    severity,
    title,
    message,
    identity,
    event_type: "SECURITY_ALERT",
    action: alertType,
    metadata,
  };

  await sendSecurityEventToSinks(payload);
};

const consumeThreshold = async ({ key, ttlMs, threshold }) => {
  const count = await incrementCounterWithTtl(key, ttlMs);
  if (count === null) return false;
  return count >= threshold;
};

const getIdentity = (event) => {
  return (
    event?.metadata?.email ||
    event?.ip_address ||
    event?.user_id ||
    event?.userId ||
    "unknown"
  );
};

const evaluateBruteForceSpike = async (event) => {
  const isAuthFailure =
    event.event_type === "AUTH_LOGIN" && event.status === "failed";

  if (!isAuthFailure) return;

  const identity = getIdentity(event);
  const key = `alert:bruteforce:${identity}`;
  const reached = await consumeThreshold({
    key,
    ttlMs: BRUTE_FORCE_WINDOW_MS,
    threshold: BRUTE_FORCE_THRESHOLD,
  });

  if (reached) {
    await emitAlert({
      alertType: "BRUTE_FORCE_SPIKE",
      severity: "critical",
      title: "Brute force pattern detected",
      message: `Detected repeated authentication failures for ${identity}`,
      identity,
      metadata: {
        threshold: BRUTE_FORCE_THRESHOLD,
        window_ms: BRUTE_FORCE_WINDOW_MS,
      },
    });
  }
};

const evaluateOtpAbuse = async (event) => {
  const isOtpAbuseEvent =
    event.event_type?.startsWith("2FA_OTP") &&
    (event.status === "failed" || String(event.action).includes("LOCKED"));

  if (!isOtpAbuseEvent) return;

  const identity = getIdentity(event);
  const key = `alert:otp-abuse:${identity}`;
  const reached = await consumeThreshold({
    key,
    ttlMs: OTP_ABUSE_WINDOW_MS,
    threshold: OTP_ABUSE_THRESHOLD,
  });

  if (reached) {
    await emitAlert({
      alertType: "OTP_ABUSE",
      severity: "high",
      title: "OTP abuse detected",
      message: `Repeated OTP failures/locks detected for ${identity}`,
      identity,
      metadata: {
        threshold: OTP_ABUSE_THRESHOLD,
        window_ms: OTP_ABUSE_WINDOW_MS,
      },
    });
  }
};

const evaluateReplayAttack = async (event) => {
  const replayEvent =
    event.event_type === "REPLAY_PROTECTION" ||
    String(event.action || "").includes("REPLAY");

  if (!replayEvent) return;

  const identity = getIdentity(event);
  const key = `alert:replay:${identity}`;
  const reached = await consumeThreshold({
    key,
    ttlMs: REPLAY_WINDOW_MS,
    threshold: REPLAY_THRESHOLD,
  });

  if (reached) {
    await emitAlert({
      alertType: "TOKEN_REPLAY_PATTERN",
      severity: "critical",
      title: "Replay attack indicators",
      message: `Multiple replay attack detections for ${identity}`,
      identity,
      metadata: {
        threshold: REPLAY_THRESHOLD,
        window_ms: REPLAY_WINDOW_MS,
      },
    });
  }
};

const evaluateAdminAnomaly = async (event) => {
  const isAdminLoginSuccess =
    event.event_type === "AUTH_LOGIN" &&
    event.action === "ADMIN_LOGIN_SUCCESS" &&
    event.status === "success";

  if (!isAdminLoginSuccess || !event.user_id || !event.ip_address) return;

  const client = await connectRedis();
  if (!client) return;

  try {
    const key = `admin:last-ip:${event.user_id}`;
    const previousIp = await client.get(key);

    if (previousIp && previousIp !== event.ip_address) {
      const anomalyKey = `alert:admin-anomaly:${event.user_id}`;
      const reached = await consumeThreshold({
        key: anomalyKey,
        ttlMs: ADMIN_ANOMALY_WINDOW_MS,
        threshold: ADMIN_ANOMALY_THRESHOLD,
      });

      if (reached) {
        await emitAlert({
          alertType: "ADMIN_LOGIN_ANOMALY",
          severity: "high",
          title: "Admin login anomaly detected",
          message: `Admin account ${event.user_id} logged in from a new IP ${event.ip_address} (previous ${previousIp})`,
          identity: event.user_id,
          metadata: {
            previous_ip: previousIp,
            current_ip: event.ip_address,
            threshold: ADMIN_ANOMALY_THRESHOLD,
            window_ms: ADMIN_ANOMALY_WINDOW_MS,
          },
        });
      }
    }

    await client.set(key, event.ip_address, {
      EX: Number(process.env.ADMIN_IP_HISTORY_TTL_SECONDS || 90 * 24 * 60 * 60),
    });
  } catch (error) {
    console.error("Admin anomaly evaluator failed:", error.message);
  }
};

const evaluateSecurityAlerts = async (event) => {
  try {
    await Promise.all([
      evaluateBruteForceSpike(event),
      evaluateOtpAbuse(event),
      evaluateReplayAttack(event),
      evaluateAdminAnomaly(event),
    ]);
  } catch (error) {
    console.error("Security alert evaluation failed:", error.message);
  }
};

module.exports = {
  sendSecurityEventToSinks,
  evaluateSecurityAlerts,
};
