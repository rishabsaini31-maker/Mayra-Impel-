import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ImageBackground,
  Platform,
} from "react-native";
import { COLORS } from "../constants";
// import { LinearGradient } from "expo-linear-gradient";

const LETTERS = [
  { char: "M", color: "#FF6B6B" },
  { char: "a", color: "#FFD93D" },
  { char: "y", color: "#6BCB77" },
  { char: "r", color: "#4D96FF" },
  { char: "a", color: "#FF6B6B" },
  { char: " ", color: "transparent" },
  { char: "I", color: "#FFD93D" },
  { char: "m", color: "#6BCB77" },
  { char: "p", color: "#4D96FF" },
  { char: "e", color: "#FF6B6B" },
  { char: "x", color: "#FFD93D" },
];

// Directions: up, down, left, right
const DIRECTIONS = ["up", "down", "left", "right"];
// Assign a random direction to each letter (except space)
const getRandomDirections = () => {
  let arr = [];
  for (let i = 0; i < LETTERS.length; i++) {
    if (LETTERS[i].char === " ") {
      arr.push(null);
    } else {
      arr.push(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]);
    }
  }
  return arr;
};

export default function AnimatedWelcomeScreen({ onFinish }) {
  const directions = useRef(getRandomDirections()).current;
  const animatedValues = useRef(
    LETTERS.map(() => new Animated.Value(0)),
  ).current;
  const screen = Dimensions.get("window");

  useEffect(() => {
    // Animate each letter in sequence
    const timers = [];
    for (let i = 0; i < LETTERS.length; i++) {
      timers.push(
        setTimeout(
          () => {
            Animated.timing(animatedValues[i], {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              // If last letter, call onFinish immediately after animation (no delay)
              if (i === LETTERS.length - 1) {
                onFinish && onFinish();
              }
            });
          },
          1000 + i * 120,
        ),
      );
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onFinish, animatedValues]);

  // Helper to get transform for each direction
  const getTransform = (idx) => {
    const dir = directions[idx];
    if (!dir) return [];
    const distance = 80; // px
    switch (dir) {
      case "up":
        return [
          {
            translateY: animatedValues[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [-distance, 0],
            }),
          },
        ];
      case "down":
        return [
          {
            translateY: animatedValues[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ];
      case "left":
        return [
          {
            translateX: animatedValues[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [-distance, 0],
            }),
          },
        ];
      case "right":
        return [
          {
            translateX: animatedValues[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ];
      default:
        return [];
    }
  };

  // Responsive font size based on screen width
  const fontSize = Math.min(64, Math.floor(screen.width / 8));

  return (
    <ImageBackground
      source={require("../../assets/splash.png")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.18 }}
    >
      <View style={styles.lettersRowNoBox}>
        {LETTERS.map((l, idx) =>
          l.char === " " ? (
            <Text
              key={idx}
              style={[styles.letter, { color: l.color, fontSize }]}
            >
              {" "}
            </Text>
          ) : (
            <Animated.Text
              key={idx}
              style={[
                styles.letter,
                { color: l.color, fontSize },
                { opacity: animatedValues[idx] },
                { transform: getTransform(idx) },
              ]}
            >
              {l.char}
            </Animated.Text>
          ),
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7e9f0", // soft pastel pink
  },
  lettersRowNoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    width: "100%",
    paddingHorizontal: 12,
    // No background, no border, no shadow, no padding
  },
  letter: {
    fontSize: 64,
    fontWeight: "bold",
    marginHorizontal: 4,
    letterSpacing: 1,
    textShadowColor: "#0002",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
  },
});
