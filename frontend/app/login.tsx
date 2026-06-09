import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useAuth } from "@/src/auth-context";
import { storage } from "@/src/utils/storage";
import { COLORS, RADIUS, SPACING, FONTS } from "@/src/theme";
import { isAppleAuthAvailable, signInWithApple } from "@/src/auth-apple";

WebBrowser.maybeCompleteAuthSession();

const ONBOARDING_KEY = "loveassist_seen_onboarding";
const { width: SCREEN_W } = Dimensions.get("window");

function parseSessionId(url: string | null | undefined): string | null {
  if (!url) return null;
  const h = url.match(/[#&]session_id=([^&]+)/);
  if (h) return decodeURIComponent(h[1]);
  const q = url.match(/[?&]session_id=([^&]+)/);
  if (q) return decodeURIComponent(q[1]);
  return null;
}

async function routeAfterLogin(router: ReturnType<typeof useRouter>) {
  const seen = await storage.getItem<boolean>(ONBOARDING_KEY, false);
  if (seen) router.replace("/(tabs)");
  else router.replace("/onboarding");
}

export default function LoginScreen() {
  const router = useRouter();
  const { signInGoogleWithSessionId, signInApple, signInDev, user, loading } = useAuth();
  const [busy, setBusy] = useState<"google" | "apple" | "dev" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showApple, setShowApple] = useState(false);

  // Detect Apple Sign In availability (iOS only)
  useEffect(() => {
    isAppleAuthAvailable().then(setShowApple);
  }, []);

  // Floating orb animations
  const orb1 = useSharedValue(0);
  const orb2 = useSharedValue(0);
  useEffect(() => {
    orb1.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1, true);
    orb2.value = withRepeat(withTiming(1, { duration: 5400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [orb1, orb2]);
  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 + orb1.value * 20 }, { translateX: -8 + orb1.value * 16 }],
    opacity: 0.5 + orb1.value * 0.25,
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: 8 - orb2.value * 18 }, { translateX: 10 - orb2.value * 20 }],
    opacity: 0.4 + orb2.value * 0.3,
  }));

  useEffect(() => {
    if (!loading && user) {
      (async () => { await routeAfterLogin(router); })();
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const url = typeof window !== "undefined" ? window.location.hash + window.location.search : "";
    const sessionId = parseSessionId(url);
    if (sessionId) {
      (async () => {
        try {
          setBusy("google");
          await signInGoogleWithSessionId(sessionId);
          if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
          await routeAfterLogin(router);
        } catch (e: any) { setErrorMsg(e?.message ?? "Sign-in failed"); }
        finally { setBusy(null); }
      })();
    }
  }, [signInGoogleWithSessionId, router]);

  const handleGoogle = async () => {
    setErrorMsg(null);
    setBusy("google");
    try {
      try { await Haptics.selectionAsync(); } catch {}
      const redirectUrl = Platform.OS === "web"
        ? (typeof window !== "undefined" ? window.location.origin + "/login" : "")
        : Linking.createURL("login");
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      if (Platform.OS === "web") { if (typeof window !== "undefined") window.location.href = authUrl; return; }
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === "success" && result.url) {
        const sessionId = parseSessionId(result.url);
        if (sessionId) { await signInGoogleWithSessionId(sessionId); await routeAfterLogin(router); return; }
        setErrorMsg("Could not read session from redirect.");
      } else if (result.type === "cancel" || result.type === "dismiss") {} else { setErrorMsg("Authentication did not complete."); }
    } catch (e: any) { setErrorMsg(e?.message ?? "Sign-in failed"); }
    finally { setBusy(null); }
  };

  const handleDev = async () => {
    setErrorMsg(null);
    setBusy("dev");
    try {
      try { await Haptics.selectionAsync(); } catch {}
      await signInDev("Demo User", `demo+${Date.now().toString(36)}@loveassist.ai`);
      await routeAfterLogin(router);
    } catch (e: any) { setErrorMsg(e?.message ?? "Demo sign-in failed"); }
    finally { setBusy(null); }
  };

  const handleApple = async () => {
    setErrorMsg(null);
    setBusy("apple");
    try {
      try { await Haptics.selectionAsync(); } catch {}
      const result = await signInWithApple();
      if (!result) { setBusy(null); return; } // user cancelled
      await signInApple({
        identity_token: result.identity_token,
        nonce: result.nonce,
        full_name: result.full_name,
        email: result.email,
      });
      await routeAfterLogin(router);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Apple sign-in failed");
    } finally { setBusy(null); }
  };

  return (
    <View style={styles.container}>
      {/* Animated violet/pink glow orbs */}
      <Animated.View style={[styles.orb, styles.orbViolet, orb1Style]} pointerEvents="none">
        <LinearGradient colors={["rgba(139,92,246,0.6)", "transparent"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.orb, styles.orbPink, orb2Style]} pointerEvents="none">
        <LinearGradient colors={["rgba(236,72,153,0.55)", "transparent"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>LOVEASSIST</Text>
            <View style={styles.aiPill}><Text style={styles.aiPillText}>AI</Text></View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(700).delay(100)} style={styles.heroCenter}>
          <Text style={styles.eyebrow}>YOUR PERSONAL AI WINGMAN</Text>
          <Text style={styles.heroTitle}>LoveAssist</Text>
          <View style={styles.aiWordRow}>
            <Text style={styles.heroTitleAccent}>AI</Text>
            <View style={styles.heroHeart}>
              <Ionicons name="heart" size={28} color={COLORS.neonPink} />
            </View>
          </View>
          <Text style={styles.heroSub}>
            AI-powered replies that hit different — for crushes, matches, and DMs you can&apos;t mess up.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.bottomBlock}>
          <View style={styles.featureRow}>
            {[
              { i: "chatbubbles" as const, t: "Smart Replies" },
              { i: "scan" as const, t: "Screenshot AI" },
              { i: "language" as const, t: "20 Languages" },
            ].map((f) => (
              <View key={f.t} style={styles.featureChip}>
                <Ionicons name={f.i} size={12} color={COLORS.neonPink} />
                <Text style={styles.featureChipText}>{f.t}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleGoogle} activeOpacity={0.9} disabled={busy !== null} testID="login-google-button">
            {busy === "google" ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#0A0A0F" />
                <Text style={styles.primaryBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {showApple && (
            <TouchableOpacity
              style={styles.appleBtn}
              onPress={handleApple}
              activeOpacity={0.9}
              disabled={busy !== null}
              testID="login-apple-button"
            >
              {busy === "apple" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.appleBtnText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.ghostBtn} onPress={handleDev} activeOpacity={0.9} disabled={busy !== null} testID="login-demo-button">
            {busy === "dev" ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Ionicons name="flash" size={15} color={COLORS.neonPink} />
                <Text style={styles.ghostBtnText}>Try Demo</Text>
              </>
            )}
          </TouchableOpacity>

          {errorMsg && <Text style={styles.error} testID="login-error">{errorMsg}</Text>}

          <View style={styles.trialPill}>
            <Ionicons name="gift-outline" size={11} color={COLORS.neonPink} />
            <Text style={styles.trialText}>7-day Premium trial — no card needed</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F", overflow: "hidden" },
  safe: { flex: 1, paddingHorizontal: SPACING.lg },

  orb: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
  orbViolet: { width: 360, height: 360, top: -80, right: -120 },
  orbPink: { width: 320, height: 320, bottom: 60, left: -120 },

  brandRow: { paddingTop: SPACING.sm },
  brandBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.neonPink },
  brandText: { color: "#FFFFFF", fontFamily: FONTS.bodyHeavy, fontSize: 11, letterSpacing: 2 },
  aiPill: { backgroundColor: COLORS.neonPink, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  aiPillText: { color: "#0A0A0F", fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 0.5 },

  heroCenter: { flex: 1, justifyContent: "center", paddingTop: SPACING.xl },
  eyebrow: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 11,
    color: COLORS.neonPink,
    letterSpacing: 3.5,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontFamily: "Inter_900Black",
    fontSize: Math.min(SCREEN_W * 0.16, 68),
    lineHeight: Math.min(SCREEN_W * 0.16, 68) * 1.0,
    color: "#FFFFFF",
    letterSpacing: -2.4,
  },
  heroTitleAccent: {
    fontFamily: "Inter_900Black",
    fontSize: Math.min(SCREEN_W * 0.16, 68),
    lineHeight: Math.min(SCREEN_W * 0.16, 68) * 1.0,
    color: COLORS.neonViolet,
    letterSpacing: -2.4,
  },
  aiWordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -4,
  },
  heroHeart: {
    marginLeft: 4,
    shadowColor: "#EC4899",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  heroSub: {
    marginTop: SPACING.lg,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    maxWidth: 340,
  },

  bottomBlock: { paddingBottom: SPACING.md },
  featureRow: { flexDirection: "row", gap: 8, marginBottom: SPACING.lg, flexWrap: "wrap" },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  featureChipText: { fontSize: 11, fontFamily: FONTS.bodySemi, color: "#FFFFFF" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    minHeight: 54,
    shadowColor: "#EC4899",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryBtnText: { color: "#0A0A0F", fontFamily: FONTS.bodyHeavy, fontSize: 15, letterSpacing: 0.3 },

  ghostBtn: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    minHeight: 50,
  },
  ghostBtnText: { color: "#FFFFFF", fontFamily: FONTS.bodySemi, fontSize: 14 },

  appleBtn: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    minHeight: 54,
  },
  appleBtnText: { color: "#FFFFFF", fontFamily: FONTS.bodyHeavy, fontSize: 15, letterSpacing: 0.3 },

  error: { marginTop: SPACING.md, color: COLORS.danger, fontSize: 13, textAlign: "center", fontFamily: FONTS.bodyMedium },

  trialPill: {
    marginTop: SPACING.lg,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(236,72,153,0.10)",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.25)",
    borderRadius: RADIUS.pill,
  },
  trialText: { fontSize: 11, fontFamily: FONTS.bodySemi, color: COLORS.copper, letterSpacing: 0.2 },
});
