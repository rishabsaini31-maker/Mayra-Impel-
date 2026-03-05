import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Old navigation (with auth, login, etc.)
// import Navigation from "./src/navigation/AppNavigator";

// NEW MODERN UI - Premium gift shopping design
import ModernNavigator from "./src/navigation/ModernNavigator";
import { setupCertificatePinning } from "./src/utils/certificatePinning";
import { configureProductionLogging } from "./src/utils/productionLogging";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [securityError, setSecurityError] = useState(null);

  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        configureProductionLogging();
        await setupCertificatePinning();
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          setSecurityError(error.message || "Security initialization failed");
        }
      }
    };

    initializeSecurity();
  }, []);

  if (securityError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Security Check Failed</Text>
          <Text style={styles.errorMessage}>{securityError}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {/* Using Modern UI */}
        <ModernNavigator />

        {/* To switch back to old UI, uncomment below and comment ModernNavigator above */}
        {/* <Navigation /> */}

        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#991b1b",
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 22,
  },
});
