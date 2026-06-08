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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { ModeSelector } from "@/src/components/ModeSelector";
import { SuggestionCard, LoadingSuggestions } from "@/src/components/SuggestionCard";
import { SafetyNotice } from "@/src/components/SafetyNotice";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

type Mode = "normal" | "flirty" | "exclusive";

export default function FirstMessageScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuth();
  const [aboutPerson, setAboutPerson] = useState("");
  const [context, setContext] = useState("");
  const [mode, setMode] = useState<Mode>(
    (user?.default_mode as Mode) || "normal",
  );
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const language = user?.preferred_language || "en";

  const generate = async () => {
    if (!aboutPerson.trim()) {
      setError("Tell me a bit about the person you want to message.");
      setErrorCode(null);
      return;
    }
    setError(null);
    setErrorCode(null);
    setSuggestions(null);
    setLoading(true);
    try {
      const res = await api.firstMessage({
        about_person: aboutPerson.trim(),
        context: context.trim(),
        mode,
        language,
        count: 4,
      });
      setSuggestions(res.suggestions);
      if (res.suggestions.length) {
        api
          .saveHistory({
            kind: "first-message",
            prompt_summary: aboutPerson.trim().slice(0, 140),
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
          <Text style={styles.label}>MODE</Text>
          <ModeSelector
            value={mode}
            onChange={setMode}
            isPremium={isPremium}
            onLockedPress={() => router.push("/(tabs)/premium")}
          />

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

          {error && (
            <SafetyNotice
              message={error}
              isSafetyBlock={errorCode === "SAFETY_BLOCKED"}
              testID="first-error"
            />
          )}

          <TouchableOpacity
            style={[loading && { opacity: 0.6 }, { marginTop: SPACING.xl }]}
            onPress={() => { try { Haptics.selectionAsync(); } catch {}; generate(); }}
            disabled={loading}
            activeOpacity={0.9}
            testID="first-generate"
          >
            <LinearGradient colors={GRADIENTS.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={COLORS.textInverse} />
                  <Text style={styles.ctaText}>Generate openers</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {loading && <LoadingSuggestions />}

          {suggestions && suggestions.length > 0 && (
            <View style={{ marginTop: SPACING.xl }}>
              <Text style={styles.label}>OPENERS</Text>
              {suggestions.map((s, i) => (
                <SuggestionCard
                  key={i}
                  suggestion={s}
                  index={i}
                  testIDPrefix="first"
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
  error: {
    marginTop: SPACING.md,
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.danger,
  },
});
