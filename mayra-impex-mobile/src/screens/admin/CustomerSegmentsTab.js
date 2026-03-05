import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { userAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const CustomerSegmentsTab = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const { data: segmentsData, isLoading } = useQuery({
    queryKey: ["customerSegments"],
    queryFn: userAPI.getCustomerSegments,
    retry: 0,
    staleTime: 60000,
  });

  const segments = segmentsData?.segments ||
    segmentsData?.data || [
      {
        id: 1,
        name: "VIP Customers",
        icon: "👑",
        count: 0,
        description: "High-value customers",
      },
      {
        id: 2,
        name: "High Spenders",
        icon: "💰",
        count: 0,
        description: "Top spenders this month",
      },
      {
        id: 3,
        name: "Inactive Customers",
        icon: "😴",
        count: 0,
        description: "No recent orders",
      },
      {
        id: 4,
        name: "New Customers",
        icon: "🆕",
        count: 0,
        description: "Joined recently",
      },
    ];

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
          👥 Customer Segments
        </Text>
        <Text
          style={{
            color: currentTheme.textLight,
            fontSize: FONTS.sizes.sm,
            marginTop: SPACING.sm,
          }}
        >
          Manage and view customer segments
        </Text>
      </View>
      <FlatList
        data={segments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.productCard,
              {
                backgroundColor: currentTheme.cardBackground,
                marginHorizontal: SPACING.lg,
                marginVertical: SPACING.sm,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.productName, { color: currentTheme.text }]}
                >
                  {item.icon} {item.name}
                </Text>
                <Text
                  style={{
                    color: currentTheme.textLight,
                    fontSize: FONTS.sizes.sm,
                  }}
                >
                  {item.description}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: currentTheme.primary + "20",
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.md,
                }}
              >
                <Text
                  style={{
                    color: currentTheme.primary,
                    fontWeight: "bold",
                    fontSize: FONTS.sizes.md,
                  }}
                >
                  {item.count}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  productsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  productCard: {
    flexDirection: "row",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  productName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
});

export default CustomerSegmentsTab;
