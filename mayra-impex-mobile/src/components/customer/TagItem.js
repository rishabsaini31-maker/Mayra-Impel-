import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TagItem = ({ label, color = "#FF8C50" }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFF9F5",
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE8DC",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
  },
});

export default TagItem;
