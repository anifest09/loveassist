import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";

import { storage } from "@/src/utils/storage";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ONBOARDING_KEY = "loveassist_seen_onboarding";

// ----------------------------------------------------------------------------
// Gentle floating animation for cards
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

// Subtle pulse for glow halos
function usePulse(delay = 0, duration = 2400) {
  const v = useSharedValue(0.55);
  React.useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.55, { duration, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [v, delay, duration]);
  return useAnimatedStyle(() => ({ opacity: v.value }));
}

// ============================================================================
// SLIDE 1 — Upload a Chat or Bio (Tinder-style floating profile cards)
// ============================================================================
function Slide1() {
  // Each card has its own combined transform via useSharedValue
  const f1 = useSharedValue(0);
  const f2 = useSharedValue(0);
  const f3 = useSharedValue(0);
  const glow = usePulse(0, 2800);

  React.useEffect(() => {
    const startFloat = (sv: Animated.SharedValue<number>, delay: number, duration: number) => {
      sv.value = withDelay(
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
    };
    startFloat(f1, 0, 3000);
    startFloat(f2, 400, 3400);
    startFloat(f3, 800, 3800);
  }, [f1, f2, f3]);

  const cardFront = useAnimatedStyle(() => ({
    transform: [{ translateY: -7 + f1.value * 14 }],
  }));
  const cardMid = useAnimatedStyle(() => ({
    transform: [
      { translateY: 20 + (-6 + f2.value * 12) },
      { rotate: "8deg" },
    ],
  }));
  const cardBack = useAnimatedStyle(() => ({
    transform: [
      { translateY: 20 + (-6 + f3.value * 12) },
      { rotate: "-8deg" },
    ],
  }));

  return (
    <View style={styles.slide}>
      <View style={styles.illoBox}>
        <Animated.View style={[styles.glowHalo, glow]} pointerEvents="none">
          <LinearGradient
            colors={["rgba(139,92,246,0.55)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.cardsRow}>
          <Animated.View style={[styles.profileCardSm, styles.profileCardLeft, cardBack]}>
            <LinearGradient colors={["#6D28D9", "#3B1A6B"]} style={StyleSheet.absoluteFill} />
            <View style={styles.profileAvatarSm}>
              <Text style={styles.profileAvatarEmojiSm}>👩‍🎨</Text>
            </View>
            <Text style={styles.profileNameSm}>Maya, 26</Text>
            <Text style={styles.profileBioSm}>Coffee · indie music</Text>
          </Animated.View>

          <Animated.View style={[styles.profileCardLg, cardFront]}>
            <LinearGradient colors={["#EC4899", "#7C3AED"]} style={StyleSheet.absoluteFill} />
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarEmoji}>👩‍🦰</Text>
            </View>
            <Text style={styles.profileName}>Zoe, 24</Text>
            <Text style={styles.profileBio}>Designer · ramen addict 🌲</Text>
            <View style={styles.profileTag}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
              <Text style={styles.profileTagText}>BIO UPLOADED</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.profileCardSm, styles.profileCardRight, cardMid]}>
            <LinearGradient colors={["#A78BFA", "#7C3AED"]} style={StyleSheet.absoluteFill} />
            <View style={styles.profileAvatarSm}>
              <Text style={styles.profileAvatarEmojiSm}>🧑‍💻</Text>
            </View>
            <Text style={styles.profileNameSm}>Alex, 28</Text>
            <Text style={styles.profileBioSm}>Climber · founder</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.Text entering={FadeIn.delay(400)} style={styles.slideTitle}>
        Upload a Chat{"\n"}or Bio
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(550)} style={styles.slideSub}>
        Drop a screenshot of their bio or your chat. Our AI reads the vibe and crafts replies in your voice.
      </Animated.Text>
    </View>
  );
}

// ============================================================================
// SLIDE 2 — Get Instant Replies (Phone + floating lavender bubbles)
// Dynamically rotates through a curated pool of AI openers to feel "live"
// ============================================================================
const REPLY_POOL: string[] = [
  "You can call me Leonardo Da Vinci, cause I'll paint your day better.",
  "Is cuffing season over yet, or can I still get arrested by a cutie? 😏",
  "Honestly, my Saturday plans just got way more interesting because of you.",
  "Okay your taste in music is dangerous — recommend me one song and I'll judge you fairly. 🎧",
  "Quick question: are you a Hinge philosopher or just secretly funny? Need to know what I'm working with.",
  "Saw you like ramen. Hot take — is pineapple on ramen a war crime or genius? 🍜",
  "Be honest — your camera roll is 90% sunsets and 10% your dog, isn't it? 📸",
  "If I had to guess your green flag I'd say… you actually reply to messages. Game-changer.",
  "Plot twist: I came here to lurk and your profile just ruined my night in the best way.",
  "Coffee, cocktails, or a walk-and-talk? Pick your fighter. ☕",
  "Your bio said 'love a deep convo' — so… aliens, real or PR stunt? 👽",
  "I was scrolling, then I stopped. That's a compliment, by the way.",
  "Two truths and a lie: you take great photos, you can cook, and you definitely text first. Which one is the lie? 🤔",
  "If we matched on a Tuesday it's basically destiny. I don't make the rules. ✨",
];

function pickThreeFromPool(): string[] {
  // Shuffle a shallow copy + take first 3 (Fisher-Yates lite)
  const arr = [...REPLY_POOL];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
}

// Single live bubble — fades + slides on text change to feel auto-generated
function LiveBubble({
  text,
  style,
  floatStyle,
  enterDelay,
}: {
  text: string;
  style: any;
  floatStyle: any;
  enterDelay: number;
}) {
  const opacity = useSharedValue(0);
  const slide = useSharedValue(8);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    slide.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) });
    // animate to invisible briefly before next text mounts via key change
  }, [text, opacity, slide]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: slide.value }],
  }));
  return (
    <Animated.View
      entering={FadeInUp.duration(600).delay(enterDelay)}
      style={[styles.lavenderBubble, style, floatStyle]}
    >
      <LinearGradient
        colors={["rgba(196,181,253,0.95)", "rgba(167,139,250,0.85)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Text style={[styles.lavenderBubbleText, animStyle]} numberOfLines={2}>
        {text}
      </Animated.Text>
      <View style={styles.copyMini}>
        <Ionicons name="copy-outline" size={12} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

// "✨ AI generating" live pill — small dots pulse to imply real-time generation
function LiveGeneratingPill() {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);
  useEffect(() => {
    const cfg = { duration: 480, easing: Easing.inOut(Easing.quad) };
    d1.value = withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1, false);
    d2.value = withDelay(160, withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1, false));
    d3.value = withDelay(320, withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1, false));
  }, [d1, d2, d3]);
  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
  return (
    <View style={styles.livePill}>
      <Ionicons name="sparkles" size={11} color="#FBCFE8" />
      <Text style={styles.livePillText}>AI generating</Text>
      <View style={styles.liveDotsRow}>
        <Animated.View style={[styles.liveDot, s1]} />
        <Animated.View style={[styles.liveDot, s2]} />
        <Animated.View style={[styles.liveDot, s3]} />
      </View>
    </View>
  );
}

function Slide2() {
  const b1 = useFloat(0, 2800, 10);
  const b2 = useFloat(280, 3000, 14);
  const b3 = useFloat(560, 3200, 12);
  const phoneFloat = useFloat(0, 4200, 8);
  const glow = usePulse(0, 2400);

  // Pick a fresh 3 on mount + auto-rotate every 3.6s
  const [bubbles, setBubbles] = useState<string[]>(() => pickThreeFromPool());

  useEffect(() => {
    const id = setInterval(() => {
      setBubbles((prev) => {
        // Pick 3 new openers that don't fully overlap with previous (avoid stale repeats)
        let next = pickThreeFromPool();
        let attempts = 0;
        while (
          attempts < 4 &&
          next[0] === prev[0] &&
          next[1] === prev[1] &&
          next[2] === prev[2]
        ) {
          next = pickThreeFromPool();
          attempts++;
        }
        return next;
      });
    }, 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeIn.duration(500)} style={styles.slideTitleTop}>
        Get Instant Replies
      </Animated.Text>
      <Animated.Text entering={FadeIn.duration(500).delay(120)} style={styles.slideSubTop}>
        Get intelligent, context-aware responses that keep your conversations flowing naturally.
      </Animated.Text>

      <LiveGeneratingPill />

      <View style={styles.illoBoxBig}>
        <Animated.View style={[styles.glowBeam, glow]} pointerEvents="none">
          <LinearGradient
            colors={["rgba(167,139,250,0.55)", "rgba(139,92,246,0.15)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Phone frame at bottom */}
        <Animated.View style={[styles.phoneTopHalf, phoneFloat]}>
          <LinearGradient
            colors={["#1A1428", "#0A0A0F"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.phoneCamera} />
          <View style={styles.phoneNotchPill} />
        </Animated.View>

        {/* Dynamically generated lavender chat bubbles
            key={bubbles[i]} forces React to remount when text changes, re-triggering the entrance animation */}
        <LiveBubble
          key={`b1-${bubbles[0]}`}
          text={bubbles[0]}
          style={{ top: 80, left: 20 }}
          floatStyle={b1}
          enterDelay={0}
        />
        <LiveBubble
          key={`b2-${bubbles[1]}`}
          text={bubbles[1]}
          style={{ top: 150, left: 36 }}
          floatStyle={b2}
          enterDelay={120}
        />
        <LiveBubble
          key={`b3-${bubbles[2]}`}
          text={bubbles[2]}
          style={{ top: 220, left: 28 }}
          floatStyle={b3}
          enterDelay={240}
        />
      </View>
    </View>
  );
}

// ============================================================================
// SLIDE 3 — Decode Any Chat (Phone + widget cards + 3D flame)
// MATCHES REFERENCE 2
// ============================================================================
function Slide3() {
  const phoneFloat = useFloat(0, 4000, 8);
  const compatFloat = useFloat(200, 3400, 10);
  const interestFloat = useFloat(450, 3600, 12);
  const flameFloat = useFloat(0, 2200, 14);
  const flameBounce = useSharedValue(1);
  const glow = usePulse(0, 2600);

  React.useEffect(() => {
    flameBounce.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [flameBounce]);

  const flameScale = useAnimatedStyle(() => ({
    transform: [{ scale: flameBounce.value }],
  }));

  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeIn.duration(500)} style={styles.slideTitleHero}>
        Decode Any Chat
      </Animated.Text>
      <Animated.Text entering={FadeIn.duration(500).delay(120)} style={styles.slideSubTop}>
        Compatibility, interest level, red & green flags — instant insight into every conversation.
      </Animated.Text>

      <View style={styles.illoBoxBig}>
        <Animated.View style={[styles.glowBeam, glow]} pointerEvents="none">
          <LinearGradient
            colors={["rgba(139,92,246,0.55)", "rgba(236,72,153,0.20)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Mini iPhone mockup */}
        <Animated.View style={[styles.miniPhone, phoneFloat]}>
          <LinearGradient
            colors={["#1A1428", "#0A0A0F"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.miniPhoneNotch} />
          <View style={styles.miniPhoneScreen}>
            <View style={styles.miniPhoneHeader}>
              <Ionicons name="chevron-back" size={11} color="#FFFFFF" />
              <View style={styles.miniAvatar} />
              <Text style={styles.miniPhoneName}>Amelia</Text>
              <Ionicons name="options-outline" size={11} color="#FFFFFF" />
            </View>
            <View style={styles.miniBubbleL}>
              <Text style={styles.miniBubbleText}>sorry, I was busy!</Text>
            </View>
            <View style={styles.miniBubbleL}>
              <Text style={styles.miniBubbleText}>what are u watching rn?</Text>
            </View>
            <View style={styles.miniBubbleR}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.miniBubbleIcon}>
                <Ionicons name="flash" size={8} color="#FFFFFF" />
              </View>
              <Text style={styles.miniBubbleTextWhite}>Just your lovely face on my screen 😉</Text>
            </View>
          </View>
        </Animated.View>

        {/* Compatibility Score widget — bottom left */}
        <Animated.View
          entering={ZoomIn.duration(600).delay(280)}
          style={[styles.widgetCard, styles.widgetCompat, compatFloat]}
        >
          <View style={styles.widgetRowTop}>
            <Text style={styles.widgetEmoji}>🦁</Text>
            <Text style={styles.widgetTitle}>Compatibility</Text>
          </View>
          <View style={styles.gaugeWrap}>
            <View style={styles.gaugeBg}>
              <View style={styles.gaugeFill} />
            </View>
            <View style={styles.gaugeNeedle} />
          </View>
          <Text style={styles.widgetBig}>60%</Text>
        </Animated.View>

        {/* Interest Level widget — bottom right */}
        <Animated.View
          entering={ZoomIn.duration(600).delay(420)}
          style={[styles.widgetCard, styles.widgetInterest, interestFloat]}
        >
          <View style={styles.widgetRowTopRight}>
            <Text style={styles.widgetTitleSm}>Interest Level</Text>
            <Ionicons name="heart" size={10} color={COLORS.neonPink} />
          </View>
          <View style={styles.interestRow}>
            <View style={styles.interestColLeft}>
              <Text style={styles.interestPct}>80%</Text>
              <Text style={styles.interestLbl}>You</Text>
            </View>
            <View style={styles.interestColRight}>
              <Text style={styles.interestPctDim}>45%</Text>
              <Text style={styles.interestLblDim}>Them</Text>
            </View>
          </View>
          <View style={styles.flagsRow}>
            <View style={styles.flagBox}>
              <Text style={styles.flagLbl}>Red Flags</Text>
            </View>
            <View style={styles.flagBox}>
              <Text style={styles.flagLbl}>Green Flags</Text>
            </View>
          </View>
        </Animated.View>

        {/* 3D Flame */}
        <Animated.View
          entering={ZoomIn.duration(700).delay(150)}
          style={[styles.flame3d, flameFloat, flameScale]}
        >
          <Text style={styles.flame3dText}>🔥</Text>
        </Animated.View>
      </View>
    </View>
  );
}

// ============================================================================
// SLIDE 4 — Try LoveAssist for Free (final CTA before login)
// ============================================================================
function Slide4() {
  const phone = useFloat(0, 3600, 10);
  const glow = usePulse(0, 2200);

  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeIn.duration(500)} style={styles.slideTitleHero}>
        We want you to try LoveAssist for free
      </Animated.Text>

      <View style={styles.illoBoxBig}>
        <Animated.View style={[styles.glowBeam, glow]} pointerEvents="none">
          <LinearGradient
            colors={["rgba(139,92,246,0.55)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.phoneMockup, phone]}>
          <LinearGradient
            colors={["#1A1428", "#0A0A0F"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.phoneNotchPill} />
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
                &quot;Okay but who picked your playlist — I&apos;m investing.&quot;
              </Text>
            </View>
            <View style={styles.phoneTrialBadge}>
              <Ionicons name="diamond" size={10} color="#0A0A0F" />
              <Text style={styles.phoneTrialBadgeText}>7 DAYS FREE</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.Text entering={FadeIn.delay(300)} style={styles.slideSubBottom}>
        7 days of unlimited replies, screenshot AI, and 20-language translate. Cancel anytime.
      </Animated.Text>
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
    if (i !== idx) {
      setIdx(i);
      try { Haptics.selectionAsync(); } catch {}
    }
  };

  const finish = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    router.replace("/login");
  };

  const goNext = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    if (idx < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (idx + 1) * SCREEN_W, animated: true });
    } else {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      await finish();
    }
  };

  const goBack = () => {
    try { Haptics.selectionAsync(); } catch {}
    if (idx > 0) scrollRef.current?.scrollTo({ x: (idx - 1) * SCREEN_W, animated: true });
  };

  const goToSlide = (i: number) => {
    if (i === idx) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    scrollRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
  };

  const isLast = idx === SLIDES.length - 1;
  const ctaLabel = isLast ? "Get Started" : "Next";

  return (
    <View style={styles.container}>
      {/* Ambient background glow */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["#0A0A0F", "#0F0820", "#0A0A0F"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambient1}>
          <LinearGradient
            colors={["rgba(139,92,246,0.30)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.ambient2}>
          <LinearGradient
            colors={["rgba(236,72,153,0.22)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>

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
              <TouchableOpacity
                key={i}
                onPress={() => goToSlide(i)}
                hitSlop={10}
                testID={`onboarding-dot-${i}`}
              >
                <View style={[styles.dot, i === idx && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={finish} hitSlop={10} testID="onboarding-skip">
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          decelerationRate="fast"
          testID="onboarding-scroll"
        >
          {SLIDES.map((SlideComp, i) => (
            <View key={i} style={{ width: SCREEN_W }}>
              <SlideComp />
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={goNext}
            style={styles.ctaBtn}
            activeOpacity={0.92}
            testID="onboarding-next"
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
            {isLast && (
              <Ionicons name="arrow-forward" size={18} color="#0A0A0F" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  safe: { flex: 1 },

  ambient1: {
    position: "absolute",
    width: 420, height: 420, borderRadius: 210,
    top: -120, left: -100,
    overflow: "hidden",
  },
  ambient2: {
    position: "absolute",
    width: 360, height: 360, borderRadius: 180,
    bottom: -100, right: -80,
    overflow: "hidden",
  },

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
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  dotsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  dotActive: {
    backgroundColor: COLORS.neonPink,
    width: 28,
    shadowColor: "#EC4899",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  skip: { color: COLORS.textSecondary, fontFamily: FONTS.bodyBold, fontSize: 13 },

  slide: {
    flex: 1,
    width: SCREEN_W,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },

  illoBox: {
    height: Math.min(SCREEN_H * 0.40, 340),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  illoBoxBig: {
    height: Math.min(SCREEN_H * 0.55, 460),
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: SPACING.md,
    position: "relative",
  },
  glowHalo: {
    position: "absolute",
    width: 320, height: 320, borderRadius: 160,
    top: 10, alignSelf: "center",
    overflow: "hidden",
  },
  glowBeam: {
    position: "absolute",
    width: 360, height: 460,
    top: -20, alignSelf: "center",
    overflow: "hidden",
    borderRadius: 200,
  },

  slideTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 36,
    lineHeight: 40,
    color: "#FFFFFF",
    letterSpacing: -1.4,
    marginBottom: SPACING.md,
    textAlign: "left",
  },
  slideTitleTop: {
    fontFamily: "Inter_900Black",
    fontSize: 34,
    lineHeight: 38,
    color: "#FFFFFF",
    letterSpacing: -1.2,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  slideTitleHero: {
    fontFamily: "Inter_900Black",
    fontSize: 32,
    lineHeight: 36,
    color: "#FFFFFF",
    letterSpacing: -1.0,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  slideSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    maxWidth: 360,
  },
  slideSubTop: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 8,
  },
  slideSubBottom: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  // Live "AI generating" pill — sits above the floating bubbles
  livePill: {
    alignSelf: "center",
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(236,72,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.32)",
  },
  livePillText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    color: "#FBCFE8",
    letterSpacing: 1.2,
  },
  liveDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 2,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FBCFE8",
  },

  // ----- Slide 1: Profile cards (row layout)
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: -22,
  },
  profileCardLg: {
    width: 200,
    height: 270,
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#EC4899",
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
    zIndex: 3,
  },
  profileCardSm: {
    width: 120,
    height: 200,
    borderRadius: 18,
    padding: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  profileCardLeft: { marginRight: -24, zIndex: 1 },
  profileCardRight: { marginLeft: -24, zIndex: 2 },
  profileAvatarSm: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  profileAvatarEmojiSm: { fontSize: 22 },
  profileNameSm: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  profileBioSm: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 14,
  },
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
  profileCardMid: { zIndex: 2, transform: [{ rotate: "-9deg" }, { translateX: -42 }, { translateY: 14 }] },
  profileCardBack: { zIndex: 1, transform: [{ rotate: "9deg" }, { translateX: 42 }, { translateY: 22 }] },
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

  // ----- Slide 2: Phone + lavender bubbles
  phoneTopHalf: {
    position: "absolute",
    bottom: -40,
    width: 220,
    height: 220,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.4)",
    borderBottomWidth: 0,
  },
  phoneCamera: {
    alignSelf: "center",
    marginTop: 16,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "rgba(139,92,246,0.8)",
  },
  phoneNotchPill: {
    alignSelf: "center",
    marginTop: 8,
    width: 80,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#000000",
  },
  lavenderBubble: {
    position: "absolute",
    width: SCREEN_W - 72,
    paddingVertical: 14,
    paddingHorizontal: 18,
    paddingRight: 38,
    borderRadius: 26,
    borderBottomLeftRadius: 6,
    overflow: "hidden",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  lavenderBubbleText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 19,
  },
  copyMini: {
    position: "absolute",
    right: 10, top: "50%",
    marginTop: -11,
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center", justifyContent: "center",
  },

  // ----- Slide 3: Decode Any Chat
  miniPhone: {
    width: 180,
    height: 290,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.45)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
    marginBottom: 20,
  },
  miniPhoneNotch: {
    alignSelf: "center",
    marginTop: 8,
    width: 60,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000000",
  },
  miniPhoneScreen: { flex: 1, padding: 10, paddingTop: 10 },
  miniPhoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  miniAvatar: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#7C3AED",
  },
  miniPhoneName: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  miniBubbleL: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    marginBottom: 5,
    maxWidth: "85%",
  },
  miniBubbleR: {
    alignSelf: "flex-end",
    paddingVertical: 5,
    paddingHorizontal: 8,
    paddingRight: 18,
    borderRadius: 10,
    borderBottomRightRadius: 3,
    marginTop: 4,
    maxWidth: "85%",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    shadowColor: "#EC4899",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  miniBubbleIcon: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  miniBubbleText: { fontFamily: FONTS.bodyMedium, fontSize: 8, color: "#FFFFFF" },
  miniBubbleTextWhite: { fontFamily: FONTS.bodySemi, fontSize: 8, color: "#FFFFFF", flexShrink: 1 },

  // Widget cards (floating around mini phone)
  widgetCard: {
    position: "absolute",
    backgroundColor: "rgba(20,20,31,0.92)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.30)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  widgetCompat: {
    width: 130,
    left: 4,
    bottom: 60,
    transform: [{ rotate: "-4deg" }],
  },
  widgetInterest: {
    width: 150,
    right: 4,
    bottom: 30,
    transform: [{ rotate: "3deg" }],
  },
  widgetRowTop: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  widgetRowTopRight: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  widgetEmoji: { fontSize: 14 },
  widgetTitle: { fontFamily: FONTS.bodyBold, fontSize: 10, color: "#FFFFFF" },
  widgetTitleSm: { fontFamily: FONTS.bodyBold, fontSize: 9, color: "#FFFFFF" },
  widgetBig: { fontFamily: "Inter_900Black", fontSize: 18, color: "#FFFFFF", textAlign: "center", marginTop: 2 },
  gaugeWrap: { alignItems: "center", marginTop: 2 },
  gaugeBg: {
    width: 80, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  gaugeFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#F472B6",
  },
  gaugeNeedle: {
    width: 2, height: 10,
    backgroundColor: "#FFFFFF",
    marginTop: -8, marginLeft: 40,
    transform: [{ rotate: "12deg" }],
  },
  interestRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  interestColLeft: { alignItems: "flex-start" },
  interestColRight: { alignItems: "flex-start" },
  interestPct: { fontFamily: "Inter_900Black", fontSize: 18, color: "#FFFFFF", letterSpacing: -0.5 },
  interestPctDim: { fontFamily: "Inter_900Black", fontSize: 18, color: "rgba(255,255,255,0.55)", letterSpacing: -0.5 },
  interestLbl: { fontFamily: FONTS.bodyMedium, fontSize: 8, color: "rgba(255,255,255,0.55)" },
  interestLblDim: { fontFamily: FONTS.bodyMedium, fontSize: 8, color: "rgba(255,255,255,0.4)" },
  flagsRow: { flexDirection: "row", gap: 4, marginTop: 6 },
  flagBox: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 6,
  },
  flagLbl: { fontFamily: FONTS.bodyMedium, fontSize: 7, color: "rgba(255,255,255,0.75)" },
  flame3d: {
    position: "absolute",
    left: 8,
    top: 18,
    shadowColor: "#F472B6",
    shadowOpacity: 0.9,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
    zIndex: 20,
  },
  flame3dText: { fontSize: 64 },

  // ----- Slide 4: Phone mockup (existing)
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

  // ===== SPLASH INTRO =====
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    elevation: 999,
  },
  splashGlow: {
    position: "absolute",
    width: 480, height: 480, borderRadius: 240,
    overflow: "hidden",
  },
  splashRing: {
    position: "absolute",
    width: 360, height: 360, borderRadius: 180,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(236,72,153,0.45)",
  },
  splashHeart: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOpacity: 0.85,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
    elevation: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
  },
  splashTextWrap: { marginTop: 32, alignItems: "center" },
  splashBrand: {
    fontFamily: "Inter_900Black",
    fontSize: 44,
    color: "#FFFFFF",
    letterSpacing: -1.6,
  },
  splashTagline: {
    marginTop: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.neonPink,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
