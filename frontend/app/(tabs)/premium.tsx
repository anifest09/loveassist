import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated as RNAnimated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS, SHADOWS } from "@/src/theme";

const BENEFITS: { icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: "infinite", title: "Unlimited suggestions", desc: "Generate as many ideas as you need, every day." },
  { icon: "scan", title: "Advanced screenshot analysis", desc: "Deep, multi-message context awareness." },
  { icon: "flash", title: "Priority AI responses", desc: "Skip the queue with premium-tier speed." },
  { icon: "color-wand", title: "Exclusive voice mode", desc: "Unlock the bolder, poetic Exclusive tone." },
  { icon: "language", title: "All 5 languages", desc: "English · Spanish · French · Hindi · Português." },
  { icon: "shield-checkmark", title: "Private & safe", desc: "Encrypted, consent-aware, never shared." },
];

const COMPARE = [
  { label: "Replies per day", free: "10", pro: "Unlimited" },
  { label: "Screenshot analysis", free: "Basic", pro: "Advanced" },
  { label: "Exclusive voice", free: false, pro: true },
  { label: "Priority responses", free: false, pro: true },
  { label: "All 5 languages", free: true, pro: true },
];

function useShimmer() {
  const x = useRef(new RNAnimated.Value(0)).current;
  React.useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.timing(x, { toValue: 1, duration: 2400, useNativeDriver: true, easing: Easing.linear })
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  return x;
}

export default function PremiumTab() {
  const { subscription, refresh } = useAuth();
  const [busy, setBusy] = useState<"trial" | "upgrade" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const shimmer = useShimmer();

  const status = subscription?.status ?? "none";
  const isPremium = status === "active";
  const isTrial = status === "trialing";

  const onStartTrial = async () => {
    setBusy("trial"); setMsg(null);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    try { await api.startTrial(); await refresh(); setMsg("Your 7-day free trial is now active."); }
    catch (e: any) { setMsg(e?.message ?? "Failed to start trial"); }
    finally { setBusy(null); }
  };

  const onUpgrade = async () => {
    setBusy("upgrade"); setMsg(null);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    try { const res = await api.upgrade(); await refresh(); setMsg(res?.message || "Premium activated."); }
    catch (e: any) { setMsg(e?.message ?? "Upgrade failed"); }
    finally { setBusy(null); }
  };

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-280, 280] });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()}>
          <LinearGradient colors={GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, SHADOWS.hero]}>
            <RNAnimated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { rotate: "12deg" }] }]} pointerEvents="none">
              <LinearGradient colors={["transparent", "rgba(224,190,133,0.18)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </RNAnimated.View>

            <View style={styles.statusPill}>
              <Ionicons name={isPremium ? "diamond" : isTrial ? "sparkles" : "lock-closed"} size={11} color={COLORS.goldBright} />
              <Text style={styles.statusPillText}>{isPremium ? "PREMIUM" : isTrial ? "TRIAL" : "FREE"}</Text>
            </View>

            <Text style={styles.heroEyebrow}>LOVEASSIST</Text>
            <Text style={styles.heroTitle}>
              {isPremium ? "You're Premium." : (
                <>
                  Find your <Text style={styles.heroItalic}>voice.</Text>
                  {"\n"}Effortlessly.
                </>
              )}
            </Text>
            <Text style={styles.heroSub}>
              {isPremium
                ? "Every feature is unlocked. Speak with confidence."
                : "Unlimited ideas, premium analysis, and the Exclusive voice — built for those who care about every word."}
            </Text>

            <View style={styles.heroRow}>
              {["Unlimited", "Advanced", "Exclusive"].map((t) => (
                <View key={t} style={styles.heroChip}>
                  <Ionicons name="checkmark" size={11} color={COLORS.goldBright} />
                  <Text style={styles.heroChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.priceCard}>
          <View style={styles.priceTop}>
            <View>
              <Text style={styles.priceLabel}>Premium membership</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>$9.99</Text>
                <Text style={styles.priceMo}>/month</Text>
              </View>
              <Text style={styles.priceSub}>Cancel anytime · 7-day free trial</Text>
            </View>
            <View style={styles.priceBadge}>
              <Ionicons name="diamond" size={12} color={COLORS.goldDeep} />
              <Text style={styles.priceBadgeText}>BEST VALUE</Text>
            </View>
          </View>

          {msg && <Text style={styles.msg} testID="premium-message">{msg}</Text>}

          {!isPremium && !isTrial && (
            <TouchableOpacity onPress={onStartTrial} disabled={busy !== null} activeOpacity={0.92} testID="premium-start-trial">
              <LinearGradient colors={GRADIENTS.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                {busy === "trial" ? <ActivityIndicator color={COLORS.textInverse} /> : (
                  <><Ionicons name="gift" size={16} color={COLORS.textInverse} /><Text style={styles.ctaText}>Start 7-day free trial</Text></>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {(isTrial || !isPremium) && (
            <TouchableOpacity onPress={onUpgrade} disabled={busy !== null} activeOpacity={0.92} style={{ marginTop: 10 }} testID="premium-upgrade">
              <LinearGradient colors={GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cta, styles.ctaDark]}>
                {busy === "upgrade" ? <ActivityIndicator color={COLORS.goldBright} /> : (
                  <><Ionicons name="diamond" size={16} color={COLORS.goldBright} /><Text style={[styles.ctaText, { color: COLORS.goldBright }]}>{isTrial ? "Upgrade now" : "Go Premium — $9.99/mo"}</Text></>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isPremium && (
            <View style={styles.activeCard} testID="premium-active-card">
              <Ionicons name="checkmark-circle" size={20} color={COLORS.goldBright} />
              <Text style={styles.activeText}>Premium is active. Enjoy the full LoveAssist experience.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>WHAT YOU UNLOCK</Text>
        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <Animated.View key={b.title} entering={FadeInDown.delay(80 + i * 50).springify()} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={16} color={COLORS.rose} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>FREE VS PREMIUM</Text>
        <View style={styles.compareCard}>
          <View style={styles.compareHead}>
            <Text style={[styles.compareCol, { flex: 1.4, color: COLORS.textSecondary }]}>Feature</Text>
            <Text style={[styles.compareCol, { textAlign: "center" }]}>Free</Text>
            <Text style={[styles.compareCol, { textAlign: "center", color: COLORS.goldDeep }]}>Premium</Text>
          </View>
          {COMPARE.map((c, i) => (
            <View key={c.label} style={[styles.compareRow, i % 2 === 0 && styles.compareRowAlt]}>
              <Text style={[styles.compareLabel, { flex: 1.4 }]}>{c.label}</Text>
              <View style={styles.compareCell}>
                {typeof c.free === "string" ? <Text style={styles.compareValue}>{c.free}</Text> : c.free ? <Ionicons name="checkmark" size={16} color={COLORS.success} /> : <Ionicons name="close" size={16} color={COLORS.textMuted} />}
              </View>
              <View style={styles.compareCell}>
                {typeof c.pro === "string" ? <Text style={[styles.compareValue, { color: COLORS.goldDeep, fontFamily: FONTS.bodyBold }]}>{c.pro}</Text> : c.pro ? <Ionicons name="checkmark" size={16} color={COLORS.goldDeep} /> : <Ionicons name="close" size={16} color={COLORS.textMuted} />}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.testimonial}>
          <Text style={styles.testimonialQuote}>{"\u201C"}</Text>
          <Text style={styles.testimonialText}>
            LoveAssist gave me the words I didn{"\u2019"}t know I had. Conversations finally feel <Text style={{ fontFamily: FONTS.displayItalic, color: COLORS.rose }}>natural</Text>.
          </Text>
          <Text style={styles.testimonialAuthor}>— Maya R., Premium member</Text>
        </View>

        <Text style={styles.disclaimer}>
          Billing is simulated in this preview build. Live Stripe payments activate after publishing.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  hero: {
    margin: SPACING.lg,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    overflow: "hidden",
    minHeight: 280,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.22)",
  },
  shimmer: { position: "absolute", top: -80, bottom: -80, width: 160 },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.5)",
  },
  statusPillText: { color: COLORS.goldBright, fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 1.5 },
  heroEyebrow: { color: COLORS.goldBright, fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 3, marginTop: SPACING.md },
  heroTitle: { color: COLORS.textInverse, fontFamily: FONTS.display, fontSize: 36, lineHeight: 40, marginTop: 6, letterSpacing: -0.5 },
  heroItalic: { fontFamily: FONTS.displayItalic, color: COLORS.goldBright },
  heroSub: { color: "rgba(251,247,242,0.78)", fontFamily: FONTS.body, marginTop: SPACING.sm, fontSize: 13, lineHeight: 19 },
  heroRow: { flexDirection: "row", gap: 8, marginTop: SPACING.lg, flexWrap: "wrap" },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(251,247,242,0.07)",
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
  },
  heroChipText: { color: COLORS.textInverse, fontFamily: FONTS.bodySemi, fontSize: 11 },

  priceCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgBase,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    ...SHADOWS.card,
  },
  priceTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  priceLabel: { fontFamily: FONTS.bodyHeavy, fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1.5 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 },
  price: { fontFamily: FONTS.display, fontSize: 38, color: COLORS.textPrimary, letterSpacing: -1 },
  priceMo: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.textSecondary },
  priceSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(200,165,116,0.16)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.4)",
  },
  priceBadgeText: { fontFamily: FONTS.bodyHeavy, fontSize: 9, color: COLORS.goldDeep, letterSpacing: 1 },
  cta: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    minHeight: 52,
  },
  ctaDark: { borderWidth: 1, borderColor: "rgba(200,165,116,0.3)" },
  ctaText: { color: COLORS.textInverse, fontFamily: FONTS.bodyBold, fontSize: 14, letterSpacing: 0.3 },
  msg: { marginTop: SPACING.sm, fontSize: 13, color: COLORS.success, fontFamily: FONTS.bodySemi },

  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.bgInk,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
  },
  activeText: { flex: 1, color: COLORS.textInverse, fontFamily: FONTS.bodyMedium, fontSize: 13, lineHeight: 19 },

  sectionLabel: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 2.2,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  benefits: { paddingHorizontal: SPACING.lg, gap: 4 },
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md, marginBottom: SPACING.md },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.blush,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.textPrimary },
  benefitDesc: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginTop: 2 },

  compareCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgBase,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  compareHead: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBorder,
  },
  compareCol: { flex: 1, fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.5, color: COLORS.textPrimary },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: SPACING.md },
  compareRowAlt: { backgroundColor: "rgba(243,235,224,0.4)" },
  compareLabel: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textPrimary },
  compareCell: { flex: 1, alignItems: "center" },
  compareValue: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textPrimary },

  testimonial: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.bgSurface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  testimonialQuote: {
    fontFamily: FONTS.display,
    fontSize: 56,
    color: COLORS.rose,
    lineHeight: 56,
    marginBottom: -16,
  },
  testimonialText: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  testimonialAuthor: { marginTop: SPACING.sm, fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic" },

  disclaimer: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
    fontFamily: FONTS.body,
  },
});
