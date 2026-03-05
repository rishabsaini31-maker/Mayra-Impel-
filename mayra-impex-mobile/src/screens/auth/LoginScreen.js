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
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");
  const isSubmitDisabled =
    loading || !emailValue?.trim() || !passwordValue?.trim();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
      };
      const response = await authAPI.login(payload);

      await setAuth(response.user, response.token);

      // Navigation will be handled automatically by the navigation container
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.error ||
          "Please check your credentials and try again.",
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
          <Text style={styles.welcomeText}>Welcome Back!</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formDescription}>
              Sign in with your registered email address
            </Text>
          </View>

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
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={(text) => onChange(text.replace(/\s/g, ""))}
                value={value}
                error={errors.email?.message}
                helperText="Example: name@company.com"
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
                secureTextEntry={!showPassword}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Text style={styles.toggleText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                }
              />
            )}
            name="password"
          />

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={isSubmitDisabled}
            style={styles.loginButton}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
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
            title="Don't have an account? Register"
            variant="outline"
            onPress={() => navigation.navigate("Register")}
            style={styles.registerButton}
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
  formCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  formHeader: {
    marginBottom: SPACING.md,
  },
  formTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  forgotWrap: {
    alignItems: "flex-end",
    marginBottom: SPACING.md,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  loginButton: {
    marginTop: SPACING.xs,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
});

export default LoginScreen;
