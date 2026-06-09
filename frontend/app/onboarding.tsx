import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
  withSequence,
  FadeIn,
} from "react-native-reanimated";

import { storage } from "@/src/utils/storage";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ONBOARDING_KEY = "loveassist_seen_onboarding";

// ----------------------------------------------------------------------------
// Floating animation hook — gentle up/down for each card with optional delay.
// ----------------------------------------------------------------------------
function useFloat(delay = 0, duration = 3200, distance = 12) {
  const v = useSharedValue(0);
  React.useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [v, delay, duration]);
  return useAnimatedStyle(() => ({
    transform: [{ translateY: -distance / 2 + v.value * distance }],
  }));
}

// ============================================================================
// SLIDE 1 — Upload a Chat or Bio (Tinder-style floating profile cards)
// ============================================================================
function Slide1() {
  const card1 = useFloat(0, 3000, 14);
  const card2 = useFloat(400, 3400, 16);
  const card3 = useFloat(800, 3800, 12);

  return (
    <View style={styles.slide}>
      <View style={styles.illoBox}>
        {/* Glow halo */}
        <View style={styles.glowHalo} pointerEvents="none">
          <LinearGradient
            colors={["rgba(139,92,246,0.55)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Back card */}
        <Animated.View style={[styles.profileCard, styles.profileCardBack, card3]}>
          <LinearGradient colors={["#3B1A6B", "#1F1442"]} style={StyleSheet.absoluteFill} />
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarEmoji}>👩‍🎨</Text>
          </View>
          <Text style={styles.profileName}>Maya, 26</Text>
          <Text style={styles.profileBio}>Coffee · indie music · golden retrievers</Text>
        </Animated.View>

        {/* Middle card */}
        <Animated.View style={[styles.profileCard, styles.profileCardMid, card2]}>
          <LinearGradient colors={["#7C3AED", "#3B1A6B"]} style={StyleSheet.absoluteFill} />
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarEmoji}>🧑‍💻</Text>
          </View>
          <Text style={styles.profileName}>Alex, 28</Text>
          <Text style={styles.profileBio}>Climber. Founder. Looking for someone real.</Text>
        </Animated.View>

        {/* Front card */}
        <Animated.View style={[styles.profileCard, styles.profileCardFront, card1]}>
          <LinearGradient colors={["#EC4899", "#7C3AED"]} style={StyleSheet.absoluteFill} />
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarEmoji}>👩‍🦰</Text>
          </View>
          <Text style={styles.profileName}>Zoe, 24</Text>
          <Text style={styles.profileBio}>Designer · ramen addict · loves hiking 🌲</Text>
          <View style={styles.profileTag}>
            <Ionicons name="sparkles" size={10} color="#FFFFFF" />
            <Text style={styles.profileTagText}>BIO UPLOADED</Text>
          </View>
        </Animated.View>
      </View>

      <Text style={styles.slideEyebrow}>STEP 01</Text>
      <Text style={styles.slideTitle}>Upload a Chat{"\n"}or Bio.</Text>
      <Text style={styles.slideSub}>
        Drop a screenshot of their bio or your chat. Our AI reads the vibe and crafts replies in your voice.
      </Text>
    </View>
  );
}

// ============================================================================
// SLIDE 2 — Get Instant Replies (Floating chat bubbles)
// ============================================================================
function Slide2() {
  const b1 = useFloat(0, 2800, 10);
  const b2 = useFloat(300, 3200, 14);
  const b3 = useFloat(600, 3000, 12);
  const b4 = useFloat(900, 3400, 16);

  return (
    <View style={styles.slide}>
      <View style={styles.illoBox}>
        <View style={styles.glowHalo} pointerEvents="none">
          <LinearGradient
            colors={["rgba(236,72,153,0.45)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Animated.View style={[styles.chatBubble, styles.bubbleLeftA, b1]}>
          <Text style={styles.bubbleTextDark}>Hey, long day. Just couch + leftovers 😩</Text>
        </Animated.View>

        <Animated.View style={[styles.chatBubble, styles.bubbleRightA, b2]}>
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.bubbleTextLight}>Comfort mode unlocked. What&apos;s on the takeout menu? 🍜</Text>
          <View style={styles.copyMini}>
            <Ionicons name="copy-outline" size={11} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.chatBubble, styles.bubbleRightB, b3]}>
          <LinearGradient
            colors={["#A78BFA", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.bubbleTextLight}>Tell me your top 3 — I&apos;ll pick your fighter.</Text>
          <View style={styles.copyMini}>
            <Ionicons name="copy-outline" size={11} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.chatBubble, styles.bubbleRightC, b4]}>
          <LinearGradient
            colors={["#F472B6", "#DB2777"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.bubbleTextLight}>Honestly same. Bringing wine over fixes everything 🍷</Text>
          <View style={styles.copyMini}>
            <Ionicons name="copy-outline" size={11} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>

      <Text style={styles.slideEyebrow}>STEP 02</Text>
      <Text style={styles.slideTitle}>Get Instant{"\n"}Replies.</Text>
      <Text style={styles.slideSub}>
        4 tailored, copy-ready replies in seconds. Normal, flirty, or exclusive — your call.
      </Text>
    </View>
  );
}

// ============================================================================
// SLIDE 3 — Excited for LoveAssist? (5-star rating)
// ============================================================================
function Slide3() {
  const star = useFloat(0, 2400, 8);

  return (
    <View style={styles.slide}>
      <View style={styles.illoBox}>
        <View style={styles.glowHalo} pointerEvents="none">
          <LinearGradient
            colors={["rgba(244,114,182,0.5)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Animated.View style={[styles.starWrap, star]}>
          <View style={styles.starRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Ionicons key={i} name="star" size={42} color={COLORS.neonPink} />
            ))}
          </View>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingQuote}>
              &quot;Saved me from sending a horrific double-text. The replies just hit different.&quot;
            </Text>
            <Text style={styles.ratingAuthor}>— Jordan, 22</Text>
          </View>
        </Animated.View>
      </View>

      <Text style={styles.slideEyebrow}>JOIN 50K+ USERS</Text>
      <Text style={styles.slideTitle}>EXCITED FOR{"\n"}LOVEASSIST?</Text>
      <Text style={styles.slideSub}>
        Help us reach more singles by leaving a 5-star review. We read every one. ⭐
      </Text>
    </View>
  );
}

// ============================================================================
// SLIDE 4 — Try free (phone mockup)
// ============================================================================
function Slide4() {
  const phone = useFloat(0, 3600, 10);

  return (
    <View style={styles.slide}>
      <View style={styles.illoBox}>
        <View style={styles.glowHalo} pointerEvents="none">
          <LinearGradient
            colors={["rgba(139,92,246,0.5)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Animated.View style={[styles.phoneMockup, phone]}>
          <LinearGradient
            colors={["#1A1428", "#0A0A0F"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.phoneNotch} />
          <View style={styles.phoneScreen}>
            <Text style={styles.phoneEyebrow}>SCREENSHOT REPLIES</Text>
            <View style={styles.phoneBubble}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.phoneBubbleText}>
                &quot;Trade you a coffee for the story behind your last selfie 😏&quot;
              </Text>
            </View>
            <View style={styles.phoneBubble}>
              <LinearGradient
                colors={["#A78BFA", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.phoneBubbleText}>
                &quot;Okay but who hurt my ego on your playlist?&quot;
              </Text>
            </View>
            <View style={styles.phoneTrialBadge}>
              <Ionicons name="diamond" size={10} color="#0A0A0F" />
              <Text style={styles.phoneTrialBadgeText}>7 DAYS FREE</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Text style={styles.slideEyebrow}>NO CARD REQUIRED</Text>
      <Text style={styles.slideTitle}>Try LoveAssist{"\n"}For Free.</Text>
      <Text style={styles.slideSub}>
        7 days of unlimited replies, screenshot AI, and 20-language translate. Cancel anytime.
      </Text>
    </View>
  );
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4];

// ============================================================================
// MAIN ONBOARDING
// ============================================================================
export default function OnboardingScreen() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== idx) setIdx(i);
  };

  const goNext = async () => {
    try { Haptics.selectionAsync(); } catch {}
    if (idx < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (idx + 1) * SCREEN_W, animated: true });
    } else {
      await storage.setItem(ONBOARDING_KEY, true);
      router.replace("/(tabs)/premium");
    }
  };

  const goBack = () => {
    try { Haptics.selectionAsync(); } catch {}
    if (idx > 0) scrollRef.current?.scrollTo({ x: (idx - 1) * SCREEN_W, animated: true });
  };

  const skip = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    router.replace("/(tabs)/premium");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={goBack}
            style={[styles.backBtn, idx === 0 && { opacity: 0 }]}
            disabled={idx === 0}
            hitSlop={10}
            testID="onboarding-back"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={skip} hitSlop={10} testID="onboarding-skip">
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: "stretch" }}
        >
          {SLIDES.map((Slide, i) => (
            <Animated.View key={i} entering={FadeIn.duration(300)} style={{ width: SCREEN_W }}>
              <Slide />
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.9}
            style={styles.ctaBtn}
            testID="onboarding-next"
          >
            <Text style={styles.ctaText}>
              {idx === SLIDES.length - 1 ? "Continue" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#0A0A0F" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  safe: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dotActive: { backgroundColor: COLORS.neonPink, width: 22 },
  skip: { color: COLORS.textSecondary, fontFamily: FONTS.bodyBold, fontSize: 13 },

  slide: {
    flex: 1,
    width: SCREEN_W,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  illoBox: {
    height: Math.min(SCREEN_H * 0.42, 360),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  glowHalo: {
    position: "absolute",
    width: 320, height: 320, borderRadius: 160,
    top: 10, alignSelf: "center",
    overflow: "hidden",
  },

  slideEyebrow: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 11,
    color: COLORS.neonPink,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  slideTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 38,
    lineHeight: 42,
    color: "#FFFFFF",
    letterSpacing: -1.4,
    marginBottom: SPACING.md,
  },
  slideSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    maxWidth: 360,
  },

  // ----- Slide 1: Profile cards
  profileCard: {
    position: "absolute",
    width: 210,
    height: 280,
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  profileCardFront: { zIndex: 3 },
  profileCardMid: { zIndex: 2, transform: [{ rotate: "-8deg" }, { translateX: -70 }, { translateY: 10 }] },
  profileCardBack: { zIndex: 1, transform: [{ rotate: "8deg" }, { translateX: 70 }, { translateY: 20 }] },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  profileAvatarEmoji: { fontSize: 32 },
  profileName: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  profileBio: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  profileTag: {
    position: "absolute",
    bottom: 16,
    left: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  profileTagText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 8,
    color: "#FFFFFF",
    letterSpacing: 1,
  },

  // ----- Slide 2: Chat bubbles
  chatBubble: {
    position: "absolute",
    maxWidth: 230,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bubbleLeftA: {
    backgroundColor: "#1F1F2C",
    top: 20,
    left: 8,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  bubbleRightA: { top: 90, right: 8, borderBottomRightRadius: 4 },
  bubbleRightB: { top: 170, right: 30, borderBottomRightRadius: 4 },
  bubbleRightC: { top: 250, right: 16, borderBottomRightRadius: 4 },
  bubbleTextDark: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: "#FFFFFF", lineHeight: 19 },
  bubbleTextLight: { fontFamily: FONTS.bodySemi, fontSize: 13, color: "#FFFFFF", lineHeight: 19, paddingRight: 22 },
  copyMini: {
    position: "absolute",
    right: 8, top: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center", justifyContent: "center",
  },

  // ----- Slide 3: Star rating
  starWrap: { alignItems: "center", gap: 18 },
  starRow: { flexDirection: "row", gap: 6 },
  ratingCard: {
    maxWidth: 280,
    backgroundColor: "#14141F",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.30)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ratingQuote: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 21,
    fontStyle: Platform.OS === "ios" ? "italic" : "normal",
  },
  ratingAuthor: {
    marginTop: 10,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.neonPink,
    letterSpacing: 0.5,
  },

  // ----- Slide 4: Phone mockup
  phoneMockup: {
    width: 220,
    height: 340,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.5)",
    shadowColor: "#EC4899",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  phoneNotch: {
    alignSelf: "center",
    marginTop: 8,
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000000",
  },
  phoneScreen: { flex: 1, padding: 14, paddingTop: 18 },
  phoneEyebrow: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 9,
    color: COLORS.neonPink,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  phoneBubble: {
    overflow: "hidden",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 8,
  },
  phoneBubbleText: { fontFamily: FONTS.bodySemi, fontSize: 11, color: "#FFFFFF", lineHeight: 16 },
  phoneTrialBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#F472B6",
    paddingVertical: 8,
    borderRadius: 999,
  },
  phoneTrialBadgeText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    color: "#0A0A0F",
    letterSpacing: 1.2,
  },

  // ----- Bottom CTA
  bottomBar: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, paddingTop: SPACING.md },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    minHeight: 54,
    shadowColor: "#EC4899",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 15,
    color: "#0A0A0F",
    letterSpacing: 0.3,
  },
});
