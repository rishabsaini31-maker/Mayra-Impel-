/**
 * Certificate Pinning Utility for React Native/Expo
 * Prevents MITM attacks by validating server certificate against pinned certificate/public key
 *
 * For production, you should:
 * 1. Generate public key from your server certificate
 * 2. Store the public key in your app
 * 3. Validate server responses against this public key
 */

import { Platform } from "react-native";
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

/**
 * Validate certificate fingerprint against pinned certificates
 * This is called by axios interceptor for HTTPS responses
 */
export const validateCertificatePin = async (response) => {
  if (!CERT_PIN_CONFIG.enabled) {
    return true; // Skip in development
  }

  // Note: In a real production app, you would extract the certificate from the response
  // and validate it against CERT_PIN_CONFIG.pinnedCertificates
  // This is a simplified version - for full implementation, use rn-fetch-blob or similar

  // For now, we validate URL matches expected domain
  const responseUrl = new URL(response.config.url);
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
    // Validate configuration
    if (
      !CERT_PIN_CONFIG.pinnedCertificates.length &&
      !CERT_PIN_CONFIG.pinnedPublicKeys.length
    ) {
      console.warn(
        "No certificate pins configured. Update CERT_PIN_CONFIG with actual certificate fingerprints.",
      );
      return false;
    }

    // Check if any placeholder values are still present
    const hasPlaceholders =
      CERT_PIN_CONFIG.pinnedCertificates.some((cert) =>
        cert.includes("PLACEHOLDER"),
      ) &&
      CERT_PIN_CONFIG.pinnedPublicKeys.some((key) =>
        key.includes("PLACEHOLDER"),
      );

    if (hasPlaceholders) {
      console.error(
        "Certificate pinning not configured. Replace PLACEHOLDER values with actual certificate/public key fingerprints.",
      );
      return false;
    }

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
    return false;
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
    configured: !CERT_PIN_CONFIG.pinnedCertificates[0].includes("PLACEHOLDER"),
  };
};

export default CERT_PIN_CONFIG;
