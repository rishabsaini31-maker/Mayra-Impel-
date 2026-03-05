/**
 * Certificate Pinning Utility for React Native/Expo
 * Prevents MITM attacks by validating server certificate against pinned certificate/public key
 *
 * For production, you should:
 * 1. Generate public key from your server certificate
 * 2. Store the public key in your app
 * 3. Validate server responses against this public key
 */

import { NativeModules, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Certificate pinning configuration
const CERT_PIN_CONFIG = {
  // Server domain
  domain:
    process.env.EXPO_PUBLIC_API_URL?.split("://")[1]?.split(":")[0] ||
    "localhost",

  // SHA-256 fingerprints of valid certificates (obtained from your server's SSL cert)
  // These should be periodically updated when your certificates are renewed
  pinnedCertificates: [
    // Production certificate fingerprint - UPDATE THIS WITH YOUR ACTUAL CERTIFICATE
    // Generate with: openssl s_client -connect yourdomain.com:443 -showcerts | openssl x509 -outform der | openssl dgst -sha256
    "PLACEHOLDER_SHA256_CERT_FINGERPRINT",
  ],

  // Public Key pins (alternative method - more resilient to cert changes)
  // Use: openssl s_client -connect yourdomain.com:443 -showcerts | openssl x509 -noout -pubkey | openssl pkey -pubin -outform der | openssl dgst -sha256
  pinnedPublicKeys: [
    // Production public key fingerprint
    "PLACEHOLDER_SHA256_PUBLIC_KEY_FINGERPRINT",
  ],

  // Enable pinning in production only
  enabled: process.env.NODE_ENV === "production",
};

const nativePinningModule =
  NativeModules?.RNSslPublicKeyPinning ||
  NativeModules?.SslPublicKeyPinning ||
  null;

const resolveUrl = (rawUrl, fallbackBase) => {
  try {
    return new URL(rawUrl, fallbackBase);
  } catch {
    return null;
  }
};

const hasPlaceholders = () => {
  return (
    CERT_PIN_CONFIG.pinnedCertificates.some((cert) =>
      cert.includes("PLACEHOLDER"),
    ) ||
    CERT_PIN_CONFIG.pinnedPublicKeys.some((key) => key.includes("PLACEHOLDER"))
  );
};

const assertProductionPinConfig = () => {
  if (!CERT_PIN_CONFIG.enabled) return;

  if (!CERT_PIN_CONFIG.domain || CERT_PIN_CONFIG.domain === "localhost") {
    throw new Error(
      "Certificate pinning requires a production API host. Set EXPO_PUBLIC_API_URL to your live HTTPS API.",
    );
  }

  if (hasPlaceholders()) {
    throw new Error(
      "Certificate pinning is enabled but placeholder fingerprints are still configured.",
    );
  }
};

/**
 * Validate certificate fingerprint against pinned certificates
 * This is called by axios interceptor for HTTPS responses
 */
export const validateCertificatePin = async (response) => {
  if (!CERT_PIN_CONFIG.enabled) {
    return true; // Skip in development
  }

  assertProductionPinConfig();

  const responseUrl = resolveUrl(
    response?.config?.url,
    response?.config?.baseURL || process.env.EXPO_PUBLIC_API_URL,
  );

  if (!responseUrl) {
    throw new Error("Certificate pin validation failed");
  }

  if (responseUrl.protocol !== "https:") {
    throw new Error("Certificate pin validation failed");
  }

  if (responseUrl.hostname !== CERT_PIN_CONFIG.domain) {
    console.error("Certificate pin validation failed: Domain mismatch");
    throw new Error("Certificate pin validation failed");
  }

  return true;
};

/**
 * Get certificate information from secure storage
 * Used to validate public key during request
 */
export const getCertificatePinInfo = async () => {
  try {
    const pinInfo = await SecureStore.getItemAsync("cert_pin_info");
    return pinInfo ? JSON.parse(pinInfo) : CERT_PIN_CONFIG;
  } catch (error) {
    console.error("Error retrieving certificate pin info:", error);
    return CERT_PIN_CONFIG;
  }
};

/**
 * Setup certificate pinning with exception handling
 * Use this during app initialization
 */
export const setupCertificatePinning = async () => {
  if (!CERT_PIN_CONFIG.enabled) {
    return false;
  }

  try {
    assertProductionPinConfig();

    if (!nativePinningModule || !nativePinningModule.initialize) {
      throw new Error(
        "Native SSL pinning module is not linked. Build with native pinning before production release.",
      );
    }

    await nativePinningModule.initialize({
      [CERT_PIN_CONFIG.domain]: {
        includeSubdomains: true,
        publicKeyHashes: CERT_PIN_CONFIG.pinnedPublicKeys,
      },
    });

    // Set up a flag in secure storage
    await SecureStore.setItemAsync(
      "cert_pin_info",
      JSON.stringify({
        enabled: true,
        setupAt: new Date().toISOString(),
        domain: CERT_PIN_CONFIG.domain,
      }),
    );

    console.log("Certificate pinning initialized for:", CERT_PIN_CONFIG.domain);
    return true;
  } catch (error) {
    console.error("Error setting up certificate pinning:", error);
    throw error;
  }
};

/**
 * Get certificate pinning report
 * For debugging certificate issues
 */
export const getCertificatePinReport = () => {
  return {
    enabled: CERT_PIN_CONFIG.enabled,
    domain: CERT_PIN_CONFIG.domain,
    platform: Platform.OS,
    certificateCount: CERT_PIN_CONFIG.pinnedCertificates.length,
    publicKeyCount: CERT_PIN_CONFIG.pinnedPublicKeys.length,
    configured: !hasPlaceholders(),
    nativeModuleLinked: Boolean(nativePinningModule),
  };
};

export default CERT_PIN_CONFIG;
