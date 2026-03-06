import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCartStore from "../../store/cartStore";
import useAuthStore from "../../store/authStore";
import { orderAPI } from "../../api";
import { TextInput, Button } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const CheckoutScreen = ({ navigation }) => {
  const queryClient = useQueryClient();
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());
  const clearCart = useCartStore((state) => state.clearCart);
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phoneNumber: user?.phone || "",
    shopName: "",
    deliveryAddress: "",
  });

  const [errors, setErrors] = useState({});

  const placeOrderMutation = useMutation({
    mutationFn: orderAPI.placeOrder,
    onSuccess: (data) => {
      // If order is present, treat as success even if warnings exist
      if (data?.order) {
        queryClient.invalidateQueries(["myOrders"]);
        clearCart();
        let msg =
          "Order placed successfully! You will receive confirmation via email and WhatsApp.";
        if (data.warnings && data.warnings.length > 0) {
          msg += "\n\nNote: " + data.warnings.join("\n");
        }
        Alert.alert("Success", msg, [
          { text: "OK", onPress: () => navigation.navigate("CustomerTabs") },
        ]);
      } else {
        Alert.alert("Error", "Order could not be placed. Please try again.");
      }
    },
    onError: (error) => {
      const serverError = error.response?.data;
      Alert.alert(
        "Error",
        serverError?.details ||
          serverError?.error ||
          "Failed to place order. Please try again.",
      );
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Phone number must be 10 digits";
    }
    if (!formData.shopName.trim()) {
      newErrors.shopName = "Shop name is required";
    }
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = "Delivery address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) {
      return;
    }

    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    const itemsSummary = items
      .map((item) => {
        const sku = item.product.serial_number
          ? ` | SKU: ${item.product.serial_number}`
          : "";
        return `• ${item.product.name} x${item.quantity}${sku}`;
      })
      .join("\n");

    const summary = `
Order Summary:
━━━━━━━━━━━━━━━━━━━━
Name: ${formData.fullName}
Shop: ${formData.shopName}
Phone: ${formData.phoneNumber}
Address: ${formData.deliveryAddress}

Items: ${items.length}
${itemsSummary}

Total: ₹${getTotalPrice.toFixed(2)}`;

    Alert.alert("Confirm Order", summary, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Place Order",
        onPress: () => {
          const orderData = {
            items: items.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
            })),
            delivery_name: formData.fullName,
            delivery_phone: formData.phoneNumber,
            shop_name: formData.shopName,
            delivery_address: formData.deliveryAddress,
          };
          placeOrderMutation.mutate(orderData);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items:</Text>
            <Text style={styles.summaryValue}>{items.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Price:</Text>
            <Text style={styles.summaryValue}>₹{getTotalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Items in Order</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            {item.product.serial_number ? (
              <Text style={styles.itemSerial}>
                SKU: {item.product.serial_number}
              </Text>
            ) : null}
            <View style={styles.itemDetails}>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              <Text style={styles.itemPrice}>
                ₹{(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery Details Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚚 Delivery Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(text) => {
              setFormData({ ...formData, fullName: text });
              if (errors.fullName) {
                setErrors({ ...errors, fullName: "" });
              }
            }}
            style={[styles.input, errors.fullName && styles.inputError]}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            placeholder="10-digit phone number"
            value={formData.phoneNumber}
            onChangeText={(text) => {
              setFormData({ ...formData, phoneNumber: text });
              if (errors.phoneNumber) {
                setErrors({ ...errors, phoneNumber: "" });
              }
            }}
            keyboardType="phone-pad"
            maxLength={10}
            style={[styles.input, errors.phoneNumber && styles.inputError]}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            placeholder="Enter your shop/business name"
            value={formData.shopName}
            onChangeText={(text) => {
              setFormData({ ...formData, shopName: text });
              if (errors.shopName) {
                setErrors({ ...errors, shopName: "" });
              }
            }}
            style={[styles.input, errors.shopName && styles.inputError]}
          />
          {errors.shopName && (
            <Text style={styles.errorText}>{errors.shopName}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Delivery Address *</Text>
          <TextInput
            placeholder="Full delivery address"
            value={formData.deliveryAddress}
            onChangeText={(text) => {
              setFormData({ ...formData, deliveryAddress: text });
              if (errors.deliveryAddress) {
                setErrors({ ...errors, deliveryAddress: "" });
              }
            }}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              styles.textArea,
              errors.deliveryAddress && styles.inputError,
            ]}
          />
          {errors.deliveryAddress && (
            <Text style={styles.errorText}>{errors.deliveryAddress}</Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Cart</Text>
        </TouchableOpacity>

        <Button
          title={`Place Order - ₹${getTotalPrice.toFixed(2)}`}
          onPress={handlePlaceOrder}
          loading={placeOrderMutation.isPending}
          style={styles.placeButton}
        />
      </View>

      <View style={{ height: SPACING.lg }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginVertical: SPACING.sm,
  },
  section: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  orderItem: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  itemSerial: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    ...SHADOWS.sm,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: SPACING.xs,
    fontWeight: "600",
  },
  actionButtons: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  backButton: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  placeButton: {
    marginBottom: SPACING.lg,
  },
});

export default CheckoutScreen;
