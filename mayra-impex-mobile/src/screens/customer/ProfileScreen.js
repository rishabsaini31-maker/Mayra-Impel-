import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { TextInput, Button } from "../../components/shared";
import { authAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const ProfileScreen = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const hasChanges = useMemo(() => {
    return (
      name.trim() !== (user?.name || "") ||
      email.trim().toLowerCase() !== (user?.email || "")
    );
  }, [name, email, user]);

  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: async (response) => {
      await updateUser(response.user);
      setName(response.user.name || "");
      setEmail(response.user.email || "");
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    },
    onError: (error) => {
      Alert.alert(
        "Update Failed",
        error.response?.data?.error ||
          "Could not update profile. Please try again.",
      );
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setIsEditing(false);
  };

  const handleUpdateProfile = () => {
    if (!isEditing) {
      Alert.alert("Info", "Tap Edit first to make changes.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Validation", "Name is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Validation", "Please enter a valid email");
      return;
    }

    if (!hasChanges) {
      Alert.alert("Info", "No changes to update");
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
  };

  const handleMyOrders = () => {
    navigation.navigate("MyOrders");
  };

  const performLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } catch (error) {
      Alert.alert("Error", "Logout failed. Please try again.");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      performLogout();
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileIconWrap}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>My Profile</Text>
            <Text style={styles.summarySubtitle}>Account Summary</Text>
          </View>
        </View>
        <Text style={styles.summaryText}>Name: {user?.name || "-"}</Text>
        <Text style={styles.summaryText}>Email: {user?.email || "-"}</Text>
        <Text style={styles.summaryText}>Role: Customer</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>
          {isEditing ? "Edit Profile" : "Account Actions"}
        </Text>

        {isEditing ? (
          <>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              editable
              helperText="You can edit your name"
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              editable
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Use a valid email address"
            />

            <View style={styles.buttonGroup}>
              <Button
                title="Update Profile"
                onPress={handleUpdateProfile}
                loading={updateProfileMutation.isPending}
                disabled={updateProfileMutation.isPending}
                style={styles.buttonSpacing}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancelEdit}
              />
            </View>
          </>
        ) : (
          <View style={styles.buttonGroup}>
            <Text style={styles.sectionLabel}>Quick Actions</Text>
            <Button
              title="Edit Profile"
              variant="outline"
              onPress={handleEdit}
              style={styles.buttonSpacing}
            />
            <Button
              title="My Orders"
              variant="secondary"
              onPress={handleMyOrders}
              style={styles.buttonSpacing}
            />
            <Button title="Logout" variant="danger" onPress={handleLogout} />
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        style={styles.backRow}
      >
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  summaryTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  summarySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  profileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  profileIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  heading: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  buttonGroup: {
    marginTop: SPACING.sm,
  },
  buttonSpacing: {
    marginBottom: SPACING.sm,
  },
  backRow: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  backText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default ProfileScreen;
