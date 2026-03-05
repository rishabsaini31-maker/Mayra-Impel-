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
import useCartStore from "../../store/cartStore";
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

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty");
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
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button
          title="Browse Products"
          onPress={() => navigation.navigate("Home")}
          style={styles.browseButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>₹{getTotalPrice.toFixed(2)}</Text>
        </View>

        <Button title="Proceed to Checkout" onPress={handlePlaceOrder} />
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
});

export default CartScreen;
