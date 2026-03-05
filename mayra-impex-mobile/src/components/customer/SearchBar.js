import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search products...",
  onSearch,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: 20,
    color: COLORS.textLight,
    paddingLeft: SPACING.sm,
  },
});

export default SearchBar;
