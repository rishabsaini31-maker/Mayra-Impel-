import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { userAPI, notesAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";
import {
  SearchBar,
  CustomerNotesModal,
  ExportButton,
} from "../../components/admin/AdminFeatures";

const CustomersTab = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: userAPI.getAllCustomers,
    retry: 0,
    staleTime: 60000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isBlockingCustomer, setIsBlockingCustomer] = useState(false);
  const [customerTab, setCustomerTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleExportCustomers = async () => {
    const response = await userAPI.exportCustomers();
    if (response?.emailSent) {
      Alert.alert("Export Sent", "Customers CSV has been emailed to admin.");
    } else {
      Alert.alert(
        "Export Complete",
        response?.emailWarning
          ? `CSV prepared but email failed: ${response.emailWarning}`
          : "CSV prepared successfully.",
      );
    }
  };

  const handleBlockCustomer = async () => {
    try {
      setIsBlockingCustomer(true);
      await userAPI.blockCustomer(selectedCustomer.id);

      const updatedCustomer = { ...selectedCustomer, is_blocked: true };
      setSelectedCustomer(updatedCustomer);

      setShowCustomerModal(false);
      await refetch();

      Alert.alert("Success", "Customer blocked successfully");
    } catch (err) {
      console.error("Block error:", err);
      Alert.alert("Error", err.message || "Failed to block customer");
    } finally {
      setIsBlockingCustomer(false);
    }
  };

  const handleUnblockCustomer = async () => {
    try {
      setIsBlockingCustomer(true);
      await userAPI.unblockCustomer(selectedCustomer.id);

      const updatedCustomer = { ...selectedCustomer, is_blocked: false };
      setSelectedCustomer(updatedCustomer);

      setShowCustomerModal(false);
      await refetch();

      Alert.alert("Success", "Customer unblocked successfully");
    } catch (err) {
      console.error("Unblock error:", err);
      Alert.alert("Error", err.message || "Failed to unblock customer");
    } finally {
      setIsBlockingCustomer(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: currentTheme.text }}>Loading customers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>⚠️</Text>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          Failed to load customers
        </Text>
        <Text style={[styles.emptySubtext, { color: currentTheme.textLight }]}>
          {error.message || "Please check your connection and try again"}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
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

  const customers = customersData?.data || [];

  let activeCustomers = customers.filter((c) => c.is_blocked !== true);
  let blockedCustomers = customers.filter((c) => c.is_blocked === true);

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    activeCustomers = activeCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query),
    );
    blockedCustomers = blockedCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query),
    );
  }

  if (customers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>👥</Text>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          No customers found
        </Text>
      </View>
    );
  }

  const renderCustomerList = (customerList, isBlocked = false) => {
    if (customerList.length === 0) {
      return (
        <View
          style={{
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.md,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: currentTheme.textLight,
              fontSize: FONTS.sizes.sm,
              fontStyle: "italic",
            }}
          >
            {isBlocked ? "No blocked customers" : "No active customers"}
          </Text>
        </View>
      );
    }

    return customerList.map((customer) => (
      <TouchableOpacity
        key={customer.id}
        onPress={() => {
          setSelectedCustomer(customer);
          setShowCustomerModal(true);
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["#f3f4f6", "#e5e7eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.customerCard,
            {
              backgroundColor: currentTheme.cardBackground,
              opacity: customer.is_blocked ? 0.5 : 1,
            },
          ]}
        >
          <View style={styles.customerCardContent}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>
                {customer.name?.charAt(0)?.toUpperCase() || "C"}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: currentTheme.text }]}>
                {customer.name}
              </Text>
              <Text
                style={[
                  styles.customerEmail,
                  { color: currentTheme.textLight },
                ]}
              >
                {customer.email}
              </Text>
              {customer.phone && (
                <Text
                  style={[
                    styles.customerPhone,
                    { color: currentTheme.textLight },
                  ]}
                >
                  📱 {customer.phone}
                </Text>
              )}
              <Text style={[styles.customerRole, { color: "#6366f1" }]}>
                {customer.role === "admin" ? "Admin" : "Customer"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search customers..."
          theme={currentTheme}
        />
      </View>

      {/* Tab Bar */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: currentTheme.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.sm,
          gap: SPACING.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => setCustomerTab("active")}
          style={[
            {
              flex: 1,
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                customerTab === "active" ? currentTheme.primary : "transparent",
            },
          ]}
        >
          <Text
            style={{
              color:
                customerTab === "active" ? "white" : currentTheme.textLight,
              fontWeight: customerTab === "active" ? "700" : "600",
              fontSize: FONTS.sizes.md,
            }}
          >
            ✅ Active ({activeCustomers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCustomerTab("blocked")}
          style={[
            {
              flex: 1,
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                customerTab === "blocked" ? "#ef4444" : "transparent",
            },
          ]}
        >
          <Text
            style={{
              color:
                customerTab === "blocked" ? "white" : currentTheme.textLight,
              fontWeight: customerTab === "blocked" ? "700" : "600",
              fontSize: FONTS.sizes.md,
            }}
          >
            🚫 Blocked ({blockedCustomers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Export Button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
        }}
      >
        <ExportButton
          data={customerTab === "active" ? activeCustomers : blockedCustomers}
          filename={`customers_${customerTab}`}
          theme={currentTheme}
          onExport={handleExportCustomers}
        />
      </View>

      {/* Content */}
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
        {customerTab === "active" ? (
          <View style={{ paddingVertical: SPACING.md }}>
            {activeCustomers.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: SPACING.xl,
                }}
              >
                <Text
                  style={{
                    color: currentTheme.textLight,
                    fontSize: FONTS.sizes.md,
                  }}
                >
                  No active customers
                </Text>
              </View>
            ) : (
              renderCustomerList(activeCustomers, false)
            )}
          </View>
        ) : (
          <View style={{ paddingVertical: SPACING.md }}>
            {blockedCustomers.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: SPACING.xl,
                }}
              >
                <Text
                  style={{
                    color: currentTheme.textLight,
                    fontSize: FONTS.sizes.md,
                  }}
                >
                  No blocked customers
                </Text>
              </View>
            ) : (
              renderCustomerList(blockedCustomers, true)
            )}
          </View>
        )}
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={showCustomerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: currentTheme.cardBackground,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowCustomerModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={{ fontSize: 24 }}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: "center", marginBottom: SPACING.lg }}>
                <View
                  style={[
                    styles.customerAvatar,
                    { width: 80, height: 80, marginBottom: SPACING.md },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { fontSize: 32, fontWeight: "bold" },
                    ]}
                  >
                    {selectedCustomer?.name?.charAt(0)?.toUpperCase() || "C"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: currentTheme.text, textAlign: "center" },
                  ]}
                >
                  {selectedCustomer?.name}
                </Text>
                {selectedCustomer?.is_blocked && (
                  <Text style={{ color: "#ef4444", marginTop: SPACING.sm }}>
                    🚫 This customer is blocked
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.customerDetailCard,
                  { backgroundColor: currentTheme.background },
                ]}
              >
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: currentTheme.textLight },
                    ]}
                  >
                    Email
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: currentTheme.text }]}
                  >
                    {selectedCustomer?.email}
                  </Text>
                </View>

                {selectedCustomer?.phone && (
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: currentTheme.textLight },
                      ]}
                    >
                      Phone
                    </Text>
                    <Text
                      style={[styles.detailValue, { color: currentTheme.text }]}
                    >
                      {selectedCustomer.phone}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: currentTheme.textLight },
                    ]}
                  >
                    Role
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          selectedCustomer?.role === "admin"
                            ? "#3b82f6"
                            : "#10b981",
                      },
                    ]}
                  >
                    {selectedCustomer?.role === "admin"
                      ? "Administrator"
                      : "Customer"}
                  </Text>
                </View>
              </View>

              <View
                style={{ marginTop: SPACING.lg, paddingHorizontal: SPACING.md }}
              >
                <TouchableOpacity
                  onPress={() => setShowNotesModal(true)}
                  style={[
                    styles.actionButtonBlock,
                    {
                      backgroundColor: currentTheme.primary,
                      paddingVertical: SPACING.md,
                      borderRadius: RADIUS.lg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    📝 View Notes
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedCustomer?.role !== "admin" && (
                <View style={{ gap: SPACING.md, marginTop: SPACING.lg }}>
                  {selectedCustomer?.is_blocked ? (
                    <TouchableOpacity
                      onPress={handleUnblockCustomer}
                      disabled={isBlockingCustomer}
                      style={[
                        styles.actionButtonUnblock,
                        {
                          backgroundColor: "#10b981",
                          opacity: isBlockingCustomer ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: FONTS.sizes.md,
                        }}
                      >
                        {isBlockingCustomer
                          ? "Unblocking..."
                          : "✅ Unblock Customer"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Block Customer",
                          `Are you sure you want to block ${selectedCustomer?.name}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Block",
                              style: "destructive",
                              onPress: handleBlockCustomer,
                            },
                          ],
                        );
                      }}
                      disabled={isBlockingCustomer}
                      style={[
                        styles.actionButtonBlock,
                        {
                          backgroundColor: "#ef4444",
                          opacity: isBlockingCustomer ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: FONTS.sizes.md,
                        }}
                      >
                        {isBlockingCustomer
                          ? "Blocking..."
                          : "🚫 Block Customer"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {selectedCustomer && (
        <CustomerNotesModal
          visible={showNotesModal}
          customerId={selectedCustomer.id}
          onClose={() => setShowNotesModal(false)}
          theme={currentTheme}
          notesAPI={notesAPI}
        />
      )}
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
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  customerCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  customerCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  customerEmail: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs,
  },
  customerPhone: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs,
  },
  customerRole: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "90%",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: SPACING.md,
    marginRight: -SPACING.md,
    marginTop: -SPACING.md,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "800",
    marginBottom: SPACING.md,
  },
  customerDetailCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  detailLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  actionButtonUnblock: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  actionButtonBlock: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
});

export default CustomersTab;
