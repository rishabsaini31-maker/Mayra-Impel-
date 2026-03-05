import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import useThemeStore from "../../store/themeStore";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const AnalyticsTab = ({ stats, refetch }) => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[currentTheme.primary]}
          tintColor={currentTheme.primary}
        />
      }
    >
      <Text style={[styles.analyticsTitle, { color: currentTheme.text }]}>
        📊 Sales & Orders Analytics
      </Text>

      <View
        style={[
          styles.analyticsCard,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <Text
          style={[styles.analyticsLabel, { color: currentTheme.textLight }]}
        >
          Total Sales (Estimated)
        </Text>
        <Text style={[styles.analyticsBigValue, { color: "#10b981" }]}>
          ₹
          {stats?.stats?.totalSales
            ? stats.stats.totalSales.toLocaleString()
            : "0"}
        </Text>
      </View>

      <View style={styles.analyticsGrid}>
        <View
          style={[
            styles.analyticsSmallCard,
            { backgroundColor: currentTheme.cardBackground },
          ]}
        >
          <Text
            style={[styles.analyticsLabel, { color: currentTheme.textLight }]}
          >
            Pending
          </Text>
          <Text style={[styles.analyticsValue, { color: "#f59e0b" }]}>
            {stats?.stats?.pendingOrders || 0}
          </Text>
        </View>
        <View
          style={[
            styles.analyticsSmallCard,
            { backgroundColor: currentTheme.cardBackground },
          ]}
        >
          <Text
            style={[styles.analyticsLabel, { color: currentTheme.textLight }]}
          >
            Delivered
          </Text>
          <Text style={[styles.analyticsValue, { color: "#3b82f6" }]}>
            {(stats?.stats?.totalOrders || 0) -
              (stats?.stats?.pendingOrders || 0)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.analyticsCard,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <Text
          style={[styles.analyticsLabel, { color: currentTheme.textLight }]}
        >
          Average Order Value
        </Text>
        <Text style={[styles.analyticsBigValue, { color: "#8b5cf6" }]}>
          ₹
          {stats?.stats?.totalSales && stats?.stats?.totalOrders
            ? (stats.stats.totalSales / stats.stats.totalOrders).toFixed(0)
            : "0"}
        </Text>
      </View>

      <View
        style={[
          styles.analyticsCard,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <Text
          style={[styles.analyticsLabel, { color: currentTheme.textLight }]}
        >
          📈 Business Summary
        </Text>
        <View style={styles.summaryRow}>
          <Text
            style={{
              color: currentTheme.text,
              marginBottom: SPACING.md,
              fontWeight: "600",
            }}
          >
            📋 Total Orders: {stats?.stats?.totalOrders || 0}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text
            style={{
              color: currentTheme.text,
              marginBottom: SPACING.md,
              fontWeight: "600",
            }}
          >
            👥 Total Customers: {stats?.stats?.totalCustomers || 0}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: currentTheme.text, fontWeight: "600" }}>
            📦 Total Products: {stats?.stats?.totalProducts || 0}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analyticsTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "800",
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  analyticsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  analyticsLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  analyticsBigValue: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: "800",
  },
  analyticsValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "700",
  },
  analyticsGrid: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  analyticsSmallCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
    alignItems: "center",
  },
  summaryRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
});

export default AnalyticsTab;
