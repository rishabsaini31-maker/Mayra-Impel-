import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING } from "../../constants";

// Enhanced color mapping with gradients
const getCategoryColor = (categoryName) => {
  const colors = {
    "Anniversary Gifts": {
      gradient: ["#a855f7", "#c026d3"],
      icon: "#ffffff",
      border: "#c084fc",
      shadow: "#a855f7",
    },
    "Corporate Gifts": {
      gradient: ["#0ea5e9", "#06b6d4"],
      icon: "#ffffff",
      border: "#38bdf8",
      shadow: "#0ea5e9",
    },
    "Wedding Gifts": {
      gradient: ["#8b5cf6", "#a855f7"],
      icon: "#ffffff",
      border: "#a78bfa",
      shadow: "#8b5cf6",
    },
    "Personalized Gifts": {
      gradient: ["#14b8a6", "#10b981"],
      icon: "#ffffff",
      border: "#5eead4",
      shadow: "#14b8a6",
    },
    "Luxury Gifts": {
      gradient: ["#dc2626", "#ef4444"],
      icon: "#ffffff",
      border: "#f87171",
      shadow: "#dc2626",
    },
    "Baby Shower Gifts": {
      gradient: ["#d946ef", "#f0abfc"],
      icon: "#ffffff",
      border: "#f5d0fe",
      shadow: "#d946ef",
    },
  };
  return (
    colors[categoryName] || {
      gradient: ["#6b7280", "#4b5563"],
      icon: "#ffffff",
      border: "#9ca3af",
      shadow: "#6b7280",
    }
  );
};

const CategoryCard = ({ category, onPress, isSelected }) => {
  const color = getCategoryColor(category.name);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <View style={[styles.hollowBox, { marginRight: SPACING.sm }]}>
          <Text
            style={[
              styles.name,
              isSelected && styles.nameSelected,
              {
                textAlign: "center",
                textAlignVertical: "center",
                height: 20,
                display: "flex",
                justifyContent: "center",
              },
            ]}
            numberOfLines={3}
            ellipsizeMode="tail"
            adjustsFontSizeToFit={true}
            allowFontScaling={false}
          >
            {category.name}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.1,
    width: "100%",
  },
  cardSelected: {
    opacity: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    position: "relative",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  iconContainerSelected: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  icon: {
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  selectedOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 16,
    letterSpacing: 0.1,
    width: "100%",
  },
  hollowBox: {
    width: 96,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 0,
    paddingHorizontal: 4,
  },
});

export default CategoryCard;
