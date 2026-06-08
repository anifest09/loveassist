import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS, SHADOWS } from "../theme";

type Props = {
  suggestion: string;
  index: number;
  testIDPrefix?: string;
};

export const SuggestionCard: React.FC<Props> = ({ suggestion, index, testIDPrefix = "suggestion" }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(suggestion);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} testID={`${testIDPrefix}-card-${index}`}>
      <LinearGradient colors={GRADIENTS.cardCream} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, SHADOWS.card]}>
        <View style={styles.headerRow}>
          <LinearGradient colors={GRADIENTS.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
            <Text style={styles.badgeText}>{String(index + 1).padStart(2, "0")}</Text>
          </LinearGradient>
          <View style={styles.divider} />
          <View style={styles.sparkle}>
            <Ionicons name="sparkles" size={11} color={COLORS.goldDeep} />
          </View>
        </View>
        <Text style={styles.text} selectable>{suggestion}</Text>
        <TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnCopied]} onPress={copy} activeOpacity={0.85} testID={`${testIDPrefix}-copy-${index}`}>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={copied ? COLORS.textInverse : COLORS.textPrimary} />
          <Text style={[styles.copyText, copied && { color: COLORS.textInverse }]}>{copied ? "Copied" : "Copy"}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

export const LoadingSuggestions: React.FC = () => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.loadingWrap} testID="suggestions-loading">
      <View style={styles.loadingRing}>
        <ActivityIndicator size="small" color={COLORS.rose} />
      </View>
      <Text style={styles.loadingTitle}>Crafting your words{dots}</Text>
      <Text style={styles.loadingSub}>Premium AI is composing replies</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    color: COLORS.textInverse,
    letterSpacing: 1,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.sandBorder,
  },
  sparkle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(200,165,116,0.18)",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  copyBtn: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(28,26,20,0.04)",
    borderColor: COLORS.sandBorder,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  copyBtnCopied: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.rose,
  },
  copyText: {
    fontSize: 12,
    fontFamily: FONTS.bodySemi,
    color: COLORS.textPrimary,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  loadingRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  loadingTitle: {
    fontFamily: FONTS.displayMedium,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  loadingSub: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
});
