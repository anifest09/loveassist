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
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { ModeSelector } from "@/src/components/ModeSelector";
import { SuggestionCard, LoadingSuggestions } from "@/src/components/SuggestionCard";
import { SafetyNotice } from "@/src/components/SafetyNotice";
import { LanguagePickerModal } from "@/src/components/LanguagePickerModal";
import { useTranslate } from "@/src/hooks/use-translate";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

type Mode = "normal" | "flirty" | "exclusive";
type InputMode = "text" | "bio";

export default function FirstMessageScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuth();

  // Input mode toggle
  const [inputMode, setInputMode] = useState<InputMode>("text");

  // Text mode state
  const [aboutPerson, setAboutPerson] = useState("");
  const [context, setContext] = useState("");

  // Bio image mode state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [bioContext, setBioContext] = useState("");
  const [permissionDeniedHard, setPermissionDeniedHard] = useState(false);

  const [mode, setMode] = useState<Mode>(
    (user?.default_mode as Mode) || "normal",
  );
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const language = user?.preferred_language || "en";
  const tr = useTranslate(language);

  const switchInputMode = (m: InputMode) => {
    try { Haptics.selectionAsync(); } catch {}
    setInputMode(m);
    setSuggestions(null);
    setError(null);
    setErrorCode(null);
  };

  const pickBio = async () => {
    setError(null);
    setErrorCode(null);
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = perm.status;
    let canAskAgain = perm.canAskAgain;
    if (status !== "granted") {
      if (!canAskAgain) {
        setPermissionDeniedHard(true);
        setError("Photo access is blocked. Open Settings to enable it for LoveAssist.");
        return;
      }
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = req.status;
      canAskAgain = req.canAskAgain;
      if (status !== "granted") {
        if (!canAskAgain) setPermissionDeniedHard(true);
        setError("Photo access is required to upload a bio screenshot.");
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
    if (Platform.OS !== "web") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Linking } = require("react-native");
      Linking.openSettings?.();
    }
  };

  const generate = async () => {
    if (inputMode === "text") {
      if (!aboutPerson.trim()) {
        setError("Tell me a bit about the person you want to message.");
        setErrorCode(null);
        return;
      }
    } else {
      if (!imageBase64) {
        setError("Upload a bio screenshot first.");
        setErrorCode(null);
        return;
      }
    }
    setError(null);
    setErrorCode(null);
    setSuggestions(null);
    setLoading(true);
    try {
      let res;
      let promptSummary = "";
      if (inputMode === "text") {
        res = await api.firstMessage({
          about_person: aboutPerson.trim(),
          context: context.trim(),
          mode,
          language,
          count: 4,
        });
        promptSummary = aboutPerson.trim().slice(0, 140);
      } else {
        res = await api.firstMessageFromBio({
          image_base64: imageBase64 as string,
          mode,
          language,
          count: 4,
          extra_context: bioContext.trim(),
        });
        promptSummary = bioContext.trim()
          ? `Bio screenshot · ${bioContext.trim().slice(0, 120)}`
          : "Bio screenshot openers";
      }
      setSuggestions(res.suggestions);
      if (res.suggestions.length) {
        api
          .saveHistory({
            kind: inputMode === "bio" ? "bio-opener" : "first-message",
            prompt_summary: promptSummary,
            suggestions: res.suggestions,
            mode,
            language,
          })
          .catch(() => {});
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate suggestions");
      setErrorCode(e?.code ?? null);
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
          testID="first-back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>STEP 02</Text>
          <Text style={styles.title}>First <Text style={styles.titleItalic}>Message</Text></Text>
          <Text style={styles.subtitle}>Break the ice with a great opener.</Text>
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
          {/* Input mode toggle */}
          <Text style={styles.label}>HOW DO YOU WANT TO START?</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segment, inputMode === "text" && styles.segmentActive]}
              onPress={() => switchInputMode("text")}
              activeOpacity={0.85}
              testID="first-segment-text"
            >
              <Ionicons
                name="create-outline"
                size={15}
                color={inputMode === "text" ? "#0A0A0F" : COLORS.textPrimary}
              />
              <Text style={[styles.segmentText, inputMode === "text" && styles.segmentTextActive]}>
                Describe them
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, inputMode === "bio" && styles.segmentActive]}
              onPress={() => switchInputMode("bio")}
              activeOpacity={0.85}
              testID="first-segment-bio"
            >
              <Ionicons
                name="image-outline"
                size={15}
                color={inputMode === "bio" ? "#0A0A0F" : COLORS.textPrimary}
              />
              <Text style={[styles.segmentText, inputMode === "bio" && styles.segmentTextActive]}>
                Upload bio
              </Text>
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>NEW</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>MODE</Text>
          <ModeSelector
            value={mode}
            onChange={setMode}
            isPremium={isPremium}
            onLockedPress={() => router.push("/(tabs)/premium")}
          />

          {inputMode === "text" ? (
            <Animated.View entering={FadeIn.duration(220)} key="text-mode">
              <Text style={styles.label}>ABOUT THE PERSON</Text>
              <TextInput
                testID="first-about-input"
                value={aboutPerson}
                onChangeText={setAboutPerson}
                placeholder="E.g. Met at a friend's birthday. Photographer, loves indie music and ramen."
                placeholderTextColor={COLORS.textMuted}
                style={styles.textArea}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.label}>EXTRA CONTEXT (OPTIONAL)</Text>
              <TextInput
                testID="first-context-input"
                value={context}
                onChangeText={setContext}
                placeholder="E.g. We're matched on Hinge. Their profile mentions a recent trip to Lisbon."
                placeholderTextColor={COLORS.textMuted}
                style={styles.textArea}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(220)} key="bio-mode">
              <Text style={styles.label}>BIO SCREENSHOT</Text>
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.preview}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={pickBio}
                    testID="first-bio-change"
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh" size={14} color={COLORS.textPrimary} />
                    <Text style={styles.changeText}>Replace</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dropzone}
                  onPress={pickBio}
                  activeOpacity={0.85}
                  testID="first-bio-pick"
                >
                  <View style={styles.dropIconWrap}>
                    <Ionicons name="image" size={26} color={COLORS.neonPink} />
                  </View>
                  <Text style={styles.dropTitle}>Upload their profile / bio</Text>
                  <Text style={styles.dropSub}>Hinge · Tinder · Bumble · Instagram</Text>
                  <View style={styles.dropHint}>
                    <Ionicons name="sparkles" size={11} color={COLORS.neonViolet} />
                    <Text style={styles.dropHintText}>AI reads prompts, interests &amp; photos</Text>
                  </View>
                </TouchableOpacity>
              )}
              {permissionDeniedHard && (
                <TouchableOpacity
                  style={styles.settingsBtn}
                  onPress={openSettings}
                  testID="first-bio-open-settings"
                >
                  <Ionicons name="settings-outline" size={14} color={COLORS.textPrimary} />
                  <Text style={styles.settingsText}>Open Settings</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>EXTRA CONTEXT (OPTIONAL)</Text>
              <TextInput
                testID="first-bio-context-input"
                value={bioContext}
                onChangeText={setBioContext}
                placeholder="E.g. We matched on Hinge — I want to sound playful, not generic."
                placeholderTextColor={COLORS.textMuted}
                style={styles.textArea}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Animated.View>
          )}

          {error && (
            <SafetyNotice
              message={error}
              isSafetyBlock={errorCode === "SAFETY_BLOCKED"}
              testID="first-error"
            />
          )}

          <TouchableOpacity
            style={[
              loading && { opacity: 0.6 },
              inputMode === "bio" && !imageBase64 && { opacity: 0.55 },
              { marginTop: SPACING.xl },
            ]}
            onPress={() => { try { Haptics.selectionAsync(); } catch {}; generate(); }}
            disabled={loading || (inputMode === "bio" && !imageBase64)}
            activeOpacity={0.9}
            testID="first-generate"
          >
            <LinearGradient colors={GRADIENTS.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <>
                  <Ionicons
                    name={inputMode === "bio" ? "sparkles" : "send"}
                    size={16}
                    color={COLORS.textInverse}
                  />
                  <Text style={styles.ctaText}>
                    {inputMode === "bio" ? "Generate openers from bio" : "Generate openers"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {loading && <LoadingSuggestions />}

          {suggestions && suggestions.length > 0 && (
            <Animated.View entering={FadeInDown.duration(280)} style={{ marginTop: SPACING.xl }}>
              <Text style={styles.label}>OPENERS</Text>
              {suggestions.map((s, i) => (
                <SuggestionCard
                  key={i}
                  suggestion={s}
                  index={i}
                  testIDPrefix="first"
                  onTranslate={
                    isPremium
                      ? () => tr.openPicker(i)
                      : () => router.push("/(tabs)/premium")
                  }
                  translatedText={tr.translations[i]?.text}
                  translating={tr.translatingIdx === i}
                  translationLabel={tr.labelFor(i)}
                  onClearTranslation={() => tr.clearTranslation(i)}
                />
              ))}
            </Animated.View>
          )}

          <LanguagePickerModal
            visible={tr.pickerOpenFor !== null}
            selected={
              tr.pickerOpenFor !== null
                ? tr.translations[tr.pickerOpenFor]?.lang
                : undefined
            }
            title="Translate into…"
            subtitle="Pick any of 20 languages."
            onSelect={(code) => {
              if (tr.pickerOpenFor !== null && suggestions) {
                tr.translate(
                  tr.pickerOpenFor,
                  suggestions[tr.pickerOpenFor],
                  code,
                  language,
                );
              }
            }}
            onClose={tr.closePicker}
          />

          {tr.error && (
            <SafetyNotice
              message={tr.error}
              isSafetyBlock={tr.errorCode === "SAFETY_BLOCKED"}
              testID="translate-error-first"
            />
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
  title: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.textPrimary, marginTop: 2, letterSpacing: -0.3 },
  titleItalic: { fontFamily: FONTS.displayItalic, color: COLORS.rose },
  eyebrow: { fontFamily: FONTS.bodyHeavy, fontSize: 9, color: COLORS.rose, letterSpacing: 2 },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  label: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  // Segmented input-mode toggle
  segmentRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 12,
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  segmentTextActive: { color: "#0A0A0F" },
  newPill: {
    marginLeft: 4,
    backgroundColor: COLORS.neonPink,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newPillText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 8,
    color: "#0A0A0F",
    letterSpacing: 0.4,
  },

  textArea: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    minHeight: 90,
    padding: SPACING.lg,
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // Bio dropzone
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(236,72,153,0.35)",
    backgroundColor: "rgba(139,92,246,0.06)",
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 180,
  },
  dropIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(236,72,153,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  dropTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  dropSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  dropHint: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },
  dropHintText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    color: COLORS.neonViolet,
    letterSpacing: 0.2,
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
    height: 320,
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
  changeText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.textPrimary },
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
  settingsText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.textPrimary },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    minHeight: 54,
  },
  ctaText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.3,
  },
});
