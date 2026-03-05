import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 64) / 2;

const OrderCard = ({ order }) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={
            order.image_url
              ? { uri: order.image_url }
              : { uri: "https://via.placeholder.com/200x200?text=Order" }
          }
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Last From</Text>
        <Text style={styles.name} numberOfLines={1}>
          {order.name || "Recent Order"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFF2EB",
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 16,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.9,
    backgroundColor: "#FFE5D6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 12,
  },
  subtitle: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
});

export default OrderCard;
