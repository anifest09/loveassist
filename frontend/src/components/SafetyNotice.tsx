import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

type Props = {
  message: string;
  isSafetyBlock?: boolean;
  testID?: string;
};

export function SafetyNotice({ message, isSafetyBlock, testID }: Props) {
  if (isSafetyBlock) {
    return (
      <View style={styles.safetyCard} testID={testID}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.roseDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.safetyTitle}>Safety filter active</Text>
          <Text style={styles.safetyMessage}>{message}</Text>
        </View>
      </View>
    );
  }
  return (
    <Text style={styles.error} testID={testID}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  safetyCard: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    backgroundColor: COLORS.blush,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.roseSoft,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgBase,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.roseDeep,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  safetyMessage: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  error: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.danger,
    fontFamily: FONTS.bodyMedium,
  },
});
