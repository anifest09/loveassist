/**
 * TrialLockGate — global trial-expiry guard.
 *
 * Mounted once inside (tabs)/_layout. Whenever the user's trial has expired and
 * they are NOT a paying subscriber, this component renders a full-screen modal
 * that hard-locks every feature behind a "Unlock Premium" CTA which routes to
 * /premium.
 *
 * Also exposes a 1-line trial countdown banner for users still inside the
 * trial window (TrialCountdownBar).
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export function TrialLockGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAccessLocked, signOut } = useAuth();

  // Pulse animation on the diamond
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: 0.6 + pulse.value * 0.4,
  }));

  // Always show modal when locked — even on /premium the user may close it,
  // but our policy is HARD LOCK: every screen except /premium itself shows it.
  const isPremiumScreen = pathname === "/premium" || pathname === "/(tabs)/premium";
  const visible = isAccessLocked && !isPremiumScreen;

  const goPremium = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push("/(tabs)/premium");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={goPremium}
    >
      <View style={styles.scrim}>
        <LinearGradient
          colors={["rgba(10,10,15,0.92)", "rgba(20,8,40,0.96)"]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View entering={FadeIn.duration(350)} style={styles.card}>
          <LinearGradient colors={["#1A1428", "#0A0A0F"]} style={StyleSheet.absoluteFill} />

          {/* Pulsing diamond glow */}
          <Animated.View style={[styles.glowHalo, pulseStyle]} pointerEvents="none">
            <LinearGradient
              colors={["rgba(236,72,153,0.55)", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.diamondWrap}>
            <LinearGradient colors={["#EC4899", "#8B5CF6"]} style={StyleSheet.absoluteFill} />
            <Ionicons name="diamond" size={32} color="#FFFFFF" />
          </View>

          <Text style={styles.eyebrow}>YOUR FREE TRIAL ENDED</Text>
          <Text style={styles.title}>Time to go{"\n"}Premium.</Text>
          <Text style={styles.sub}>
            Unlock unlimited AI replies, screenshot reads, and 20-language live translate.
            Cancel anytime.
          </Text>

          <View style={styles.bulletRow}>
            {[
              { i: "infinite" as const, t: "Unlimited replies" },
              { i: "scan" as const, t: "Screenshot AI" },
              { i: "language" as const, t: "20 languages" },
            ].map((b) => (
              <View key={b.t} style={styles.bullet}>
                <Ionicons name={b.i} size={11} color={COLORS.neonPink} />
                <Text style={styles.bulletText}>{b.t}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.92}
            onPress={goPremium}
            style={styles.cta}
            testID="trial-lock-cta"
          >
            <Text style={styles.ctaText}>Unlock Premium</Text>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={15} color="#0A0A0F" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try { Haptics.selectionAsync(); } catch {}
              await signOut();
              router.replace("/login");
            }}
            style={styles.signOut}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// -------------------------------------------------------------
// Trial countdown bar — small banner shown on tabs while trialing
// -------------------------------------------------------------
export function TrialCountdownBar() {
  const router = useRouter();
  const { subscription, trialDaysLeft, isPremium } = useAuth();
  if (!subscription || subscription.status !== "trialing") return null;
  if (isPremium === false) {/* still trialing → show */}

  const urgent = trialDaysLeft <= 2;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push("/(tabs)/premium")}
      style={[styles.countdown, urgent && styles.countdownUrgent]}
      testID="trial-countdown-bar"
    >
      <Ionicons name="time" size={12} color={urgent ? "#FFFFFF" : COLORS.neonPink} />
      <Text style={[styles.countdownText, urgent && { color: "#FFFFFF" }]}>
        {trialDaysLeft <= 0
          ? "Trial ends today · "
          : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} of trial left · `}
        <Text style={styles.countdownUpgrade}>Upgrade</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.lg },
  card: {
    width: Math.min(SCREEN_W - 32, 380),
    borderRadius: 28,
    padding: SPACING.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.30)",
    shadowColor: "#EC4899",
    shadowOpacity: 0.5,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  glowHalo: {
    position: "absolute",
    top: -60, alignSelf: "center",
    width: 280, height: 280, borderRadius: 140,
    overflow: "hidden",
  },
  diamondWrap: {
    alignSelf: "center",
    width: 72, height: 72, borderRadius: 36,
    overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.md,
    shadowColor: "#EC4899", shadowOpacity: 0.6,
    shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  eyebrow: {
    fontFamily: FONTS.bodyHeavy, fontSize: 10,
    color: COLORS.neonPink, letterSpacing: 2.5,
    textAlign: "center",
  },
  title: {
    fontFamily: "Inter_900Black", fontSize: 34, lineHeight: 38,
    color: "#FFFFFF", letterSpacing: -1.2,
    textAlign: "center", marginTop: 8,
  },
  sub: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.body, fontSize: 13,
    color: COLORS.textSecondary, lineHeight: 19,
    textAlign: "center",
  },
  bulletRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  bullet: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 5,
    backgroundColor: "rgba(236,72,153,0.10)",
    borderWidth: 1, borderColor: "rgba(236,72,153,0.25)",
    borderRadius: 999,
  },
  bulletText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: "#FFFFFF" },
  cta: {
    marginTop: SPACING.xl,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingLeft: 20, paddingRight: 8, paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    minHeight: 56,
  },
  ctaText: { fontFamily: FONTS.bodyHeavy, fontSize: 15, color: "#0A0A0F" },
  ctaArrow: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#EC4899",
    alignItems: "center", justifyContent: "center",
  },
  signOut: {
    alignSelf: "center",
    marginTop: SPACING.md,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  signOutText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.textMuted, textDecorationLine: "underline" },

  // ---- countdown
  countdown: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6,
    paddingVertical: 7, paddingHorizontal: 12,
    backgroundColor: "rgba(236,72,153,0.08)",
    borderWidth: 1, borderColor: "rgba(236,72,153,0.25)",
    borderRadius: 999,
  },
  countdownUrgent: {
    backgroundColor: COLORS.neonPink,
    borderColor: COLORS.neonPink,
  },
  countdownText: {
    fontFamily: FONTS.bodySemi, fontSize: 11.5, color: "#FFFFFF",
  },
  countdownUpgrade: { fontFamily: FONTS.bodyHeavy, color: COLORS.neonPink, textDecorationLine: "underline" },
});
