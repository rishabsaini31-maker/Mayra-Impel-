import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { orderAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import { LoadingSpinner } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";
import { Sidebar } from "../../components/admin";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import CustomersTab from "./CustomersTab";
import CategoriesTab from "./CategoriesTab";
import BannersTab from "./BannersTab";
import DashboardTab from "./DashboardTab";
import AnalyticsTab from "./AnalyticsTab";
import ActivityLogTab from "./ActivityLogTab";
import CustomerSegmentsTab from "./CustomerSegmentsTab";
import ProfileTab from "./ProfileTab";
import SettingsTab from "./SettingsTab";

const { width } = Dimensions.get("window");

const AdminDashboardScreen = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const allThemes = useThemeStore((state) => state.getAllThemes());
  const [activeTab, setActiveTab] = useState("customers");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Log user info for debugging
  useEffect(() => {
    console.log("Admin Dashboard loaded with user:", {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      is_admin: user?.role === "admin",
    });
  }, []);

  // Auto-close sidebar when switching tabs
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  const {
    data: stats,
    isLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: orderAPI.getDashboardStats,
    retry: 0,
    staleTime: 60000,
  });

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "grid-outline",
      color: "#3b82f6",
    },
    {
      id: "orders",
      label: "Orders",
      icon: "receipt-outline",
      color: "#10b981",
    },
    {
      id: "customers",
      label: "Customers",
      icon: "people-outline",
      color: "#8b5cf6",
    },
    {
      id: "products",
      label: "Manage Products",
      icon: "cube-outline",
      color: "#f59e0b",
    },
    {
      id: "addproducts",
      label: "Add New Product",
      icon: "add-circle-outline",
      color: "#ec4899",
    },
    {
      id: "categories",
      label: "Manage Categories",
      icon: "pricetags-outline",
      color: "#06b6d4",
    },
    {
      id: "banners",
      label: "Slider Images",
      icon: "images-outline",
      color: "#0ea5e9",
    },
    {
      id: "activity",
      label: "Activity Log",
      icon: "time-outline",
      color: "#8b5cf6",
    },
    {
      id: "segments",
      label: "Customer Segments",
      icon: "git-network-outline",
      color: "#06b6d4",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: "person-circle-outline",
      color: "#14b8a6",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: "bar-chart-outline",
      color: "#06b6d4",
    },
    {
      id: "settings",
      label: "Customize App",
      icon: "settings-outline",
      color: "#ef4444",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "products":
      case "addproducts":
        return <ProductsTab activeTab={activeTab} />;
      case "categories":
        return <CategoriesTab />;
      case "banners":
        return <BannersTab />;
      case "customers":
        return <CustomersTab />;
      case "orders":
        return <OrdersTab />;
      case "activity":
        return <ActivityLogTab />;
      case "segments":
        return <CustomerSegmentsTab />;
      case "profile":
        return <ProfileTab user={user} currentTheme={currentTheme} />;
      case "settings":
        return (
          <SettingsTab
            currentTheme={currentTheme}
            allThemes={allThemes}
            setTheme={setTheme}
          />
        );
      case "analytics":
        return <AnalyticsTab stats={stats} refetch={refetchStats} />;
      default:
        if (isLoading) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={{ color: currentTheme.text }}>
                Loading dashboard...
              </Text>
            </View>
          );
        }
        if (statsError) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>⚠️</Text>
              <Text style={[styles.emptyText, { color: currentTheme.text }]}>
                Failed to load dashboard
              </Text>
              <Text
                style={[styles.emptySubtext, { color: currentTheme.textLight }]}
              >
                {statsError.message ||
                  "Please check your connection and try again"}
              </Text>
              <TouchableOpacity
                onPress={() => refetchStats()}
                style={[
                  styles.retryButton,
                  { backgroundColor: currentTheme.primary },
                ]}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return stats ? (
          <DashboardTab stats={stats} refetch={refetchStats} />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>📊</Text>
            <Text style={[styles.emptyText, { color: currentTheme.text }]}>
              Dashboard data unavailable
            </Text>
            <Text
              style={[styles.emptySubtext, { color: currentTheme.textLight }]}
            >
              Try navigating to another tab and coming back
            </Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: "#F3F4F6" }]}>
      {/* Overlay Background when sidebar is open */}
      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.sidebarOverlay}
          onPress={() => setIsSidebarOpen(false)}
          activeOpacity={0.5}
        />
      )}

      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          user={user}
          currentTheme={currentTheme}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuItems={menuItems}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setIsSidebarOpen(!isSidebarOpen)}
              style={styles.toggleButton}
            >
              <Ionicons
                name={isSidebarOpen ? "close" : "menu"}
                size={24}
                color="#111827"
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>
                {menuItems.find((m) => m.id === activeTab)?.label ||
                  "Dashboard"}
              </Text>
              <Text style={styles.headerSubtitle}>Manage your business</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.userGreeting}>{user?.name?.split(" ")[0]}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>{renderContent()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    ...SHADOWS.small,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: "#6B7280",
    marginTop: 2,
  },
  headerRight: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: "#EFF6FF",
    borderRadius: RADIUS.md,
  },
  userGreeting: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: "#3B82F6",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.sm,
    textAlign: "center",
    color: "#111827",
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    textAlign: "center",
    color: "#6B7280",
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: "#3B82F6",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: FONTS.sizes.sm,
  },
});

export default AdminDashboardScreen;
