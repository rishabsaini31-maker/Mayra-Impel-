import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "../../api";
import { OrderStatusBadge } from "../../components/customer";
import { LoadingSpinner } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const MyOrdersScreen = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => orderAPI.getMyOrders({ page: 1, limit: 50 }),
  });

  const handleOrderPress = (order) => {
    navigation.navigate("OrderDetail", { orderId: order.id });
  };

  const renderOrder = ({ item }) => {
    const totalItems = item.order_items.reduce(
      (sum, orderItem) => sum + orderItem.quantity,
      0,
    );
    const productSummary = item.order_items
      .slice(0, 2)
      .map((orderItem) => {
        const productName = orderItem.products?.name || "Product";
        const sku = orderItem.products?.serial_number
          ? ` (SKU: ${orderItem.products.serial_number})`
          : "";
        return `${productName}${sku}`;
      })
      .join(", ");

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
          <OrderStatusBadge status={item.status} />
        </View>

        <Text style={styles.orderDate}>
          {new Date(item.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {productSummary ? (
          <Text style={styles.productSummary} numberOfLines={2}>
            {productSummary}
            {item.order_items.length > 2 ? " ..." : ""}
          </Text>
        ) : null}

        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{totalItems} items</Text>
          <Text style={styles.viewDetails}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.orders || []}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  orderDate: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  productSummary: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  viewDetails: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
});

export default MyOrdersScreen;
