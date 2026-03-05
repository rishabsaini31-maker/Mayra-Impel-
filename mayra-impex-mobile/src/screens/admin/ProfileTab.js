import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const ProfileTab = ({ user, currentTheme }) => {
  return (
    <View>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarLetter}>
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: currentTheme.text }]}>
            {user?.name}
          </Text>
          <Text style={[styles.profileRole, { color: currentTheme.textLight }]}>
            {user?.role === "admin" ? "Administrator" : "User"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <Text style={[styles.profileLabel, { color: currentTheme.textLight }]}>
          Email Address
        </Text>
        <Text style={[styles.profileValue, { color: currentTheme.text }]}>
          {user?.email}
        </Text>
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <Text style={[styles.profileLabel, { color: currentTheme.textLight }]}>
          Account Type
        </Text>
        <Text style={[styles.profileValue, { color: currentTheme.text }]}>
          {user?.role === "admin" ? "Admin Account" : "Customer Account"}
        </Text>
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <Text style={[styles.profileLabel, { color: currentTheme.textLight }]}>
          Full Name
        </Text>
        <Text style={[styles.profileValue, { color: currentTheme.text }]}>
          {user?.name}
        </Text>
      </View>

      <TouchableOpacity style={styles.actionCard}>
        <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.lg,
  },
  avatarLetter: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: "700",
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  profileRole: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  profileCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  profileLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  profileValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  actionCard: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  editButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.text,
  },
});

export default ProfileTab;
