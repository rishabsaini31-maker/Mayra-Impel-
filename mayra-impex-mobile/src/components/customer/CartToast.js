import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const CartToast = ({ visible, message, onViewCart }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={onViewCart} style={styles.button}>
        <Text style={styles.buttonText}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.xl,
    backgroundColor: "#1F2937",
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    ...SHADOWS.medium,
  },
  message: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    marginRight: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
});

export default CartToast;
