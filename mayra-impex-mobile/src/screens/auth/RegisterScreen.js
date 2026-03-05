import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import { TextInput, Button, AppLogo } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants";

const RegisterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);

      await setAuth(response.user, response.token);

      Alert.alert("Success", "Registration successful!");
      // Navigation will be handled automatically by the navigation container
    } catch (error) {
      console.error("Register error:", error);
      Alert.alert(
        "Registration Failed",
        error.response?.data?.error || "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppLogo size="large" showText={true} />
          <Text style={styles.subtitle}>Perfect Gifts for Every Occasion</Text>
          <Text style={styles.welcomeText}>Create Your Account</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            rules={{
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
            name="name"
          />

          <Controller
            control={control}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={(text) => onChange(text.trim())}
                value={value}
                error={errors.email?.message}
              />
            )}
            name="email"
          />

          <Controller
            control={control}
            rules={{
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
            name="password"
          />

          <Button
            title="Register"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Already have an account? Login"
            variant="outline"
            onPress={() => navigation.navigate("Login")}
            style={styles.loginButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  welcomeText: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  socialButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  socialIcon: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.primary,
  },
  socialText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
  form: {
    width: "100%",
  },
  loginButton: {
    marginTop: SPACING.md,
  },
});

export default RegisterScreen;
