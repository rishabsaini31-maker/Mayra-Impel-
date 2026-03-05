import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  Alert,
  TouchableOpacity,
  AppState,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { BlurView } from "expo-blur";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import { COLORS, USER_ROLES } from "../constants";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import SplashScreen from "../screens/SplashScreen";

// Customer Screens
import HomeScreen from "../screens/customer/HomeScreen";
import ProductDetailScreen from "../screens/customer/ProductDetailScreen";
import CartScreen from "../screens/customer/CartScreen";
import MyOrdersScreen from "../screens/customer/MyOrdersScreen";
import OrderDetailScreen from "../screens/customer/OrderDetailScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";

import CheckoutScreen from "../screens/customer/CheckoutScreen";

// Admin Screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const INACTIVITY_TIMEOUT_MS =
  Number(process.env.EXPO_PUBLIC_INACTIVITY_TIMEOUT_MS) || 5 * 60 * 1000;

const AdminUnlockScreen = ({ onUnlock, onPasswordUnlock, onLogout }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      setPasswordError("Please enter password");
      return;
    }

    setIsVerifying(true);
    setPasswordError("");

    // Verify password (admin PIN is 3112)
    if (password === "3112") {
      setPassword("");
      setShowPassword(false);
      onPasswordUnlock();
    } else {
      setPasswordError("Invalid password");
      setPassword("");
    }

    setIsVerifying(false);
  };

  if (showPassword) {
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockTitle}>🔐 Admin Authentication</Text>
        <Text style={styles.lockSubtitle}>
          Enter your admin password to continue
        </Text>

        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter password"
            placeholderTextColor="#999"
            secureTextEntry={true}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
            editable={!isVerifying}
          />
        </View>

        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.unlockButton, isVerifying && { opacity: 0.6 }]}
          onPress={handlePasswordUnlock}
          disabled={isVerifying}
        >
          <Text style={styles.unlockButtonText}>
            {isVerifying ? "Verifying..." : "Unlock"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowPassword(false);
            setPassword("");
            setPasswordError("");
          }}
        >
          <Text style={styles.switchText}>Use Biometrics</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogout} style={{ marginTop: 16 }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.lockContainer}>
      <Text style={styles.lockTitle}>🔒 Admin Session Locked</Text>
      <Text style={styles.lockSubtitle}>Re-authenticate to continue</Text>
      <TouchableOpacity style={styles.unlockButton} onPress={onUnlock}>
        <Text style={styles.unlockButtonText}>🔓 Unlock with Biometrics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.unlockButton, styles.passwordButton]}
        onPress={() => setShowPassword(true)}
      >
        <Text style={styles.passwordButtonText}>🔑 Unlock with Password</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Stack.Screen
      name="Welcome"
      component={WelcomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ title: "Create Account" }}
    />
  </Stack.Navigator>
);

// Customer Tab Navigator
const CustomerTabs = () => {
  const cartItemsCount = useCartStore((state) => state.getTotalItems());

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold" },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          height: 70,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabel: ({ color, focused }) => {
          let label = "";
          if (route.name === "Home") {
            label = "Home";
          } else if (route.name === "Products") {
            label = "Products";
          } else if (route.name === "Cart") {
            label = "Cart";
          } else if (route.name === "Account") {
            label = "Account";
          }
          return (
            <Text
              style={{
                fontSize: 10,
                color,
                fontWeight: focused ? "700" : "600",
                marginTop: 2,
              }}
            >
              {label}
            </Text>
          );
        },
        tabBarIcon: ({ color, focused }) => {
          let icon = "";
          let label = "";
          if (route.name === "Home") {
            icon = "🏠";
            label = "Home";
          } else if (route.name === "Products") {
            icon = "🎁";
            label = "Products";
          } else if (route.name === "Cart") {
            icon = "🛒";
            label = "Cart";
          } else if (route.name === "Account") {
            icon = "👤";
            label = "Account";
          }
          return (
            <Text
              style={{
                fontSize: focused ? 28 : 24,
                marginBottom: 4,
                marginTop: 2,
              }}
            >
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Mayra Gifts" }}
      />
      <Tab.Screen
        name="Products"
        component={HomeScreen}
        initialParams={{ mode: "products" }}
        options={{ title: "All Products" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "My Cart",
          tabBarBadge: cartItemsCount > 0 ? cartItemsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.primary, color: "white" },
        }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{ title: "My Account" }}
      />
    </Tab.Navigator>
  );
};

// Customer Stack
const CustomerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Stack.Screen
      name="CustomerTabs"
      component={CustomerTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: "Product Details" }}
    />
    <Stack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ title: "Checkout" }}
    />
    <Stack.Screen
      name="MyOrders"
      component={MyOrdersScreen}
      options={{ title: "My Orders" }}
    />
    <Stack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ title: "Order Details" }}
    />
  </Stack.Navigator>
);

// Admin Stack
const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Stack.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
      options={{ title: "Admin Dashboard" }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const lastActivityAt = useAuthStore((state) => state.lastActivityAt);
  const adminBiometricUnlocked = useAuthStore(
    (state) => state.adminBiometricUnlocked,
  );
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const logout = useAuthStore((state) => state.logout);
  const markActivity = useAuthStore((state) => state.markActivity);
  const setAdminBiometricUnlocked = useAuthStore(
    (state) => state.setAdminBiometricUnlocked,
  );
  const appStateRef = useRef(AppState.currentState);
  const [isPromptingBiometric, setIsPromptingBiometric] = useState(false);
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      if (!lastActivityAt) return;

      if (now - lastActivityAt > INACTIVITY_TIMEOUT_MS) {
        await logout();
        Alert.alert("Session Expired", "Logged out due to inactivity.");
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivityAt, logout]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      return;
    }

    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState !== "active") {
        if (isAuthenticated && isAdmin) {
          setAdminBiometricUnlocked(false);
        }
        return;
      }

      if (prevState !== "active") {
        markActivity();
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, isAdmin, setAdminBiometricUnlocked, markActivity]);

  const promptBiometricUnlock = async () => {
    if (isPromptingBiometric) return;

    try {
      setIsPromptingBiometric(true);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometric Required",
          "Please enable Face ID / Touch ID (or device biometrics) for admin access.",
        );
        await logout();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Re-authenticate Admin Session",
        cancelLabel: "Logout",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setAdminBiometricUnlocked(true);
        markActivity();
        return;
      }

      await logout();
    } catch (error) {
      await logout();
    } finally {
      setIsPromptingBiometric(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin || adminBiometricUnlocked) return;
    if (appStateRef.current !== "active") return;

    promptBiometricUnlock();
  }, [isAuthenticated, isAdmin, adminBiometricUnlocked]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Check user role
  if (isAdmin) {
    if (!adminBiometricUnlocked) {
      return (
        <AdminUnlockScreen
          onUnlock={promptBiometricUnlock}
          onPasswordUnlock={() => {
            setAdminBiometricUnlocked(true);
            markActivity();
          }}
          onLogout={logout}
        />
      );
    }

    return <AdminStack />;
  }

  return <CustomerStack />;
};

export default function Navigation() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const markActivity = useAuthStore((state) => state.markActivity);
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      setShowPrivacyOverlay(nextState !== "active");
    });

    return () => sub.remove();
  }, []);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        if (isAuthenticated) markActivity();
        return false;
      }}
    >
      <NavigationContainer
        onStateChange={() => {
          if (isAuthenticated) markActivity();
        }}
      >
        <AppNavigator />
      </NavigationContainer>
      {isAuthenticated &&
        isAdmin &&
        showPrivacyOverlay &&
        (Platform.OS === "ios" ? (
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidPrivacyCover]} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  lockTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  lockSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 32,
  },
  passwordBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#F5F5F5",
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  unlockButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  passwordButton: {
    backgroundColor: "#10B981",
  },
  passwordButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  switchText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 12,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: "600",
    fontSize: 14,
  },
  androidPrivacyCover: {
    backgroundColor: "rgba(0,0,0,0.96)",
  },
});
