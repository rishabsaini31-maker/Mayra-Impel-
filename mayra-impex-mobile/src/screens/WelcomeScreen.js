import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, FONTS, SPACING } from "../constants";

const WelcomeScreen = ({ navigation }) => {
  const handleContinueAsGuest = () => {
    navigation.replace("CustomerTabs");
  };

  const handleLogin = () => {
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🛍️</Text>
      </View>
      <Text style={styles.title}>Welcome to</Text>
      <Text style={styles.brandName}>MAYRA IMPEX</Text>
      <Text style={styles.subtitle}>Premium Wholesale Platform</Text>
      <Text style={styles.description}>
        Your trusted platform for bulk orders and wholesale pricing
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleContinueAsGuest}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue as Guest</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: COLORS.secondary, marginTop: 12 },
        ]}
        onPress={handleLogin}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E7FF",
  },
  logoText: {
    fontSize: 48,
    color: COLORS.primary,
  },
  title: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    marginBottom: 2,
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontFamily: FONTS.medium,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    fontFamily: FONTS.regular,
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: "#FFF",
    fontWeight: "700",
  },
});

export default WelcomeScreen;
