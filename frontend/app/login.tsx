import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

function parseSessionId(url: string | null | undefined): string | null {
  if (!url) return null;
  const h = url.match(/[#&]session_id=([^&]+)/);
  if (h) return decodeURIComponent(h[1]);
  const q = url.match(/[?&]session_id=([^&]+)/);
  if (q) return decodeURIComponent(q[1]);
  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signInGoogleWithSessionId, signInDev, user, loading } = useAuth();
  const [busy, setBusy] = useState<"google" | "dev" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => { if (!loading && user) router.replace("/(tabs)"); }, [loading, user, router]);

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
          router.replace("/(tabs)");
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
        if (sessionId) { await signInGoogleWithSessionId(sessionId); router.replace("/(tabs)"); return; }
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
      router.replace("/(tabs)");
    } catch (e: any) { setErrorMsg(e?.message ?? "Demo sign-in failed"); }
    finally { setBusy(null); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.hero} start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.95 }} style={styles.hero}>
        <View style={[styles.glow, styles.glowA]} />
        <View style={[styles.glow, styles.glowB]} />
        <View style={[styles.glow, styles.glowC]} />
        <LinearGradient colors={["transparent", "rgba(22,20,15,0.85)"]} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="heart" size={11} color={COLORS.rose} />
              <Text style={styles.brandText}>LoveAssist</Text>
              <View style={styles.aiPill}><Text style={styles.aiPillText}>AI</Text></View>
            </View>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(900).delay(150)} style={styles.heroCenter}>
            <View style={styles.bigHeart}>
              <Ionicons name="heart" size={56} color={COLORS.rose} />
              <View style={styles.heartGlow} />
            </View>
            <Text style={styles.heroLabel}>YOUR PERSONAL</Text>
            <Text style={styles.heroBigText}>Conversation{"\n"}<Text style={styles.heroBigItalic}>Wingman</Text></Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView edges={["bottom"]} style={styles.sheetWrap}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>YOUR CONVERSATION WINGMAN</Text>
          <Text style={styles.headline}>
            Find the <Text style={styles.headlineItalic}>perfect</Text>{"\n"}words, every time.
          </Text>
          <Text style={styles.sub}>
            Personal AI that crafts replies, openers, and screenshot-aware messages — in your voice, in any tone.
          </Text>

          <View style={styles.featuresRow}>
            {[
              { i: "chatbubbles" as const, t: "Smart replies" },
              { i: "image-outline" as const, t: "Chat reader" },
              { i: "sparkles" as const, t: "5 languages" },
            ].map((f) => (
              <View key={f.t} style={styles.feature}>
                <View style={styles.featureIcon}><Ionicons name={f.i} size={14} color={COLORS.rose} /></View>
                <Text style={styles.featureText}>{f.t}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.92} disabled={busy !== null} testID="login-google-button">
            {busy === "google" ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={COLORS.textInverse} />
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={handleDev} activeOpacity={0.92} disabled={busy !== null} testID="login-demo-button">
            {busy === "dev" ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Ionicons name="flash" size={16} color={COLORS.rose} />
                <Text style={styles.demoText}>Try a demo account</Text>
              </>
            )}
          </TouchableOpacity>

          {errorMsg && <Text style={styles.error} testID="login-error">{errorMsg}</Text>}

          <View style={styles.trialPill}>
            <Ionicons name="gift-outline" size={12} color={COLORS.goldDeep} />
            <Text style={styles.trialText}>Includes 7-day Premium trial — no card needed</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgInk },
  hero: { height: "55%", width: "100%", overflow: "hidden" },
  glow: { position: "absolute", borderRadius: 9999, opacity: 0.65 },
  glowA: { width: 280, height: 280, backgroundColor: "#7A463E", top: -80, right: -100 },
  glowB: { width: 220, height: 220, backgroundColor: "#B14A56", top: 80, left: -90, opacity: 0.45 },
  glowC: { width: 180, height: 180, backgroundColor: "#C8A574", bottom: -40, right: 40, opacity: 0.28 },
  safe: { flex: 1 },
  brandRow: { paddingTop: SPACING.md, paddingHorizontal: SPACING.lg },
  brandBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,247,242,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,247,242,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  brandText: { color: COLORS.textInverse, fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 0.3 },
  aiPill: { backgroundColor: COLORS.goldBright, borderRadius: 4, paddingHorizontal: 5, marginLeft: 4 },
  aiPillText: { color: COLORS.textPrimary, fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 0.5 },

  heroCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  bigHeart: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(177,74,86,0.18)",
    borderWidth: 1,
    borderColor: "rgba(177,74,86,0.5)",
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  heartGlow: {
    position: "absolute",
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(200,165,116,0.10)",
  },
  heroLabel: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    color: COLORS.goldBright,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  heroBigText: {
    fontFamily: FONTS.display,
    fontSize: 40,
    color: COLORS.textInverse,
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heroBigItalic: { fontFamily: FONTS.displayItalic, color: COLORS.roseSoft },

  sheetWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: COLORS.bgBase,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  handle: {
    alignSelf: "center",
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: COLORS.sandBorderDark,
    marginBottom: SPACING.lg,
  },
  eyebrow: { fontFamily: FONTS.bodyHeavy, fontSize: 10, color: COLORS.rose, letterSpacing: 2.5, marginBottom: SPACING.sm },
  headline: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.textPrimary, lineHeight: 36, letterSpacing: -0.5 },
  headlineItalic: { fontFamily: FONTS.displayItalic, color: COLORS.rose },
  sub: { marginTop: SPACING.sm, fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  featuresRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.lg },
  feature: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    backgroundColor: COLORS.bgSurface,
  },
  featureIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.blush,
    alignItems: "center", justifyContent: "center",
  },
  featureText: { fontSize: 11, fontFamily: FONTS.bodySemi, color: COLORS.textPrimary, flexShrink: 1 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.bgInk,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    minHeight: 54,
  },
  googleText: { color: COLORS.textInverse, fontFamily: FONTS.bodyBold, fontSize: 15 },
  demoBtn: {
    marginTop: SPACING.sm,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1, borderColor: COLORS.sandBorder,
    paddingVertical: 14, borderRadius: RADIUS.lg, minHeight: 50,
  },
  demoText: { color: COLORS.textPrimary, fontFamily: FONTS.bodySemi, fontSize: 14 },
  error: { marginTop: SPACING.md, color: COLORS.danger, fontSize: 13, textAlign: "center", fontFamily: FONTS.bodyMedium },
  trialPill: {
    marginTop: SPACING.lg, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(200,165,116,0.14)",
    borderRadius: RADIUS.pill,
  },
  trialText: { fontSize: 11, fontFamily: FONTS.bodySemi, color: COLORS.goldDeep },
});
