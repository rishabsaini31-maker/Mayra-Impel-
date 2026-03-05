import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { productAPI } from "../../api";
import useCartStore from "../../store/cartStore";
import { CartToast } from "../../components/customer";
import { Button, LoadingSpinner } from "../../components/shared";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const { width } = Dimensions.get("window");

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const minOrderQuantity = useCartStore((state) => state.minOrderQuantity);
  const [quantity, setQuantity] = useState(5); // Wholesale minimum
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const addItem = useCartStore((state) => state.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productAPI.getById(productId),
  });

  const product = data?.product;

  const handleAddToCart = () => {
    if (quantity < minOrderQuantity) {
      Alert.alert(
        "Minimum Order Quantity",
        `Wholesale orders require a minimum of ${minOrderQuantity} pieces per product.`,
      );
      return;
    }

    addItem(product, quantity);
    setToastMessage(`${quantity} x ${product.name} added to cart`);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => Math.max(minOrderQuantity, prev - 1));

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Product not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const isAvailable = product.is_active !== false;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageSection}>
          <Image
            source={
              product.image_url
                ? { uri: product.image_url }
                : {
                    uri: "https://via.placeholder.com/600x600?text=Product+Image",
                  }
            }
            style={styles.image}
            resizeMode="cover"
          />
          {!isAvailable && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          {/* Product Name & Category */}
          <View style={styles.headerSection}>
            {product.categories && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {product.categories.name}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{product.name}</Text>
          </View>

          {/* Price Section */}
          <View style={styles.priceCard}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priceGradient}
            >
              <View style={styles.priceContent}>
                <Text style={styles.priceLabel}>Wholesale Price</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.price}>{product.price.toFixed(2)}</Text>
                  <Text style={styles.priceUnit}>/piece</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Wholesale Minimum Order Info */}
          <View style={styles.wholesaleInfoCard}>
            <View style={styles.wholesaleIcon}>
              <Text style={styles.wholesaleIconText}>📦</Text>
            </View>
            <View style={styles.wholesaleTextContainer}>
              <Text style={styles.wholesaleTitle}>Bulk Order Required</Text>
              <Text style={styles.wholesaleSubtitle}>
                Minimum {minOrderQuantity} pieces per product • Wholesale
                pricing
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Product Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product ID:</Text>
                <Text style={styles.detailValue}>
                  {product.id.substring(0, 8)}...
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isAvailable
                      ? styles.availableBadge
                      : styles.unavailableBadgeSmall,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {isAvailable ? "✓ Available" : "✗ Out of Stock"}
                  </Text>
                </View>
              </View>
              {product.categories && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>
                      {product.categories.name}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {isAvailable && (
        <View style={styles.bottomBar}>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>
              Quantity (Min. {minOrderQuantity}):
            </Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
                activeOpacity={0.7}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
                activeOpacity={0.7}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={`Add ${quantity} pcs • ₹${(product.price * quantity).toFixed(0)}`}
            onPress={handleAddToCart}
            style={styles.addToCartButton}
          />
        </View>
      )}

      <CartToast
        visible={toastVisible}
        message={toastMessage}
        onViewCart={() => {
          setToastVisible(false);
          navigation.navigate("Cart");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: "relative",
    backgroundColor: COLORS.white,
  },
  image: {
    width: width,
    height: width,
    backgroundColor: COLORS.lightGray,
  },
  unavailableBadge: {
    position: "absolute",
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    ...SHADOWS.large,
  },
  unavailableText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  content: {
    backgroundColor: COLORS.lightGray,
    paddingBottom: 120,
  },
  headerSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  categoryText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "bold",
    color: COLORS.text,
    lineHeight: 32,
  },
  priceCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  priceGradient: {
    padding: SPACING.lg,
  },
  priceContent: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  currency: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.white,
    marginRight: 4,
    marginTop: 4,
  },
  price: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.white,
  },
  priceUnit: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginLeft: 4,
    marginTop: 8,
  },
  wholesaleInfoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.accentLight + "20",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + "40",
    alignItems: "center",
  },
  wholesaleIcon: {
    marginRight: SPACING.md,
  },
  wholesaleIconText: {
    fontSize: 32,
  },
  wholesaleTextContainer: {
    flex: 1,
  },
  wholesaleTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  wholesaleSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    fontWeight: "600",
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    lineHeight: 24,
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.cardBackground,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  detailLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  availableBadge: {
    backgroundColor: COLORS.success,
  },
  unavailableBadgeSmall: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.large,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  quantityLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  quantityDisplay: {
    paddingHorizontal: SPACING.lg,
  },
  quantityText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  addToCartButton: {
    ...SHADOWS.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  backButton: {
    minWidth: 150,
  },
});

export default ProductDetailScreen;
