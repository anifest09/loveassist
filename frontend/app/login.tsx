
New Chat
⌘
K

Slides

Websites

Docs

Deep Research

Sheets

Agent Swarm

Kimi Code

Kimi Claw

Remove demo mode button
Fixing AI Endpoint Bug
修复字符串错误
FastAPI Security Hardening
make it proper

Get App

Remove demo mode button

https://github.com/anifest09/loveassist.git.remove demo mode from this app

Copy

Share

Remove Demo Mode from GitHub App by Analyzing Repository

Let me start by examining the repository to understand its structure and locate the demo mode implementation.

Browse
https://github.com/anifest09/loveassist.git


Think

Let me clone the repository and explore its structure to find the demo mode implementation.

Failed to execute Terminal

Output stopped




https://github.com/anifest09/loveassist.git.remove demo mode button from this app

Copy

Share

Clone repository, locate demo mode button, and remove it

Let me clone the repository locally to examine the code and find the demo mode button.

Failed to execute Terminal


Think

Let me try a shallow clone to speed things up.

Execute Terminal
Shallow clone loveassist repository


Think


Execute Terminal
Check git status of cloned repo


Delete empty repo and retry clone or download ZIP from GitHub


Failed to execute Terminal


Search GitHub repo for demo mode files

Let me search for the demo mode button directly in the GitHub repository using the browser.

Browse
https://github.com/search?q=repo%3Aanifest09%2Floveassist%20demo&type=code


Search for demo mode button in frontend directory

GitHub code search requires authentication. Let me browse the frontend directory directly on GitHub to find the demo mode button.

Browse
https://github.com/anifest09/loveassist/tree/main/frontend


Explore Expo Router app for demo mode button

This is an Expo React Native project. Let me clone it properly and explore the code structure.

Failed to execute Terminal


Troubleshooting Git Clone Timeout via API, Tarball, and Curl

Git clone keeps timing out. Let me explore the source code directly through GitHub's web interface.

Browse
https://github.com/anifest09/loveassist/tree/main/frontend/src


Locate Demo Mode Button in Expo Router App

Let me explore the app directory (Expo Router pages) and components to find the demo mode button.

Browse
https://github.com/anifest09/loveassist/tree/main/frontend/app


Locate Demo Mode Button in Login Screen

Let me check the login screen first — that's typically where demo mode buttons are found.

Browse
https://github.com/anifest09/loveassist/blob/main/frontend/app/login.tsx


Locate Demo Sign-In Button in login.tsx Using signInDev

I can see references to a "dev" sign-in mode. Let me scroll down to find the demo mode button in the UI.

Scroll down webpage


Find Demo Button in JSX

I found the handleDev function. Let me continue scrolling to find the demo button in the JSX.

Scroll down webpage


Download Modal File with Curl and Remove Demo Buttons

I found the demo mode button and all related code. Let me also check the auth-context for the signInDev function, then download and modify the files.

Browse
https://raw.githubusercontent.com/anifest09/loveassist/main/frontend/src/auth-context.tsx


Check api.ts for devLogin, download files, edit


Browse
https://raw.githubusercontent.com/anifest09/loveassist/main/frontend/src/api.ts


Remove dev login functions from auth context and API

Now I have a complete picture of all the demo mode code. Let me download and modify the three affected files.

Failed to execute Terminal


Download file via Python requests after curl timeout

Network seems slow. Let me use Python to download the files.

Execute Python code


Handling Python Environment Timeout with Explicit Timeout Setting


Execute Python code


Create updated auth-context.tsx and api.ts files from existing content

Network downloads are blocked. Let me use the file content I already obtained from the browser and create the modified files directly.

Execute Python code


Think

Let me write the modified files directly using the content I already obtained from the browser.

File created


Think

Now let me write the auth-context.tsx with signInDev removed.

File created


Think

Now let me write the api.ts with devLogin removed.

File created


Verify Written Files and Summarize Changes

Let me verify all the modified files are correctly written.

Read
login.tsx


Read
auth-context.tsx


Read
api.ts


Think

I see signInDev is still present in auth-context.tsx. Let me check the full file and fix it.

Read
auth-context.tsx


Think

The file wasn't properly overwritten. Let me fix it with targeted edits to remove all signInDev references.

Edit
auth-context.tsx


Think


Edit
auth-context.tsx


Think


Failed to edit file


Think


Edit
auth-context.tsx


Think

Let me verify the auth-context.tsx is now clean.

Read
auth-context.tsx


Think

auth-context.tsx is now clean. Let me verify login.tsx has no remaining demo references.

Execute Terminal
Check for remaining demo references


Think

The login.tsx still has demo code too. Let me fix it with targeted edits.

Edit
login.tsx


Think


Edit
login.tsx


Think


Read
login.tsx


Think


Edit
login.tsx


Think

Now let me find and remove the "Try Demo" ghost button.

Read
login.tsx


Think


Edit
login.tsx


Think

Now let me fix the Apple Sign-In modal — remove the "Continue with Demo" button and update the text.

Read
login.tsx


Think


Edit
login.tsx


Think


Edit
login.tsx


Think

Now let me clean up the unused styles (ghostBtn, ghostBtnText, modalSecondaryBtn, modalSecondaryText).

Read
login.tsx


Think


Read
login.tsx


Think


Read
login.tsx


Think


Edit
login.tsx


Think


Edit
login.tsx


Think

Let me do a final verification of all three files.

Execute Terminal
Final verification of all files


Think

All demo mode code has been successfully removed. Here's a summary of the changes made to 3 files:
Changes Summary

Table


File	Changes
frontend/app/login.tsx	Removed the "Try Demo" ghost button, removed handleDev function, removed signInDev from auth import, removed "dev" from busy state type, removed "Continue with Demo" button from Apple modal, updated modal text, cleaned up unused styles (ghostBtn, ghostBtnText, modalSecondaryBtn, modalSecondaryText)
frontend/src/auth-context.tsx	Removed signInDev from AuthContextType, removed signInDev callback function, removed from value memo and dependency array
frontend/src/api.ts	Removed devLogin endpoint from the API client
The login screen now only shows Google and Apple sign-in options. The Apple Sign-In modal on non-iOS devices now directs users to "Continue with Google" instead of offering a demo mode fallback.

All files
View or download files






Task completed



Trial credits used up
Upgrade
K2.6 Agent


login.tsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Dimensions, Modal } from "react-native";
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
  const { signInGoogleWithSessionId, signInApple, user, loading } = useAuth();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);

  // Detect Apple Sign In availability (iOS only) — but the button is always shown
  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
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

  const handleApple = async () => {
    setErrorMsg(null);
    // On non-iOS (Web/Android preview) — Apple Sign-In can't run natively.
    // Show our custom modal so the button feels fully alive on every platform.
    if (Platform.OS !== "ios" || !appleAvailable) {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
      setShowAppleModal(true);
      return;
    }
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

          {/* Apple Sign-In — always visible (per Apple App Store guideline 4.8) */}
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
          {!appleAvailable && Platform.OS !== "ios" && (
            <Text style={styles.appleHint}>Apple Sign-In activates on iOS devices</Text>
          )}

          {errorMsg && <Text style={styles.error} testID="login-error">{errorMsg}</Text>}

          <View style={styles.trialPill}>
            <Ionicons name="gift-outline" size={11} color={COLORS.neonPink} />
            <Text style={styles.trialText}>7-day Premium trial — no card needed</Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Apple Sign-In info modal (shown on web/Android since native flow needs iOS build) */}
      <Modal
        visible={showAppleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="logo-apple" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Apple Sign-In</Text>
            <Text style={styles.modalBody}>
              Apple Sign-In only runs on real iOS devices. It activates automatically once you generate an iOS build via the{" "}
              <Text style={styles.modalBold}>Publish</Text> button (top-right).
              {"\n\n"}For now, sign in with Google to preview the full app.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => { setShowAppleModal(false); handleGoogle(); }}
              activeOpacity={0.9}
              testID="apple-modal-google"
            >
              <Ionicons name="logo-google" size={15} color="#0A0A0F" />
              <Text style={styles.modalPrimaryText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowAppleModal(false)}
              activeOpacity={0.9}
              testID="apple-modal-cancel"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  appleHint: {
    marginTop: 6,
    alignSelf: "center",
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    opacity: 0.7,
  },

  // Apple modal (shown when user taps Apple Sign-In on a non-iOS device)
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#15101F",
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  modalTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 19,
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  modalBody: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: 4,
  },
  modalBold: { fontFamily: FONTS.bodyBold, color: COLORS.textPrimary },
  modalPrimaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    marginTop: 4,
    minHeight: 50,
  },
  modalPrimaryText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 14.5,
    color: "#0A0A0F",
    letterSpacing: 0.2,
  },
  modalCancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

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
