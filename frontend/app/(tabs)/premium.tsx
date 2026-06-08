import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

const PREMIUM_BG =
  "https://images.pexels.com/photos/13577782/pexels-photo-13577782.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const BENEFITS: { icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; title: string; desc: string }[] = [
  {
    icon: "infinite",
    title: "Unlimited suggestions",
    desc: "Generate as many message ideas as you need, every day.",
  },
  {
    icon: "image-outline",
    title: "Advanced screenshot analysis",
    desc: "Deep context understanding for any chat screenshot.",
  },
  {
    icon: "flash-outline",
    title: "Priority AI responses",
    desc: "Skip the queue with faster, premium-tier generation.",
  },
  {
    icon: "color-wand-outline",
    title: "Exclusive conversation styles",
    desc: "Unlock the bold, poetic Exclusive mode for elevated voice.",
  },
  {
    icon: "heart-outline",
    title: "Personalized coaching",
    desc: "Tone tips and rewrites tailored to your relationship.",
  },
];

export default function PremiumTab() {
  const { subscription, refresh } = useAuth();
  const [busy, setBusy] = useState<"trial" | "upgrade" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const status = subscription?.status ?? "none";
  const isPremium = status === "active";
  const isTrial = status === "trialing";

  const onStartTrial = async () => {
    setBusy("trial");
    setMsg(null);
    try {
      await api.startTrial();
      await refresh();
      setMsg("Your 7-day free trial is now active.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to start trial");
    } finally {
      setBusy(null);
    }
  };

  const onUpgrade = async () => {
    setBusy("upgrade");
    setMsg(null);
    try {
      const res = await api.upgrade();
      await refresh();
      setMsg(res?.message || "Premium activated.");
    } catch (e: any) {
      setMsg(e?.message ?? "Upgrade failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ImageBackground
        source={{ uri: PREMIUM_BG }}
        style={styles.hero}
        imageStyle={styles.heroImg}
        testID="premium-hero"
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.statusPill}>
            <Ionicons
              name={isPremium ? "diamond" : isTrial ? "sparkles" : "lock-closed"}
              size={12}
              color={COLORS.gold}
            />
            <Text style={styles.statusPillText}>
              {isPremium ? "PREMIUM" : isTrial ? "TRIAL" : "FREE"}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {isPremium
              ? "You're Premium."
              : "Unlock your\nfull voice."}
          </Text>
          <Text style={styles.heroSub}>
            {isPremium
              ? "All features are unlocked — keep the great conversations going."
              : "Premium gives you unlimited ideas, advanced screenshot analysis, and the Exclusive voice."}
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>WHAT YOU GET</Text>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon} size={18} color={COLORS.terracotta} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>Premium</Text>
            <Text style={styles.price}>
              $9.99<Text style={styles.priceMo}>/mo</Text>
            </Text>
            <Text style={styles.priceSub}>
              7-day free trial, cancel anytime
            </Text>
          </View>
        </View>

        {msg && (
          <Text style={styles.msg} testID="premium-message">
            {msg}
          </Text>
        )}

        {!isPremium && !isTrial && (
          <TouchableOpacity
            style={[styles.cta, styles.ctaPrimary]}
            onPress={onStartTrial}
            disabled={busy !== null}
            activeOpacity={0.9}
            testID="premium-start-trial"
          >
            {busy === "trial" ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.ctaText}>Start 7-day free trial</Text>
            )}
          </TouchableOpacity>
        )}

        {(isTrial || !isPremium) && (
          <TouchableOpacity
            style={[styles.cta, styles.ctaDark]}
            onPress={onUpgrade}
            disabled={busy !== null}
            activeOpacity={0.9}
            testID="premium-upgrade"
          >
            {busy === "upgrade" ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="diamond" size={16} color={COLORS.gold} />
                <Text style={styles.ctaText}>
                  {isTrial ? "Upgrade now" : "Go Premium — $9.99/mo"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isPremium && (
          <View style={styles.activeCard} testID="premium-active-card">
            <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
            <Text style={styles.activeText}>
              Premium is active. Enjoy the full LoveAssist experience.
            </Text>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Billing is simulated in this preview build. Live Stripe payments
          activate after publishing.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  hero: {
    height: 200,
    margin: SPACING.lg,
    overflow: "hidden",
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bgPremium,
  },
  heroImg: { resizeMode: "cover" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(44,54,43,0.55)",
  },
  heroContent: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "flex-end",
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.gold,
    marginBottom: SPACING.sm,
  },
  statusPillText: {
    color: COLORS.gold,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: COLORS.textInverse,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "rgba(253,251,247,0.85)",
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 19,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  benefitDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  priceCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  price: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  priceMo: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
  priceSub: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  msg: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.terracotta,
    fontWeight: "600",
  },
  cta: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    minHeight: 52,
  },
  ctaPrimary: {
    backgroundColor: COLORS.terracotta,
  },
  ctaDark: {
    backgroundColor: COLORS.bgPremium,
  },
  ctaText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: "600",
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.bgPremium,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  activeText: {
    flex: 1,
    color: COLORS.textInverse,
    fontSize: 13,
    lineHeight: 19,
  },
  disclaimer: {
    marginTop: SPACING.lg,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
});
