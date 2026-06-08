import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1571771826307-98d0d0999028?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBsYXVnaGluZyUyMGNhbmRpZCUyMHdhcm18ZW58MHx8fHwxNzgwOTU1NjExfDA&ixlib=rb-4.1.0&q=85";

function parseSessionId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Try hash first, then query
  const hashMatch = url.match(/[#&]session_id=([^&]+)/);
  if (hashMatch) return decodeURIComponent(hashMatch[1]);
  const qMatch = url.match(/[?&]session_id=([^&]+)/);
  if (qMatch) return decodeURIComponent(qMatch[1]);
  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signInGoogleWithSessionId, signInDev, user, loading } = useAuth();
  const [busy, setBusy] = useState<"google" | "dev" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)");
    }
  }, [loading, user, router]);

  // Handle web: parse session_id from URL on mount and after redirect
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const url =
      typeof window !== "undefined"
        ? window.location.hash + window.location.search
        : "";
    const sessionId = parseSessionId(url);
    if (sessionId) {
      (async () => {
        try {
          setBusy("google");
          await signInGoogleWithSessionId(sessionId);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }
          router.replace("/(tabs)");
        } catch (e: any) {
          setErrorMsg(e?.message ?? "Sign-in failed");
        } finally {
          setBusy(null);
        }
      })();
    }
  }, [signInGoogleWithSessionId, router]);

  const handleGoogle = async () => {
    setErrorMsg(null);
    setBusy("google");
    try {
      const redirectUrl =
        Platform.OS === "web"
          ? typeof window !== "undefined"
            ? window.location.origin + "/login"
            : ""
          : Linking.createURL("login");
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
        redirectUrl,
      )}`;

      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === "success" && result.url) {
        const sessionId = parseSessionId(result.url);
        if (sessionId) {
          await signInGoogleWithSessionId(sessionId);
          router.replace("/(tabs)");
          return;
        }
        setErrorMsg("Could not read session from redirect.");
      } else if (result.type === "cancel" || result.type === "dismiss") {
        // user cancelled
      } else {
        setErrorMsg("Authentication did not complete.");
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDev = async () => {
    setErrorMsg(null);
    setBusy("dev");
    try {
      const email = `demo+${Date.now().toString(36)}@loveassist.ai`;
      await signInDev("Demo User", email);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Demo sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.heroWrap}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.hero} />
        <View style={styles.heroOverlay} />
        <View style={styles.heroBadge}>
          <Ionicons name="heart" size={14} color={COLORS.terracotta} />
          <Text style={styles.heroBadgeText}>LoveAssist AI</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.tag}>YOUR CONVERSATION WINGMAN</Text>
        <Text style={styles.headline}>
          Never run out of{"\n"}things to say.
        </Text>
        <Text style={styles.sub}>
          Start chats, keep them flowing, and build real connection — with
          AI-crafted suggestions in any tone.
        </Text>

        <View style={{ gap: SPACING.sm, marginTop: SPACING.xl }}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleGoogle}
            activeOpacity={0.9}
            disabled={busy !== null}
            testID="login-google-button"
          >
            {busy === "google" ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={COLORS.textInverse} />
                <Text style={styles.btnTextPrimary}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
            onPress={handleDev}
            activeOpacity={0.9}
            disabled={busy !== null}
            testID="login-demo-button"
          >
            {busy === "dev" ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.btnTextGhost}>Try a demo account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {errorMsg && (
          <Text style={styles.error} testID="login-error">
            {errorMsg}
          </Text>
        )}

        <Text style={styles.disclaimer}>
          By continuing you accept our terms. Free 7-day trial of Premium on signup.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  heroWrap: {
    height: 320,
    margin: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.bgSurface,
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(44,44,42,0.18)",
  },
  heroBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bgBase,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  tag: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.terracotta,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  headline: {
    fontSize: 34,
    fontWeight: "300",
    color: COLORS.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: SPACING.md,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    minHeight: 52,
  },
  btnPrimary: {
    backgroundColor: COLORS.terracotta,
  },
  btnTextPrimary: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: "600",
  },
  btnGhost: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  btnTextGhost: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    marginTop: SPACING.md,
    color: COLORS.rose,
    fontSize: 13,
    textAlign: "center",
  },
  disclaimer: {
    marginTop: SPACING.lg,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
});
