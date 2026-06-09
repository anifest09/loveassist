import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  Easing,
} from "react-native-reanimated";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { PaymentWebViewModal } from "@/src/components/PaymentWebViewModal";

const { width: SCREEN_W } = Dimensions.get("window");

// Floating animation
function useFloat(delay = 0, duration = 3200, distance = 10) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.quad) }),
        ),
        -1, false,
      ),
    );
  }, [v, delay, duration]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: -distance / 2 + v.value * distance }] }));
}

const BENEFITS: { icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; t: string }[] = [
  { icon: "infinite", t: "Unlimited replies" },
  { icon: "scan", t: "Screenshot AI" },
  { icon: "language", t: "Live translate · 20 langs" },
  { icon: "flash", t: "Priority AI speed" },
  { icon: "color-wand", t: "Exclusive flirty mode" },
  { icon: "shield-checkmark", t: "Private & encrypted" },
];

export default function PremiumPaywall() {
  const { subscription, refresh } = useAuth();
  const [busy, setBusy] = useState<"trial" | "razorpay" | "paypal" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgError, setMsgError] = useState(false);
  const [price, setPrice] = useState(7.6);
  const [trialOn, setTrialOn] = useState(true);
  const [pay, setPay] = useState<{
    visible: boolean;
    url: string | null;
    simulated: boolean;
    gateway: "razorpay" | "paypal";
    ref: string;
  }>({ visible: false, url: null, simulated: false, gateway: "razorpay", ref: "" });

  const status = subscription?.status ?? "none";
  const isPremium = status === "active";
  const isTrial = status === "trialing";

  // Floating analysis card animations (idle vertical float)
  const card1 = useFloat(0, 3000, 12);
  const card2 = useFloat(400, 3400, 14);
  const card3 = useFloat(800, 3200, 10);

  // Parallax — driven by scroll position
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });
  // Each card translates + tilts differently as user scrolls
  const parallaxLeft = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 300], [0, -40], Extrapolation.CLAMP) },
      { translateX: interpolate(scrollY.value, [0, 300], [0, -18], Extrapolation.CLAMP) },
      { rotate: `${-6 + interpolate(scrollY.value, [0, 300], [0, -6], Extrapolation.CLAMP)}deg` },
    ],
    opacity: interpolate(scrollY.value, [0, 280], [1, 0.55], Extrapolation.CLAMP),
  }));
  const parallaxCenter = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 300], [0, -60], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, 300], [1, 0.92], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, 320], [1, 0.5], Extrapolation.CLAMP),
  }));
  const parallaxRight = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 300], [0, -30], Extrapolation.CLAMP) },
      { translateX: interpolate(scrollY.value, [0, 300], [0, 22], Extrapolation.CLAMP) },
      { rotate: `${6 + interpolate(scrollY.value, [0, 300], [0, 8], Extrapolation.CLAMP)}deg` },
    ],
    opacity: interpolate(scrollY.value, [0, 280], [1, 0.55], Extrapolation.CLAMP),
  }));
  const headlineParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 200], [0, -20], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, 240], [1, 0.7], Extrapolation.CLAMP),
  }));

  useEffect(() => {
    api.pricing().then((p) => setPrice(p.price)).catch(() => {});
  }, []);

  const onPrimaryCTA = async () => {
    if (isPremium) return;
    if (trialOn && !isTrial) return onStartTrial();
    return launchRazorpay();
  };

  const onStartTrial = async () => {
    setBusy("trial"); setMsg(null); setMsgError(false);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    try {
      await api.startTrial();
      await refresh();
      setMsg("Your 7-day free trial is now active. 🎉");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to start trial"); setMsgError(true);
    } finally { setBusy(null); }
  };

  const launchRazorpay = async () => {
    setBusy("razorpay"); setMsg(null); setMsgError(false);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    try {
      const res = await api.razorpayCreate({});
      setPay({ visible: true, url: res.short_url, simulated: res.simulated, gateway: "razorpay", ref: res.payment_link_id });
    } catch (e: any) {
      setMsg(e?.message ?? "Razorpay error"); setMsgError(true);
    } finally { setBusy(null); }
  };

  const launchPayPal = async () => {
    setBusy("paypal"); setMsg(null); setMsgError(false);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    try {
      const res = await api.paypalCreate({});
      setPay({ visible: true, url: res.approve_url, simulated: res.simulated, gateway: "paypal", ref: res.order_id });
    } catch (e: any) {
      setMsg(e?.message ?? "PayPal error"); setMsgError(true);
    } finally { setBusy(null); }
  };

  const onPayApproved = async () => {
    try {
      if (pay.gateway === "razorpay") {
        const r = await api.razorpayVerify(pay.ref);
        if (r.ok) { setMsg("🎉 Premium activated."); setMsgError(false); }
        else { setMsg("Payment processing — try again."); setMsgError(true); }
      } else {
        const r = await api.paypalCapture(pay.ref);
        if (r.ok) { setMsg("🎉 Premium activated."); setMsgError(false); }
        else { setMsg("Payment processing — try again."); setMsgError(true); }
      }
      await refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Verification failed"); setMsgError(true);
    } finally {
      setPay((p) => ({ ...p, visible: false }));
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* ===== TOP DARK SECTION ===== */}
          <View style={styles.topDark}>
            {/* Violet glow halo */}
            <View style={styles.heroGlow} pointerEvents="none">
              <LinearGradient
                colors={["rgba(139,92,246,0.55)", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.topBar}>
              <View style={styles.brandPill}>
                <View style={styles.brandDot} />
                <Text style={styles.brandPillText}>LOVEASSIST PRO</Text>
              </View>
              <View style={styles.statusPill}>
                <Ionicons
                  name={isPremium ? "diamond" : isTrial ? "sparkles" : "lock-closed"}
                  size={10}
                  color={isPremium || isTrial ? COLORS.neonPink : COLORS.textSecondary}
                />
                <Text style={styles.statusPillText}>{isPremium ? "PREMIUM" : isTrial ? "TRIAL" : "FREE"}</Text>
              </View>
            </View>

            {/* Floating analysis cards (idle float + scroll parallax) */}
            <View style={styles.floatBox}>
              <Animated.View style={[styles.floatCard, styles.floatCardLeft, card2, parallaxLeft]}>
                <LinearGradient colors={["#1F1442", "#0F0824"]} style={StyleSheet.absoluteFill} />
                <Text style={styles.floatCardEyebrow}>SCREENSHOT</Text>
                <Text style={styles.floatCardLine} numberOfLines={2}>
                  &quot;Detected: playful vibe · ask about her dog 🐶&quot;
                </Text>
                <View style={styles.floatStat}>
                  <Ionicons name="trending-up" size={10} color="#10B981" />
                  <Text style={styles.floatStatText}>+97% match</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.floatCard, styles.floatCardCenter, card1, parallaxCenter]}>
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.floatCardEyebrowLight}>SUGGESTED REPLY</Text>
                <Text style={styles.floatCardLineLight} numberOfLines={3}>
                  &quot;Trade you a coffee for the story behind your last selfie 😏&quot;
                </Text>
                <View style={styles.copyChip}>
                  <Ionicons name="copy-outline" size={11} color="#FFFFFF" />
                  <Text style={styles.copyChipText}>Copy</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.floatCard, styles.floatCardRight, card3, parallaxRight]}>
                <LinearGradient colors={["#1F1442", "#0F0824"]} style={StyleSheet.absoluteFill} />
                <Text style={styles.floatCardEyebrow}>TRANSLATE</Text>
                <Text style={styles.floatCardLine} numberOfLines={2}>
                  &quot;¿Te apetece un café este finde?&quot;
                </Text>
                <View style={styles.floatStat}>
                  <Ionicons name="language" size={10} color={COLORS.neonPink} />
                  <Text style={styles.floatStatText}>ES → EN</Text>
                </View>
              </Animated.View>
            </View>

            <Animated.View entering={FadeIn.duration(500)} style={[styles.headlineWrap, headlineParallax]}>
              <Text style={styles.heroEyebrow}>UNLOCK EVERYTHING</Text>
              <Text style={styles.heroTitle}>Ready to go</Text>
              <Text style={styles.heroTitleAccent}>PRO?</Text>
            </Animated.View>
          </View>

          {/* ===== PASTEL SHEET ===== */}
          <View style={styles.sheetWrap}>
            <LinearGradient
              colors={["#FBCFE8", "#E9D5FF", "#DBEAFE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheet}
            >
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetTitle}>Premium Membership</Text>
              <Text style={styles.sheetSub}>
                Every feature unlocked. Cancel anytime.
              </Text>

              {/* Price row */}
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>${price.toFixed(2)}</Text>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.pricePer}>per month</Text>
                  <Text style={styles.priceFootnote}>billed monthly</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={styles.bestBadge}>
                  <Ionicons name="diamond" size={10} color="#0A0A0F" />
                  <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                </View>
              </View>

              {/* Trial Toggle */}
              {!isPremium && !isTrial && (
                <View style={styles.trialRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trialTitle}>Free trial enabled</Text>
                    <Text style={styles.trialSub}>7 days free · no card needed</Text>
                  </View>
                  <Switch
                    value={trialOn}
                    onValueChange={setTrialOn}
                    trackColor={{ false: "rgba(10,10,15,0.20)", true: "#EC4899" }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(10,10,15,0.20)"
                    testID="paywall-trial-toggle"
                  />
                </View>
              )}

              {/* Timeline */}
              {!isPremium && trialOn && !isTrial && (
                <View style={styles.timeline}>
                  <TimelineStep
                    icon="lock-open"
                    title="Today · Free"
                    desc="Unlock all premium features instantly"
                    accent
                  />
                  <View style={styles.timelineLine} />
                  <TimelineStep
                    icon="notifications"
                    title="Day 5 · Reminder"
                    desc="We'll remind you 2 days before billing"
                  />
                  <View style={styles.timelineLine} />
                  <TimelineStep
                    icon="card"
                    title={`Day 7 · $${price.toFixed(2)}/mo`}
                    desc="Cancel anytime — keep access until period ends"
                  />
                </View>
              )}

              {/* Benefits grid */}
              <View style={styles.benefitsGrid}>
                {BENEFITS.map((b, i) => (
                  <Animated.View key={b.t} entering={FadeInDown.delay(i * 50)} style={styles.benefitChip}>
                    <Ionicons name={b.icon} size={13} color="#0A0A0F" />
                    <Text style={styles.benefitChipText}>{b.t}</Text>
                  </Animated.View>
                ))}
              </View>

              {msg && (
                <View style={[styles.msgBox, msgError && styles.msgBoxError]} testID="premium-message">
                  <Ionicons
                    name={msgError ? "alert-circle" : "checkmark-circle"}
                    size={14}
                    color={msgError ? "#B91C1C" : "#0A0A0F"}
                  />
                  <Text style={[styles.msgText, msgError && { color: "#B91C1C" }]}>{msg}</Text>
                </View>
              )}

              {/* Black pill CTA */}
              {!isPremium && (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={onPrimaryCTA}
                  disabled={busy !== null}
                  style={styles.ctaBlack}
                  testID="paywall-cta"
                >
                  {busy === "trial" || busy === "razorpay" ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.ctaBlackText}>
                        {isTrial
                          ? `Upgrade · $${price.toFixed(2)}/mo`
                          : trialOn
                            ? "Start 7-day free trial"
                            : `Subscribe · $${price.toFixed(2)}/mo`}
                      </Text>
                      <View style={styles.ctaArrow}>
                        <Ionicons name="arrow-forward" size={16} color="#0A0A0F" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {isPremium && (
                <View style={styles.activeCard}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.activeText}>You&apos;re Premium. Every feature is unlocked.</Text>
                </View>
              )}

              {/* Alt payment methods */}
              {!isPremium && (
                <View style={{ marginTop: SPACING.md }}>
                  <View style={styles.orRow}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>or pay directly</Text>
                    <View style={styles.orLine} />
                  </View>

                  <View style={styles.payRow}>
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={launchRazorpay}
                      disabled={busy !== null}
                      activeOpacity={0.9}
                      testID="paywall-razorpay"
                    >
                      <View style={[styles.payLogo, { backgroundColor: "#0c2451" }]}>
                        <Text style={styles.payLogoText}>R</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.payBtnTitle}>Razorpay</Text>
                        <Text style={styles.payBtnSub}>UPI · Cards · Wallets</Text>
                      </View>
                      {busy === "razorpay" ? (
                        <ActivityIndicator color="#0A0A0F" size="small" />
                      ) : (
                        <Ionicons name="chevron-forward" size={14} color="rgba(10,10,15,0.5)" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={launchPayPal}
                      disabled={busy !== null}
                      activeOpacity={0.9}
                      testID="paywall-paypal"
                    >
                      <View style={[styles.payLogo, { backgroundColor: "#003087" }]}>
                        <Text style={styles.payLogoText}>P</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.payBtnTitle}>PayPal</Text>
                        <Text style={styles.payBtnSub}>Balance · Card · Pay in 4</Text>
                      </View>
                      {busy === "paypal" ? (
                        <ActivityIndicator color="#0A0A0F" size="small" />
                      ) : (
                        <Ionicons name="chevron-forward" size={14} color="rgba(10,10,15,0.5)" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.secureRow}>
                    <Ionicons name="lock-closed" size={11} color="rgba(10,10,15,0.55)" />
                    <Text style={styles.secureText}>Secure checkout · sandbox preview activates Premium for testing</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Testimonial */}
          <View style={styles.testimonialBlock}>
            <View style={styles.starsRow}>
              {[0,1,2,3,4].map(i => (
                <Ionicons key={i} name="star" size={14} color={COLORS.neonPink} />
              ))}
            </View>
            <Text style={styles.testimonialText}>
              &quot;LoveAssist gave me the words I didn&apos;t know I had. Conversations finally feel real.&quot;
            </Text>
            <Text style={styles.testimonialAuthor}>— Maya R., Premium member</Text>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      <PaymentWebViewModal
        visible={pay.visible}
        url={pay.url}
        simulated={pay.simulated}
        gateway={pay.gateway}
        onClose={() => setPay((p) => ({ ...p, visible: false }))}
        onApproved={onPayApproved}
      />
    </View>
  );
}

function TimelineStep({
  icon, title, desc, accent,
}: {
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  title: string; desc: string; accent?: boolean;
}) {
  return (
    <View style={styles.tlStep}>
      <View style={[styles.tlIcon, accent && styles.tlIconAccent]}>
        <Ionicons name={icon} size={13} color={accent ? "#FFFFFF" : "#0A0A0F"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tlTitle}>{title}</Text>
        <Text style={styles.tlDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  safe: { flex: 1 },

  // Top dark
  topDark: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  heroGlow: {
    position: "absolute",
    top: -80, left: SCREEN_W * 0.18,
    width: 360, height: 360, borderRadius: 180,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.neonPink },
  brandPillText: { color: "#FFFFFF", fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.5 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statusPillText: { color: "#FFFFFF", fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 1.5 },

  // Floating cards
  floatBox: {
    height: 220,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  floatCard: {
    position: "absolute",
    width: 175,
    padding: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  floatCardLeft: { top: 10, left: -10, transform: [{ rotate: "-6deg" }] },
  floatCardCenter: { top: 50, left: SCREEN_W * 0.5 - 87 - SPACING.lg, width: 195, zIndex: 3 },
  floatCardRight: { top: 110, right: -10, transform: [{ rotate: "6deg" }] },
  floatCardEyebrow: {
    fontFamily: FONTS.bodyHeavy, fontSize: 8, color: COLORS.neonPink,
    letterSpacing: 1.5, marginBottom: 6,
  },
  floatCardEyebrowLight: {
    fontFamily: FONTS.bodyHeavy, fontSize: 8, color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.5, marginBottom: 6,
  },
  floatCardLine: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: "#FFFFFF", lineHeight: 16 },
  floatCardLineLight: { fontFamily: FONTS.bodySemi, fontSize: 13, color: "#FFFFFF", lineHeight: 18 },
  floatStat: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderRadius: 999,
  },
  floatStatText: { fontFamily: FONTS.bodyHeavy, fontSize: 8, color: "#FFFFFF", letterSpacing: 0.5 },
  copyChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderRadius: 999,
  },
  copyChipText: { fontFamily: FONTS.bodyHeavy, fontSize: 9, color: "#FFFFFF", letterSpacing: 0.5 },

  // Headline
  headlineWrap: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  heroEyebrow: {
    fontFamily: FONTS.bodyHeavy, fontSize: 10, color: COLORS.neonPink,
    letterSpacing: 3, marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "Inter_900Black", fontSize: 44, lineHeight: 46,
    color: "#FFFFFF", letterSpacing: -1.6,
  },
  heroTitleAccent: {
    fontFamily: "Inter_900Black", fontSize: 60, lineHeight: 60,
    color: COLORS.neonViolet, letterSpacing: -2.2,
  },

  // Sheet
  sheetWrap: { paddingHorizontal: SPACING.sm, marginTop: SPACING.sm },
  sheet: {
    borderRadius: 32,
    padding: SPACING.lg,
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: "rgba(10,10,15,0.18)",
    marginBottom: SPACING.lg,
  },
  sheetTitle: {
    fontFamily: "Inter_900Black", fontSize: 26, color: "#0A0A0F",
    letterSpacing: -0.8,
  },
  sheetSub: {
    marginTop: 4,
    fontFamily: FONTS.bodyMedium, fontSize: 13, color: "rgba(10,10,15,0.65)",
  },

  priceRow: {
    flexDirection: "row", alignItems: "baseline",
    marginTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: "rgba(10,10,15,0.10)",
  },
  priceAmount: {
    fontFamily: "Inter_900Black", fontSize: 42, color: "#0A0A0F",
    letterSpacing: -1.5,
  },
  pricePer: { fontFamily: FONTS.bodyBold, fontSize: 14, color: "#0A0A0F" },
  priceFootnote: { fontFamily: FONTS.body, fontSize: 11, color: "rgba(10,10,15,0.55)" },
  bestBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  bestBadgeText: { fontFamily: FONTS.bodyHeavy, fontSize: 9, color: "#0A0A0F", letterSpacing: 1 },

  trialRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: RADIUS.lg,
  },
  trialTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 14, color: "#0A0A0F" },
  trialSub: { fontFamily: FONTS.body, fontSize: 12, color: "rgba(10,10,15,0.65)", marginTop: 2 },

  timeline: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: RADIUS.lg,
  },
  tlStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  tlIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  tlIconAccent: { backgroundColor: "#0A0A0F" },
  tlTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: "#0A0A0F" },
  tlDesc: { fontFamily: FONTS.body, fontSize: 11, color: "rgba(10,10,15,0.65)", marginTop: 1 },
  timelineLine: {
    width: 2, height: 12, backgroundColor: "rgba(10,10,15,0.12)",
    marginLeft: 14, marginVertical: 4,
  },

  benefitsGrid: {
    marginTop: SPACING.md,
    flexDirection: "row", flexWrap: "wrap", gap: 7,
  },
  benefitChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 999,
  },
  benefitChipText: { fontFamily: FONTS.bodySemi, fontSize: 11, color: "#0A0A0F" },

  msgBox: {
    marginTop: SPACING.md,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: RADIUS.lg,
    padding: 10,
  },
  msgBoxError: { backgroundColor: "rgba(254,202,202,0.85)" },
  msgText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 12, color: "#0A0A0F" },

  // Black pill CTA
  ctaBlack: {
    marginTop: SPACING.md,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 16,
    backgroundColor: "#0A0A0F",
    borderRadius: 999,
    minHeight: 58,
  },
  ctaBlackText: {
    fontFamily: FONTS.bodyHeavy, fontSize: 15, color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },

  activeCard: {
    marginTop: SPACING.md,
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: RADIUS.lg,
  },
  activeText: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 13, color: "#0A0A0F" },

  // Alt payment
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: SPACING.md },
  orLine: { flex: 1, height: 1, backgroundColor: "rgba(10,10,15,0.15)" },
  orText: { fontFamily: FONTS.bodyHeavy, fontSize: 10, color: "rgba(10,10,15,0.55)", letterSpacing: 1.2 },

  payRow: { gap: 8 },
  payBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: RADIUS.lg,
  },
  payLogo: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  payLogoText: { color: "#FFFFFF", fontFamily: FONTS.bodyHeavy, fontSize: 16 },
  payBtnTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: "#0A0A0F" },
  payBtnSub: { fontFamily: FONTS.body, fontSize: 10, color: "rgba(10,10,15,0.6)", marginTop: 1 },
  secureRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, marginTop: SPACING.sm,
  },
  secureText: {
    fontFamily: FONTS.body, fontSize: 10,
    color: "rgba(10,10,15,0.6)", textAlign: "center", flexShrink: 1,
  },

  // Testimonial
  testimonialBlock: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    alignItems: "center",
    paddingBottom: SPACING.md,
  },
  starsRow: { flexDirection: "row", gap: 4, marginBottom: SPACING.sm },
  testimonialText: {
    fontFamily: FONTS.bodyMedium, fontSize: 14, color: "#FFFFFF",
    textAlign: "center", lineHeight: 21, maxWidth: 320,
  },
  testimonialAuthor: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.bodyBold, fontSize: 11,
    color: COLORS.neonPink, letterSpacing: 0.5,
  },
});
