import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";
import { Ionicons } from "@expo/vector-icons";

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

export const PremiumBanner: React.FC<Props> = ({
  status,
  trialEnd,
  onPress,
}) => {
  if (status === "active") {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.banner, styles.activeBanner]}
        testID="premium-banner-active"
      >
        <Ionicons name="diamond" size={18} color={COLORS.gold} />
        <Text style={[styles.text, { color: COLORS.textInverse }]}>
          Premium active — all features unlocked
        </Text>
      </TouchableOpacity>
    );
  }
  if (status === "trialing") {
    const d = daysLeft(trialEnd);
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.banner, styles.trialBanner]}
        testID="premium-banner-trial"
      >
        <Ionicons name="sparkles" size={16} color={COLORS.terracotta} />
        <Text style={styles.text}>
          {d > 0
            ? `${d} ${d === 1 ? "day" : "days"} left in your free trial`
            : "Trial ending soon"}
        </Text>
        <Text style={styles.cta}>Upgrade ›</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.banner, styles.upgradeBanner]}
      testID="premium-banner-upgrade"
    >
      <Ionicons name="lock-closed" size={16} color={COLORS.textInverse} />
      <Text style={[styles.text, { color: COLORS.textInverse }]}>
        Unlock Premium — start 7-day free trial
      </Text>
      <Text style={[styles.cta, { color: COLORS.gold }]}>Start ›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  trialBanner: {
    backgroundColor: COLORS.bgSurface,
    borderColor: COLORS.sandBorder,
  },
  upgradeBanner: {
    backgroundColor: COLORS.bgPremium,
    borderColor: COLORS.bgPremium,
  },
  activeBanner: {
    backgroundColor: COLORS.bgPremium,
    borderColor: COLORS.gold,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  cta: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.terracotta,
  },
});
