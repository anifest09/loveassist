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
  onTranslate?: () => void; // optional: when provided, shows a Translate pill
  translatedText?: string;
  translating?: boolean;
  translationLabel?: string; // e.g. "Korean"
  onClearTranslation?: () => void;
};

export const SuggestionCard: React.FC<Props> = ({
  suggestion,
  index,
  testIDPrefix = "suggestion",
  onTranslate,
  translatedText,
  translating,
  translationLabel,
  onClearTranslation,
}) => {
  const [copied, setCopied] = useState(false);
  const display = translatedText && translatedText.trim() ? translatedText : suggestion;
  const copy = async () => {
    await Clipboard.setStringAsync(display);
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
        {translatedText && translatedText.trim() ? (
          <>
            <View style={styles.translatedTag}>
              <Ionicons name="language" size={11} color={COLORS.roseDeep} />
              <Text style={styles.translatedTagText}>
                {translationLabel || "Translated"}
              </Text>
              {onClearTranslation && (
                <TouchableOpacity onPress={onClearTranslation} hitSlop={6} testID={`${testIDPrefix}-clear-${index}`}>
                  <Ionicons name="close-circle" size={13} color={COLORS.roseDeep} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.text} selectable>{translatedText}</Text>
            <Text style={styles.originalText} selectable>{suggestion}</Text>
          </>
        ) : (
          <Text style={styles.text} selectable>{suggestion}</Text>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnCopied]} onPress={copy} activeOpacity={0.85} testID={`${testIDPrefix}-copy-${index}`}>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={copied ? COLORS.textInverse : COLORS.textPrimary} />
            <Text style={[styles.copyText, copied && { color: COLORS.textInverse }]}>{copied ? "Copied" : "Copy"}</Text>
          </TouchableOpacity>
          {onTranslate && (
            <TouchableOpacity
              style={styles.translateBtn}
              onPress={onTranslate}
              activeOpacity={0.85}
              disabled={translating}
              testID={`${testIDPrefix}-translate-${index}`}
            >
              {translating ? (
                <ActivityIndicator size="small" color={COLORS.roseDeep} />
              ) : (
                <>
                  <Ionicons name="language" size={14} color={COLORS.roseDeep} />
                  <Text style={styles.translateText}>
                    {translatedText ? "Retranslate" : "Translate"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
  actionsRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.blush,
    borderColor: COLORS.roseSoft,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  translateText: {
    fontSize: 12,
    fontFamily: FONTS.bodySemi,
    color: COLORS.roseDeep,
  },
  translatedTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: COLORS.blush,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.roseSoft,
  },
  translatedTagText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.roseDeep,
  },
  originalText: {
    marginTop: 8,
    paddingTop: 8,
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    fontStyle: "italic",
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(28,26,20,0.06)",
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
