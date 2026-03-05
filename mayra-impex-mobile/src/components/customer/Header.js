import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const Header = ({ onSearchPress, title = "Mayra Impex" }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 12, 24),
          paddingBottom: 16,
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={onSearchPress}
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF8C50",
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
  },
});

export default Header;
