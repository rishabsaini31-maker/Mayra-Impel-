import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const AppLogo = ({ size = "medium", showText = true }) => {
  const sizes = {
    small: { container: 32, text: 16, icon: 20 },
    medium: { container: 40, text: 18, icon: 24 },
    large: { container: 60, text: 24, icon: 36 },
  };

  const currentSize = sizes[size];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF6B9D", "#C239B3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.logoContainer,
          {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
          },
        ]}
      >
        <Text style={[styles.logoIcon, { fontSize: currentSize.icon }]}>
          🎁
        </Text>
      </LinearGradient>
      {showText && (
        <Text style={[styles.logoText, { fontSize: currentSize.text }]}>
          Mayra Impex
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C239B3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoIcon: {
    color: "#fff",
  },
  logoText: {
    fontWeight: "700",
    color: "#333",
    letterSpacing: 0.5,
  },
});

export default AppLogo;
