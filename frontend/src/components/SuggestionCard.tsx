import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING } from "../theme";

type Props = {
  suggestion: string;
  index: number;
  testIDPrefix?: string;
};

export const SuggestionCard: React.FC<Props> = ({
  suggestion,
  index,
  testIDPrefix = "suggestion",
}) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <View style={styles.card} testID={`${testIDPrefix}-card-${index}`}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{String(index + 1).padStart(2, "0")}</Text>
      </View>
      <Text style={styles.text} selectable>
        {suggestion}
      </Text>
      <TouchableOpacity
        style={[styles.copyBtn, copied && styles.copyBtnCopied]}
        onPress={copy}
        activeOpacity={0.85}
        testID={`${testIDPrefix}-copy-${index}`}
      >
        <Ionicons
          name={copied ? "checkmark" : "copy-outline"}
          size={14}
          color={copied ? COLORS.textInverse : COLORS.textPrimary}
        />
        <Text
          style={[
            styles.copyText,
            copied && { color: COLORS.textInverse },
          ]}
        >
          {copied ? "Copied" : "Copy"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const LoadingSuggestions: React.FC = () => (
  <View style={styles.loadingWrap} testID="suggestions-loading">
    <ActivityIndicator size="small" color={COLORS.terracotta} />
    <Text style={styles.loadingText}>Crafting suggestions…</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textPrimary,
    marginTop: 24,
  },
  copyBtn: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bgBase,
    borderColor: COLORS.sandBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  copyBtnCopied: {
    backgroundColor: COLORS.terracotta,
    borderColor: COLORS.terracotta,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
