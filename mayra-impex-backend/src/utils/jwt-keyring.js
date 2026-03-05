const jwt = require("jsonwebtoken");

const DEFAULT_ACTIVE_KID = "v1";
const REFRESH_DEFAULT_ACTIVE_KID = "r1";

const parseKeyRing = ({ keysEnvName, legacySecretEnvName, defaultKid }) => {
  const raw = (process.env[keysEnvName] || "").trim();

  if (raw) {
    const keys = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [kidPart, ...secretParts] = entry.split(":");
        const kid = (kidPart || "").trim();
        const secret = secretParts.join(":").trim();
        if (!kid || !secret) {
          throw new Error(
            `Invalid ${keysEnvName} entry: \"${entry}\". Expected format kid:secret`,
          );
        }
        return { kid, secret };
      });

    if (!keys.length) {
      throw new Error(`${keysEnvName} is set but no valid keys were found`);
    }

    return keys;
  }

  const legacySecret = process.env[legacySecretEnvName];
  if (!legacySecret) {
    throw new Error(
      `Missing JWT key configuration. Provide ${keysEnvName} or ${legacySecretEnvName}.`,
    );
  }

  return [{ kid: defaultKid, secret: legacySecret }];
};

const getActiveKid = (keyRing, envName, fallbackKid) => {
  const requested = (process.env[envName] || "").trim();
  if (!requested) {
    return keyRing[0]?.kid || fallbackKid;
  }

  const exists = keyRing.some((key) => key.kid === requested);
  if (!exists) {
    throw new Error(
      `${envName} is set to \"${requested}\" but that key id is not in the configured key ring`,
    );
  }

  return requested;
};

const resolveKeyByKid = (keyRing, kid) => {
  if (!kid) return null;
  return keyRing.find((key) => key.kid === kid) || null;
};

const verifyAgainstKeyRing = (token, keyRing) => {
  const decodedHeader = jwt.decode(token, { complete: true })?.header || {};
  const preferredKey = resolveKeyByKid(keyRing, decodedHeader.kid);

  if (preferredKey) {
    return jwt.verify(token, preferredKey.secret);
  }

  let lastError = null;
  for (const key of keyRing) {
    try {
      return jwt.verify(token, key.secret);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to verify JWT token");
};

const accessKeyRing = parseKeyRing({
  keysEnvName: "JWT_ACCESS_KEYS",
  legacySecretEnvName: "JWT_SECRET",
  defaultKid: DEFAULT_ACTIVE_KID,
});

const refreshKeyRing = parseKeyRing({
  keysEnvName: "JWT_REFRESH_KEYS",
  legacySecretEnvName: "JWT_REFRESH_SECRET",
  defaultKid: REFRESH_DEFAULT_ACTIVE_KID,
});

const activeAccessKid = getActiveKid(
  accessKeyRing,
  "JWT_ACCESS_ACTIVE_KID",
  DEFAULT_ACTIVE_KID,
);

const activeRefreshKid = getActiveKid(
  refreshKeyRing,
  "JWT_REFRESH_ACTIVE_KID",
  REFRESH_DEFAULT_ACTIVE_KID,
);

const getActiveAccessKey = () => {
  const key = resolveKeyByKid(accessKeyRing, activeAccessKid);
  if (!key) {
    throw new Error("Unable to find active JWT access signing key");
  }
  return key;
};

const getActiveRefreshKey = () => {
  const key = resolveKeyByKid(refreshKeyRing, activeRefreshKid);
  if (!key) {
    throw new Error("Unable to find active JWT refresh signing key");
  }
  return key;
};

const signAccessToken = (payload, options = {}) => {
  const key = getActiveAccessKey();
  return jwt.sign(payload, key.secret, {
    ...options,
    header: {
      ...(options.header || {}),
      kid: key.kid,
    },
  });
};

const signRefreshToken = (payload, options = {}) => {
  const key = getActiveRefreshKey();
  return jwt.sign(payload, key.secret, {
    ...options,
    header: {
      ...(options.header || {}),
      kid: key.kid,
    },
  });
};

const verifyAccessToken = (token) => verifyAgainstKeyRing(token, accessKeyRing);
const verifyRefreshToken = (token) =>
  verifyAgainstKeyRing(token, refreshKeyRing);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getConfiguredAccessKids: () => accessKeyRing.map((key) => key.kid),
  getConfiguredRefreshKids: () => refreshKeyRing.map((key) => key.kid),
};
