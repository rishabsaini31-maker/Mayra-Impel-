import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";
import {
  SearchBar,
  FilterBar,
  SortOptions,
  ExportButton,
} from "../../components/admin/AdminFeatures";

const OrdersTab = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const {
    data: ordersData,
    isLoading,
    error,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["allOrders"],
    queryFn: async () => {
      console.log("Fetching orders from admin...");
      const result = await orderAPI.getAllOrders();
      console.log("Orders data received:", {
        count: result?.orders?.length || 0,
      });
      return result;
    },
    retry: 1,
    staleTime: 0,
    cacheTime: 5000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchOrders();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: currentTheme.text }}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>⚠️</Text>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          Failed to load orders
        </Text>
        <Text style={[styles.emptySubtext, { color: currentTheme.textLight }]}>
          {error.message || "Please check your connection and try again"}
        </Text>
        <TouchableOpacity
          onPress={() => refetchOrders()}
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

  const orders = ordersData?.orders || [];

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.users?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.includes(searchQuery);
      const matchesStatus =
        filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "recent")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

  if (filteredOrders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="inbox-outline"
          size={56}
          color="#D1D5DB"
          style={{ marginBottom: SPACING.lg }}
        />
        <Text style={styles.emptyText}>
          {searchQuery || filterStatus !== "all"
            ? "No orders match"
            : "No orders found"}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery || filterStatus !== "all"
            ? "Try adjusting your search or filters"
            : "Orders will appear here once customers place them"}
        </Text>
        <TouchableOpacity
          onPress={() => refetchOrders()}
          style={[styles.retryButton, { marginTop: SPACING.lg }]}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#D1FAE5", text: "#065F46", icon: "✓" };
      case "rejected":
        return { bg: "#FEE2E2", text: "#7F1D1D", icon: "✕" };
      case "pending":
        return { bg: "#FEF3C7", text: "#78350F", icon: "◌" };
      default:
        return { bg: "#E5E7EB", text: "#374151", icon: "◌" };
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleExportOrders = async () => {
    const response = await orderAPI.exportOrders();
    if (response?.emailSent) {
      Alert.alert("Export Sent", "Orders CSV has been emailed to admin.");
    } else {
      Alert.alert(
        "Export Complete",
        response?.emailWarning
          ? `CSV prepared but email failed: ${response.emailWarning}`
          : "CSV prepared successfully.",
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSubtitle}>
            {filteredOrders.length} order
            {filteredOrders.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <ExportButton
          data={filteredOrders}
          filename="orders"
          theme={currentTheme}
          onExport={handleExportOrders}
        />
      </View>

      {/* Search, Filter, and Sort */}
      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search orders..."
          theme={currentTheme}
        />
        <View style={styles.filterButtonsRow}>
          <FilterBar
            filters={[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ]}
            activeFilter={filterStatus}
            onSelectFilter={setFilterStatus}
            theme={currentTheme}
          />
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
        renderItem={({ item }) => {
          // Calculate total amount from order items
          const totalAmount =
            item.order_items?.reduce((sum, orderItem) => {
              return (
                sum + orderItem.quantity * (orderItem.products?.price || 0)
              );
            }, 0) || 0;

          const isExpanded = expandedOrderId === item.id;

          return (
            <TouchableOpacity
              style={[styles.orderCard]}
              activeOpacity={0.95}
              onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>
                    Order #{item.id.substring(0, 8)}
                  </Text>
                  <Text style={styles.orderDate}>
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(item.status).text },
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.orderDivider} />
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>
                    {item.users?.name || "Unknown"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>
                    {item.users?.phone || "—"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Items</Text>
                  <Text style={styles.detailValue}>
                    {item.order_items?.length || 0}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: "#E5E7EB",
                      paddingTopHorizontal: SPACING.md,
                    },
                  ]}
                >
                  <Text style={styles.detailLabelBold}>Total</Text>
                  <Text style={styles.detailValueBold}>
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
              {isExpanded && (
                <View style={styles.itemsList}>
                  <Text style={[styles.detailLabelBold, { marginBottom: 4 }]}>
                    Order Items
                  </Text>
                  {item.order_items?.map((orderItem, idx) => (
                    <Text key={idx} style={styles.orderItem}>
                      • {orderItem.products?.name || "Unknown"} (Qty:{" "}
                      {orderItem.quantity})
                      {orderItem.products?.price
                        ? ` — ₹${orderItem.products.price}`
                        : ""}
                    </Text>
                  ))}
                  <Text style={[styles.detailLabelBold, { marginTop: 8 }]}>
                    Delivery Info
                  </Text>
                  <Text style={styles.orderItem}>
                    Name: {item.delivery_name || "—"}
                  </Text>
                  <Text style={styles.orderItem}>
                    Phone: {item.delivery_phone || "—"}
                  </Text>
                  <Text style={styles.orderItem}>
                    Shop: {item.shop_name || "—"}
                  </Text>
                  <Text style={styles.orderItem}>
                    Address: {item.delivery_address || "—"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: "#111827",
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "800",
    color: "#111827",
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: "#9CA3AF",
  },
  filterSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterButtonsRow: {
    marginTop: SPACING.md,
  },
  listContainer: {
    paddingVertical: SPACING.lg,
  },
  orderCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: "#FFFFFF",
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: "#111827",
    marginBottom: SPACING.xs,
  },
  orderDate: {
    fontSize: FONTS.sizes.xs,
    color: "#9CA3AF",
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.md,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  orderDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: SPACING.md,
  },
  orderDetails: {
    gap: SPACING.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONTS.sizes.sm,
    color: "#6B7280",
    fontWeight: "600",
  },
  detailLabelBold: {
    fontSize: FONTS.sizes.sm,
    color: "#111827",
    fontWeight: "700",
  },
  detailValue: {
    fontSize: FONTS.sizes.sm,
    color: "#111827",
    fontWeight: "600",
  },
  detailValueBold: {
    fontSize: FONTS.sizes.md,
    color: "#3B82F6",
    fontWeight: "700",
  },
  itemsList: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  orderItem: {
    fontSize: FONTS.sizes.sm,
    color: "#6B7280",
    marginVertical: 2,
  },
});

export default OrdersTab;
