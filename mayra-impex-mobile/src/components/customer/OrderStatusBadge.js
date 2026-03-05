import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "../../constants";

const OrderStatusBadge = ({ status }) => {
  const backgroundColor = ORDER_STATUS_COLORS[status] || COLORS.gray;
  const label = ORDER_STATUS_LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
  },
  text: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

export default OrderStatusBadge;
