import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { activityAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const ActivityLogTab = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const {
    data: logsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: () => activityAPI.getActivityLogs({ limit: 100 }),
    retry: 0,
    staleTime: 60000,
  });

  const logs = logsData?.logs || logsData?.data || [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
        }}
      >
        <Text style={[styles.productsTitle, { color: currentTheme.text }]}>
          📜 Activity Logs
        </Text>
        <Text
          style={{
            color: currentTheme.textLight,
            fontSize: FONTS.sizes.sm,
            marginTop: SPACING.sm,
          }}
        >
          Total Activities: {logs.length}
        </Text>
      </View>
      <FlatList
        data={logs}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        renderItem={({ item }) => (
          <View
            style={[
              styles.orderCard,
              {
                backgroundColor: currentTheme.cardBackground,
                marginHorizontal: SPACING.lg,
                marginVertical: SPACING.sm,
              },
            ]}
          >
            <Text style={[styles.orderId, { color: currentTheme.text }]}>
              {item.action} • {item.entity_type}
            </Text>
            <Text style={[styles.orderDate, { color: currentTheme.textLight }]}>
              👤 {item.performed_by}
            </Text>
            <Text
              style={{
                color: currentTheme.textLight,
                fontSize: FONTS.sizes.xs,
                marginTop: SPACING.sm,
              }}
            >
              🕐 {formatDate(item.created_at)}
            </Text>
            {item.description && (
              <Text
                style={{
                  color: currentTheme.textLight,
                  fontSize: FONTS.sizes.sm,
                  marginTop: SPACING.sm,
                }}
              >
                {item.description}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: currentTheme.text }}>
              No activity logs yet
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  productsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  orderCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  orderId: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  orderDate: {
    fontSize: FONTS.sizes.xs,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ActivityLogTab;
