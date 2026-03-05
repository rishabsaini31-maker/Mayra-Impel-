import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants";

const SIDEBAR_WIDTH = 280;

const Sidebar = ({
  user,
  currentTheme,
  activeTab,
  setActiveTab,
  menuItems,
  onLogout,
}) => {
  return (
    <View style={[styles.sidebar, { backgroundColor: "#1F2937" }]}>
      <ScrollView
        style={styles.sidebarContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.adminIconWrap}>
            <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.adminName}>{user?.name}</Text>
          <Text style={styles.adminRole}>Administrator</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                activeTab === item.id && styles.menuItemActive,
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  activeTab === item.id && {
                    backgroundColor: item.color + "30",
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={activeTab === item.id ? item.color : "#9CA3AF"}
                />
              </View>
              <Text
                style={[
                  styles.menuLabel,
                  activeTab === item.id && styles.menuLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutMenuButton} onPress={onLogout}>
          <View style={styles.menuIconWrap}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </View>
          <Text style={styles.logoutMenuLabel}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    paddingTop: SPACING.lg,
    zIndex: 20,
    borderRightWidth: 1,
    borderRightColor: "#374151",
  },
  sidebarContent: {
    flex: 1,
  },
  logoArea: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: SPACING.md,
  },
  adminIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    backgroundColor: "#374151",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  adminName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: "#F3F4F6",
  },
  adminRole: {
    fontSize: FONTS.sizes.xs,
    color: "#9CA3AF",
    marginTop: 4,
  },
  menuContainer: {
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  menuItemActive: {
    backgroundColor: "#374151",
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    backgroundColor: "#4B5563",
  },
  menuLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: "#D1D5DB",
    flex: 1,
  },
  menuLabelActive: {
    color: "#F3F4F6",
    fontWeight: "700",
  },
  logoutMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  logoutMenuLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: SPACING.md,
  },
});

export default Sidebar;
