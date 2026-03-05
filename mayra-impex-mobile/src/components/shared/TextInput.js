import React from "react";
import { TextInput as RNTextInput, StyleSheet, View, Text } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../../constants";

const TextInput = ({
  label,
  error,
  helperText,
  rightElement,
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={[
            styles.input,
            error && styles.inputError,
            rightElement && styles.inputWithRight,
            inputStyle,
          ]}
          placeholderTextColor={COLORS.textLight}
          {...props}
        />
        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : null}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputWithRight: {
    paddingRight: 64,
  },
  rightElement: {
    position: "absolute",
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: {
    borderColor: COLORS.error,
  },
  helper: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  error: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

export default TextInput;
