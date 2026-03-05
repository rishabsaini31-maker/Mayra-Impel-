import axios from "axios";
import { authStorage } from "../utils/authStorage";
import useAuthStore from "../store/authStore";
import { validateCertificatePin } from "../utils/certificatePinning";
import { assertDeviceSafeForSensitiveAction } from "../utils/deviceSecurity";

const generateNonce = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;

const requiresReplayHeaders = (method = "") =>
  ["post", "put", "patch", "delete"].includes(method.toLowerCase());

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not set. Define it in your environment for production safety.",
  );
}

if (
  process.env.NODE_ENV === "production" &&
  API_URL &&
  !API_URL.startsWith("https://")
) {
  throw new Error("In production, EXPO_PUBLIC_API_URL must use HTTPS.");
}

const api = axios.create({
  baseURL: API_URL || "http://localhost:5001/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const requestUrl = `${config.baseURL || ""}${config.url || ""}`;
    assertDeviceSafeForSensitiveAction(requestUrl);

    try {
      useAuthStore.getState().markActivity();
      const token = await authStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        if (requiresReplayHeaders(config.method)) {
          config.headers["x-client-timestamp"] = Date.now().toString();
          config.headers["x-client-nonce"] = generateNonce();
          config.headers["x-request-id"] = generateNonce();
        }
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling and certificate pinning
api.interceptors.response.use(
  async (response) => {
    try {
      // Validate certificate pin
      await validateCertificatePin(response);
    } catch (pinError) {
      console.error("Certificate pin validation failed:", pinError);
      throw pinError;
    }
    return response;
  },
  async (error) => {
    const url = error.config?.url || "unknown";
    const method = error.config?.method?.toUpperCase() || "unknown";
    const status = error.response?.status;

    if (status === 401) {
      console.warn("Unauthorized (401) - Token expired or invalid:", url);
      // Token expired or invalid
      await authStorage.clearAuth();
      // Navigate to login screen (handle in your navigation logic)
    } else if (status === 403) {
      console.warn(
        "Forbidden (403) - User does not have permission for this endpoint:",
        method,
        url,
      );
      console.warn(
        "Make sure the user has admin role in the database for admin endpoints",
      );
    } else if (status >= 500) {
      console.error(
        `Server error (${status}) on ${method} ${url}:`,
        error.response?.data,
      );
    } else if (error.message === "Certificate pin validation failed") {
      console.error(
        "SECURITY: Certificate validation failed - potential MITM attack",
      );
    }

    return Promise.reject(error);
  },
);

export default api;
