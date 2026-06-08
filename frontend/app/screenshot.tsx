import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { ModeSelector } from "@/src/components/ModeSelector";
import { SuggestionCard, LoadingSuggestions } from "@/src/components/SuggestionCard";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

type Mode = "normal" | "flirty" | "exclusive";

export default function ScreenshotScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [extraContext, setExtraContext] = useState("");
  const [mode, setMode] = useState<Mode>(
    (user?.default_mode as Mode) || "normal",
  );
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDeniedHard, setPermissionDeniedHard] = useState(false);

  const language = user?.preferred_language || "en";

  const pick = async () => {
    setError(null);
    // Permission flow
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = perm.status;
    let canAskAgain = perm.canAskAgain;
    if (status !== "granted") {
      if (!canAskAgain) {
        setPermissionDeniedHard(true);
        setError(
          "Photo access is blocked. Open Settings to enable it for LoveAssist.",
        );
        return;
      }
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = req.status;
      canAskAgain = req.canAskAgain;
      if (status !== "granted") {
        if (!canAskAgain) setPermissionDeniedHard(true);
        setError("Photo access is required to upload a screenshot.");
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setImageUri(a.uri);
    setImageBase64(a.base64 ?? null);
    setSuggestions(null);
  };

  const openSettings = () => {
    // Linking.openSettings — guard for web
    if (Platform.OS !== "web") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Linking } = require("react-native");
      Linking.openSettings?.();
    }
  };

  const generate = async () => {
    if (!imageBase64) {
      setError("Pick a screenshot first.");
      return;
    }
    setError(null);
    setSuggestions(null);
    setLoading(true);
    try {
      const res = await api.screenshot({
        image_base64: imageBase64,
        mode,
        language,
        count: 4,
        extra_context: extraContext.trim(),
      });
      setSuggestions(res.suggestions);
      if (res.suggestions.length) {
        api
          .saveHistory({
            kind: "screenshot",
            prompt_summary:
              extraContext.trim()
                ? `Screenshot · ${extraContext.trim().slice(0, 120)}`
                : "Screenshot reply suggestions",
            suggestions: res.suggestions,
            mode,
            language,
          })
          .catch(() => {});
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to analyze screenshot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          testID="screenshot-back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Screenshot Analysis</Text>
          <Text style={styles.subtitle}>Upload a chat — get reply ideas.</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: 80,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>MODE</Text>
          <ModeSelector
            value={mode}
            onChange={setMode}
            isPremium={isPremium}
            onLockedPress={() => router.push("/(tabs)/premium")}
          />

          <Text style={styles.label}>SCREENSHOT</Text>
          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={pick}
                testID="screenshot-change"
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={14} color={COLORS.textPrimary} />
                <Text style={styles.changeText}>Replace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dropzone}
              onPress={pick}
              activeOpacity={0.85}
              testID="screenshot-pick"
            >
              <Ionicons name="cloud-upload-outline" size={26} color={COLORS.terracotta} />
              <Text style={styles.dropTitle}>Upload chat screenshot</Text>
              <Text style={styles.dropSub}>JPEG, PNG, WEBP</Text>
            </TouchableOpacity>
          )}
          {permissionDeniedHard && (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={openSettings}
              testID="screenshot-open-settings"
            >
              <Ionicons name="settings-outline" size={14} color={COLORS.textPrimary} />
              <Text style={styles.settingsText}>Open Settings</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>EXTRA CONTEXT (OPTIONAL)</Text>
          <TextInput
            testID="screenshot-context-input"
            value={extraContext}
            onChangeText={setExtraContext}
            placeholder="E.g. We're three weeks in, I want to suggest a second date."
            placeholderTextColor={COLORS.textMuted}
            style={styles.textArea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {error && (
            <Text style={styles.error} testID="screenshot-error">
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.cta, loading && { opacity: 0.6 }]}
            onPress={generate}
            disabled={loading || !imageBase64}
            activeOpacity={0.9}
            testID="screenshot-generate"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="scan" size={16} color={COLORS.textInverse} />
                <Text style={styles.ctaText}>Analyze & suggest replies</Text>
              </>
            )}
          </TouchableOpacity>

          {loading && <LoadingSuggestions />}

          {suggestions && suggestions.length > 0 && (
            <View style={{ marginTop: SPACING.xl }}>
              <Text style={styles.label}>REPLY IDEAS</Text>
              {suggestions.map((s, i) => (
                <SuggestionCard
                  key={i}
                  suggestion={s}
                  index={i}
                  testIDPrefix="screenshot"
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "600", color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.sandBorderDark,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    minHeight: 160,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  dropSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  previewWrap: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.md,
  },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgBase,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgBase,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  changeText: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  settingsBtn: {
    marginTop: SPACING.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  settingsText: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  textArea: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    minHeight: 80,
    padding: SPACING.lg,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  cta: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    minHeight: 52,
  },
  ctaText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.rose,
  },
});
