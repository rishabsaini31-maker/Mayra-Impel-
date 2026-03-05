import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const SettingsTab = ({ currentTheme, allThemes, setTheme }) => {
  return (
    <View>
      <Text style={styles.settingsTitle}>Choose Theme</Text>
      <View style={styles.themesGrid}>
        {allThemes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.themeCard,
              currentTheme.id === theme.id && styles.themeCardActive,
            ]}
            onPress={() => setTheme(theme.id)}
          >
            <View
              style={[
                styles.themeSwatch,
                {
                  backgroundColor: theme.primary,
                  borderColor: currentTheme.id === theme.id ? "#000" : "#ddd",
                  borderWidth: currentTheme.id === theme.id ? 3 : 1,
                },
              ]}
            />
            <Text style={[styles.themeName, { marginTop: SPACING.sm }]}>
              {theme.icon}
            </Text>
            <Text style={[styles.themeName, { fontSize: FONTS.sizes.xs }]}>
              {theme.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  themesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: SPACING.md,
  },
  themeCard: {
    width: "22%",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  themeCardActive: {
    ...SHADOWS.medium,
  },
  themeSwatch: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
  },
  themeName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
});

export default SettingsTab;
