import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = width * 0.45;

const HeroBanner = () => {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=400&fit=crop",
        }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>Premium Gifts</Text>
        <Text style={styles.subtitle}>For Every Occasion</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: BANNER_HEIGHT,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFF5F0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 140, 80, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default HeroBanner;
