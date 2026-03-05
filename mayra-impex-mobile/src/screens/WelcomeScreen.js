import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, SPACING } from "../constants";

const { width, height } = Dimensions.get("window");

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate to login after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleGetStarted = () => {
    navigation.replace("Login");
  };

  const rotate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Brand with animation */}
        <Animated.View
          style={[styles.logoContainer, { transform: [{ rotate }] }]}
        >
          <LinearGradient
            colors={[COLORS.white, COLORS.accentLight]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>🛍️</Text>
          </LinearGradient>
        </Animated.View>

        {/* Welcome Text */}
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.brandName}>MAYRA IMPEX</Text>

        {/* Subtitle with badge */}
        <View style={styles.badgeContainer}>
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            style={styles.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.badgeText}>✨ Premium Wholesale Platform</Text>
          </LinearGradient>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Your trusted platform for bulk orders{"\n"}
          and wholesale pricing
        </Text>

        {/* Features list */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💎</Text>
            <Text style={styles.featureText}>Premium Quality</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚀</Text>
            <Text style={styles.featureText}>Fast Delivery</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Secure Payment</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.white, "rgba(255,255,255,0.9)"]}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Text style={styles.buttonIcon}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Auto-navigate hint */}
        <Text style={styles.hint}>Auto-redirecting in 3 seconds...</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -100,
    right: -100,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    bottom: -50,
    left: -50,
  },
  circle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    top: height * 0.3,
    left: -30,
  },
  content: {
    alignItems: "center",
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 64,
  },
  title: {
    fontSize: 20,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
    opacity: 0.9,
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 42,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontWeight: "800",
    marginBottom: SPACING.md,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  badgeContainer: {
    marginBottom: SPACING.lg,
  },
  badge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: "center",
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xl,
    opacity: 0.9,
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  featureText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.medium,
    textAlign: "center",
    opacity: 0.9,
  },
  buttonWrapper: {
    width: "100%",
    marginBottom: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    fontWeight: "700",
    marginRight: SPACING.sm,
  },
  buttonIcon: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  hint: {
    fontSize: 13,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    marginTop: SPACING.md,
    opacity: 0.7,
  },
});

export default WelcomeScreen;
