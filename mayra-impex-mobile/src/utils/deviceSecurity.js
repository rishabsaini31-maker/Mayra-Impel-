import { NativeModules } from "react-native";

const PROD = process.env.NODE_ENV === "production";

const jailMonkey = NativeModules?.JailMonkey || null;

const safeCall = (fnName) => {
  if (!jailMonkey || typeof jailMonkey[fnName] !== "function") {
    return false;
  }

  try {
    return Boolean(jailMonkey[fnName]());
  } catch {
    return false;
  }
};

export const getDeviceSecurityStatus = () => {
  const rooted = safeCall("isJailBroken");
  const hookDetected = safeCall("hookDetected");
  const canMockLocation = safeCall("canMockLocation");
  const developmentSettings = safeCall("isDevelopmentSettingsMode");

  const compromised = rooted || hookDetected || canMockLocation;

  return {
    compromised,
    rooted,
    hookDetected,
    canMockLocation,
    developmentSettings,
    detectionReady: Boolean(jailMonkey),
  };
};

const SENSITIVE_PATTERNS = [
  "/auth/verify-admin-pin",
  "/auth/request-deletion",
  "/auth/confirm-deletion",
  "/products",
  "/orders",
  "/inventory",
  "/customers",
];

export const isSensitiveRequest = (url = "") => {
  const normalized = String(url || "").toLowerCase();
  return SENSITIVE_PATTERNS.some((pattern) => normalized.includes(pattern));
};

export const assertDeviceSafeForSensitiveAction = (url = "") => {
  if (!PROD || !isSensitiveRequest(url)) {
    return;
  }

  const status = getDeviceSecurityStatus();

  if (status.compromised) {
    throw new Error(
      "Sensitive action blocked: device failed root/jailbreak integrity checks.",
    );
  }
};
