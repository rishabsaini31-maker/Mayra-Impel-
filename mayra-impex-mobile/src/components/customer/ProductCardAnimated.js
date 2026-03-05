import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

const ProductCardAnimated = ({ product, onPress, index = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation with stagger effect
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    marginRight: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
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

export default ProductCardAnimated;
