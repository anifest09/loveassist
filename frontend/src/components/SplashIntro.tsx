import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import { COLORS, FONTS } from "@/src/theme";

/**
 * Cinematic LoveAssist splash intro (~1.6s).
 * Plays at app boot before routing.
 */
export default function SplashIntro({ onDone }: { onDone: () => void }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const heartScale = useSharedValue(0.2);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);
  const exitOpacity = useSharedValue(1);

  React.useEffect(() => {
    glowOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    ringScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withSequence(
      withTiming(0.8, { duration: 500 }),
      withTiming(0, { duration: 700 }),
    );
    heartScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 110 }));
    opacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    scale.value = withDelay(450, withSpring(1, { damping: 12, stiffness: 90 }));

    const t = setTimeout(() => {
      exitOpacity.value = withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }, 1600);

    const pulse = setTimeout(() => {
      heartScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 360, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 360, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    }, 700);

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    return () => { clearTimeout(t); clearTimeout(pulse); };
  }, [scale, opacity, heartScale, glowOpacity, ringScale, ringOpacity, exitOpacity, onDone]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.value }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, containerStyle]} pointerEvents="auto">
      <LinearGradient
        colors={["#0A0A0F", "#15082A", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(236,72,153,0.35)", "rgba(139,92,246,0.20)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(139,92,246,0.55)", "rgba(236,72,153,0.30)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.heart, heartStyle]}>
        <LinearGradient
          colors={["#EC4899", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="heart" size={64} color="#FFFFFF" />
      </Animated.View>
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.brand}>LoveAssist</Text>
        <Text style={styles.tagline}>Your AI Wingman</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    elevation: 999,
  },
  glow: {
    position: "absolute",
    width: 480, height: 480, borderRadius: 240,
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
    width: 360, height: 360, borderRadius: 180,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(236,72,153,0.45)",
  },
  heart: {
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
  textWrap: { marginTop: 32, alignItems: "center" },
  brand: {
    fontFamily: "Inter_900Black",
    fontSize: 44,
    color: "#FFFFFF",
    letterSpacing: -1.6,
  },
  tagline: {
    marginTop: 4,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.neonPink,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
