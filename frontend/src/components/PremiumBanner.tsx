import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS, SHADOWS } from "../theme";

type Props = {
  status?: "none" | "trialing" | "active" | "expired" | null;
  trialEnd?: string | null;
  onPress?: () => void;
};

function daysLeft(iso?: string | null): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  return Math.max(0, Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24)));
}

export const PremiumBanner: React.FC<Props> = ({ status, trialEnd, onPress }) => {
  if (status === "active") {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.92} testID="premium-banner-active">
        <LinearGradient colors={GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.banner, SHADOWS.card]}>
          <View style={styles.iconWrap}>
            <Ionicons name="diamond" size={18} color={COLORS.goldBright} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrowDark}>YOU&apos;RE PREMIUM</Text>
            <Text style={[styles.text, { color: COLORS.textInverse }]}>All features unlocked — enjoy your voice.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.goldBright} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  if (status === "trialing") {
    const d = daysLeft(trialEnd);
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.92} testID="premium-banner-trial">
        <LinearGradient colors={GRADIENTS.cardCream} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.banner, styles.trialBanner, SHADOWS.soft]}>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.blush }]}>
            <Ionicons name="sparkles" size={16} color={COLORS.rose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>FREE TRIAL ACTIVE</Text>
            <Text style={styles.text}>{d > 0 ? `${d} ${d === 1 ? "day" : "days"} of Premium remaining` : "Trial ending today"}</Text>
          </View>
          <Text style={styles.cta}>Upgrade ›</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} testID="premium-banner-upgrade">
      <LinearGradient colors={GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.banner, SHADOWS.card]}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={16} color={COLORS.goldBright} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrowDark}>UNLOCK PREMIUM</Text>
          <Text style={[styles.text, { color: COLORS.textInverse }]}>Start your 7-day free trial</Text>
        </View>
        <Text style={[styles.cta, { color: COLORS.goldBright }]}>Start ›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.35)",
  },
  trialBanner: {
    borderColor: COLORS.sandBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(200,165,116,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
    color: COLORS.rose,
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  eyebrowDark: {
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
    color: COLORS.goldBright,
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  cta: {
    fontSize: 13,
    fontFamily: FONTS.bodyBold,
    color: COLORS.rose,
  },
});
