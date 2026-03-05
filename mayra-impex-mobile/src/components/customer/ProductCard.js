import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const ProductCard = ({
  product,
  onPress,
  onAddToCart,
  showAddButton = true,
  minOrderQty = 5,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image
          source={
            product.image_url
              ? { uri: product.image_url }
              : { uri: "https://via.placeholder.com/300x300?text=Product" }
          }
          style={styles.image}
          resizeMode="cover"
        />
        {!product.is_active && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Unavailable</Text>
          </View>
        )}
        {product.is_active !== false && (
          <View style={styles.minOrderBadge}>
            <Text style={styles.minOrderText}>Min. {minOrderQty} pcs</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.description && (
          <Text style={styles.description} numberOfLines={1}>
            {product.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.price}>{product.price.toFixed(0)}</Text>
            <Text style={styles.perUnit}>/pc</Text>
          </View>

          {showAddButton && product.is_active !== false && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddToCart}
              activeOpacity={0.7}
            >
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.medium,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border + "20",
  },
  imageContainer: {
    position: "relative",
    backgroundColor: "#F8F9FA",
  },
  image: {
    width: "100%",
    height: 160,
  },
  content: {
    padding: SPACING.md,
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
    minHeight: 40,
    lineHeight: 20,
  },
  description: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  currency: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 2,
  },
  price: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "800",
    color: COLORS.primary,
  },
  perUnit: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    color: COLORS.textLight,
    marginLeft: 2,
    marginTop: 6,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
  addIcon: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },
  inactiveBadge: {
    position: "absolute",
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  inactiveText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  minOrderBadge: {
    position: "absolute",
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    ...SHADOWS.small,
  },
  minOrderText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
});

export default ProductCard;
