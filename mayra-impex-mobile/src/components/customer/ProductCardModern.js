import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

const ProductCardModern = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={
            product.image_url
              ? { uri: product.image_url }
              : { uri: "https://via.placeholder.com/300x300?text=Gift" }
          }
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.price && <Text style={styles.price}>₹{product.price}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#FF8C50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.1,
    backgroundColor: "#FFF9F5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 12,
    minHeight: 70,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF8C50",
  },
});

export default ProductCardModern;
