import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useThemeStore from "../../store/themeStore";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const DashboardTab = ({ stats, refetch }) => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats?.stats?.totalProducts || 0,
      bgColor: "#EFF6FF",
      iconColor: "#3B82F6",
      iconName: "cube-outline",
    },
    {
      title: "Total Orders",
      value: stats?.stats?.totalOrders || 0,
      bgColor: "#F0FDF4",
      iconColor: "#10B981",
      iconName: "receipt-outline",
    },
    {
      title: "Pending Orders",
      value: stats?.stats?.pendingOrders || 0,
      bgColor: "#FFFBEB",
      iconColor: "#F59E0B",
      iconName: "time-outline",
    },
    {
      title: "Total Customers",
      value: stats?.stats?.totalCustomers || 0,
      bgColor: "#F3E8FF",
      iconColor: "#8B5CF6",
      iconName: "people-outline",
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#3B82F6"]}
          tintColor="#3B82F6"
        />
      }
      style={styles.scrollContainer}
    >
      <Text style={styles.statsTitle}>Dashboard Overview</Text>
      <Text style={styles.statsSubtitle}>Key metrics and statistics</Text>

      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { backgroundColor: stat.bgColor }]}
          >
            <View
              style={[
                styles.iconContainerTop,
                { backgroundColor: stat.bgColor },
              ]}
            >
              <Ionicons name={stat.iconName} size={28} color={stat.iconColor} />
            </View>
            <Text style={[styles.statValue, { color: "#111827" }]}>
              {stat.value.toLocaleString()}
            </Text>
            <Text style={[styles.statTitle, { color: "#6B7280" }]}>
              {stat.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Business Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Revenue Status</Text>
            <Text style={styles.summaryValue}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Last Updated</Text>
            <Text style={styles.summaryValue}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: "#FFFFFF",
  },
  statsTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "800",
    marginBottom: SPACING.xs,
    color: "#111827",
  },
  statsSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: "#6B7280",
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statCard: {
    width: "48%",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.small,
  },
  iconContainerTop: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  statValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "800",
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  summarySection: {
    marginTop: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.md,
    color: "#111827",
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: "#111827",
  },
});

export default DashboardTab;
