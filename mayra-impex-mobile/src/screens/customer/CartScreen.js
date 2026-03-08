import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import useCartStore from "../../store/cartStore";
import useAuthStore from "../../store/authStore";
import { Button } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const CartScreen = ({ navigation }) => {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());
  const minOrderQuantity = useCartStore((state) => state.minOrderQuantity);

  const handleUpdateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity);
    if (!isNaN(qty)) {
      if (qty < minOrderQuantity) {
        Alert.alert(
          "Minimum Order Quantity",
          `Wholesale orders require a minimum of ${minOrderQuantity} pieces per product.`,
          [{ text: "OK" }],
        );
        return;
      }
      updateQuantity(productId, qty);
    }
  };

  const handleRemoveItem = (item) => {
    Alert.alert("Remove Item", `Remove ${item.product.name} from cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeItem(item.productId),
      },
    ]);
  };

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const handlePlaceOrder = () => {
    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }
    if (!isAuthenticated) {
      Alert.alert("Login Required", "You need to log in to place an order.", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Login",
          onPress: () =>
            navigation.navigate("Login", { redirectTo: "Checkout" }),
        },
      ]);
      return;
    }
    navigation.navigate("Checkout");
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={
          item.product.image_url
            ? { uri: item.product.image_url }
            : { uri: "https://via.placeholder.com/400x400?text=Product" }
        }
        style={styles.itemImage}
      />

      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product.name}
        </Text>
        {item.product.serial_number ? (
          <Text style={styles.itemSerial}>
            SKU: {item.product.serial_number}
          </Text>
        ) : null}
        <Text style={styles.itemPrice}>₹{item.product.price.toFixed(2)}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              handleUpdateQuantity(item.productId, item.quantity - 1)
            }
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              handleUpdateQuantity(item.productId, item.quantity + 1)
            }
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("../../../assets/placeholder.png")}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button
          title="Browse Products"
          onPress={() => navigation.navigate("Home")}
          style={styles.browseButton}
        />
      </View>
    );
  }

  // Example shipping calculation (flat rate)
  const shipping = items.length > 0 ? 99 : 0;
  const subtotal = getTotalPrice;
  const total = subtotal + shipping;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>₹{shipping.toFixed(2)}</Text>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
          style={{ marginTop: 8 }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.gradientButtonText}>Proceed to Checkout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  cartItem: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.lightGray,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  itemSerial: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: "bold",
  },
  quantity: {
    marginHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  removeButton: {
    padding: SPACING.xs,
  },
  removeButtonText: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.error,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  totalLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  browseButton: {
    minWidth: 200,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: SPACING.lg,
    opacity: 0.7,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  summaryValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: "600",
  },
  gradientButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  gradientButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: "bold",
  },
});

export default CartScreen;
