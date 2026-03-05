import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "../../api";
import { OrderStatusBadge } from "../../components/customer";
import { LoadingSpinner } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const OrderDetailScreen = ({ route }) => {
  const { orderId } = route.params || {};

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["orderDetail", orderId],
    queryFn: () => orderAPI.getById(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const order = data?.order;

  if (!order || error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Unable to load order</Text>
        <Text style={styles.emptyText}>
          Please pull down to refresh and try again.
        </Text>
      </View>
    );
  }

  const totalAmount =
    order.order_items?.reduce((sum, item) => {
      return sum + item.quantity * (item.products?.price || 0);
    }, 0) || 0;

  const totalItems =
    order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.orderId}>Order #{order.id?.slice(0, 8)}</Text>
          <OrderStatusBadge status={order.status} />
        </View>
        <Text style={styles.dateText}>
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Products</Text>
      {order.order_items?.map((item) => (
        <View key={item.id} style={styles.productCard}>
          <Text style={styles.productName}>
            {item.products?.name || "Product"}
          </Text>
          {item.products?.serial_number ? (
            <Text style={styles.productSku}>
              SKU: {item.products.serial_number}
            </Text>
          ) : null}
          <View style={styles.productRow}>
            <Text style={styles.productMeta}>Qty: {item.quantity}</Text>
            <Text style={styles.productMeta}>
              ₹{((item.products?.price || 0) * item.quantity).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  orderId: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  productName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  productSku: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productMeta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    textAlign: "center",
  },
});

export default OrderDetailScreen;
