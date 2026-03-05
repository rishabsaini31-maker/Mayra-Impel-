import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Color mapping for different categories
const getCategoryColor = (categoryName) => {
  const colors = {
    All: { bg: "#EFF6FF", icon: "#3B82F6", border: "#BFDBFE" },
    "Birthday Gifts": { bg: "#FEF3C7", icon: "#F59E0B", border: "#FDE68A" },
    "Valentine's Gifts": { bg: "#FCE7F3", icon: "#EC4899", border: "#FBCFE8" },
    "Anniversary Gifts": { bg: "#F3E8FF", icon: "#A855F7", border: "#E9D5FF" },
    "Corporate Gifts": { bg: "#DBEAFE", icon: "#0EA5E9", border: "#BAE6FD" },
    "Wedding Gifts": { bg: "#E0E7FF", icon: "#6366F1", border: "#C7D2FE" },
    "Personalized Gifts": { bg: "#F0FDFA", icon: "#14B8A6", border: "#CCFBF1" },
    "Luxury Gifts": { bg: "#FEF2F2", icon: "#DC2626", border: "#FECACA" },
    "Baby Shower Gifts": { bg: "#F0E7FE", icon: "#8B5CF6", border: "#DDD6FE" },
  };
  return (
    colors[categoryName] || {
      bg: "#F3F4F6",
      icon: "#6B7280",
      border: "#E5E7EB",
    }
  );
};

const CategoryCard = ({ category, onPress, isSelected }) => {
  const color = getCategoryColor(category.name);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: color.bg,
            borderColor: color.border,
          },
        ]}
      >
        <Ionicons name={category.icon} size={32} color={color.icon} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
      {isSelected && <View style={styles.selectedDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100,
    alignItems: "center",
    marginRight: 12,
    paddingBottom: 8,
  },
  cardSelected: {
    opacity: 1,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 16,
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
    marginTop: 6,
  },
});

export default CategoryCard;
