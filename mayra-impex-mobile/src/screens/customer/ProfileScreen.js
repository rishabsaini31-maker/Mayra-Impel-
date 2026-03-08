import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { TextInput, Button } from "../../components/shared";
import { authAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const ProfileScreen = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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

  const handleAddresses = () => {
    navigation.navigate("Addresses");
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

  if (!isAuthenticated) {
    // Guest view: show login button
    return (
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileIconWrap}>
              <Text style={styles.profileIcon}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Welcome, Guest</Text>
              <Text style={styles.summarySubtitle}>
                Sign in for full access
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Account</Text>
          <View style={styles.buttonGroup}>
            <Button
              title="Login"
              variant="primary"
              onPress={() => navigation.navigate("Login")}
              style={styles.buttonSpacing}
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.backRow}
        >
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Authenticated user view (modernized)
  return (
    <View style={styles.container}>
      <View style={styles.profileHeaderModern}>
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.avatar}
        />
        <Text style={styles.profileName}>{user?.name || "-"}</Text>
        <Text style={styles.profileEmail}>{user?.email || "-"}</Text>
      </View>

      {isEditing ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Edit Profile</Text>
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
        </View>
      ) : (
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.actionCard} onPress={handleEdit}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleMyOrders}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleAddresses}>
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionText}>Addresses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleLogout}>
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

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
  profileHeaderModern: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.lightGray,
  },
  profileName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  actionList: {
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  actionIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  actionText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    fontWeight: "600",
  },
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
