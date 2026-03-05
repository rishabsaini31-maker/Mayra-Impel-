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
    All: {
      gradient: ["#6366f1", "#8b5cf6"],
      icon: "#ffffff",
      border: "#a78bfa",
      shadow: "#6366f1",
    },
    "Birthday Gifts": {
      gradient: ["#f59e0b", "#f97316"],
      icon: "#ffffff",
      border: "#fbbf24",
      shadow: "#f59e0b",
    },
    "Valentine's Gifts": {
      gradient: ["#ec4899", "#f43f5e"],
      icon: "#ffffff",
      border: "#f472b6",
      shadow: "#ec4899",
    },
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
        <LinearGradient
          colors={color.gradient}
          style={[
            styles.iconContainer,
            isSelected && styles.iconContainerSelected,
            {
              shadowColor: color.shadow,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Icon with glow effect */}
          <Ionicons
            name={category.icon}
            size={isSelected ? 36 : 32}
            color={color.icon}
            style={styles.icon}
          />

          {/* Selection indicator overlay */}
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            </View>
          )}
        </LinearGradient>

        <Text
          style={[styles.name, isSelected && styles.nameSelected]}
          numberOfLines={2}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100,
    alignItems: "center",
    marginRight: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  cardSelected: {
    opacity: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    position: "relative",
    // Enhanced shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  nameSelected: {
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default CategoryCard;
