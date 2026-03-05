import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, SHADOWS } from "../../constants";

const BottomNav = ({ activeTab = "Home", onTabPress }) => {
  const tabs = [
    { id: "Home", label: "Home", icon: "🏠" },
    { id: "Products", label: "Products", icon: "🎁" },
    { id: "Cart", label: "Cart", icon: "🛒" },
    { id: "Account", label: "Account", icon: "👤" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isActive && styles.activeIconContainer,
              ]}
            >
              <Text style={[styles.icon, isActive && styles.activeIcon]}>
                {tab.icon}
              </Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + "30",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    ...SHADOWS.medium,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    position: "relative",
  },
  activeIconContainer: {
    backgroundColor: COLORS.primaryLight + "30",
  },
  icon: {
    fontSize: 22,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  label: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: "500",
    marginTop: 2,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default BottomNav;
