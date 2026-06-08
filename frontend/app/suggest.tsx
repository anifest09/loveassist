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
import { COLORS, RADIUS, SPACING } from "@/src/theme";

type Mode = "normal" | "flirty" | "exclusive";

const RELATIONSHIPS = [
  { key: "crush", label: "Crush" },
  { key: "partner", label: "Partner" },
  { key: "friend", label: "Friend" },
  { key: "date", label: "Date" },
];

export default function SuggestScreen() {
  const router = useRouter();
  const { user, isPremium } = useAuth();
  const [context, setContext] = useState("");
  const [relationship, setRelationship] = useState("crush");
  const [mode, setMode] = useState<Mode>(
    (user?.default_mode as Mode) || "normal",
  );
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const language = user?.preferred_language || "en";

  const generate = async () => {
    if (!context.trim()) {
      setError("Tell me a bit about the situation first.");
      return;
    }
    setError(null);
    setSuggestions(null);
    setLoading(true);
    try {
      const res = await api.suggestions({
        context: context.trim(),
        relationship,
        mode,
        language,
        count: 4,
      });
      setSuggestions(res.suggestions);
      if (res.suggestions.length) {
        api
          .saveHistory({
            kind: "reply",
            prompt_summary: `${RELATIONSHIPS.find((r) => r.key === relationship)?.label || relationship}: ${context.trim().slice(0, 140)}`,
            suggestions: res.suggestions,
            mode,
            language,
          })
          .catch(() => {});
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate suggestions");
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
          testID="suggest-back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reply Suggestions</Text>
          <Text style={styles.subtitle}>What did they say? Get smart replies.</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: 80,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>RELATIONSHIP</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SPACING.sm, paddingRight: SPACING.lg }}
            style={styles.relWrap}
          >
            {RELATIONSHIPS.map((r) => {
              const selected = relationship === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  testID={`suggest-rel-${r.key}`}
                  onPress={() => setRelationship(r.key)}
                  style={[styles.relChip, selected && styles.relChipSelected]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.relChipText,
                      selected && { color: COLORS.textInverse },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>MODE</Text>
          <ModeSelector
            value={mode}
            onChange={setMode}
            isPremium={isPremium}
            onLockedPress={() => router.push("/(tabs)/premium")}
          />

          <Text style={styles.label}>SITUATION</Text>
          <TextInput
            testID="suggest-context-input"
            value={context}
            onChangeText={setContext}
            placeholder="E.g. She said 'Long week, finally crashing on the couch with leftovers 😩'"
            placeholderTextColor={COLORS.textMuted}
            style={styles.textArea}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {error && (
            <Text style={styles.error} testID="suggest-error">
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.cta, loading && { opacity: 0.6 }]}
            onPress={generate}
            disabled={loading}
            activeOpacity={0.9}
            testID="suggest-generate"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color={COLORS.textInverse} />
                <Text style={styles.ctaText}>Generate suggestions</Text>
              </>
            )}
          </TouchableOpacity>

          {loading && <LoadingSuggestions />}

          {suggestions && suggestions.length > 0 && (
            <View style={{ marginTop: SPACING.xl }}>
              <Text style={styles.label}>SUGGESTIONS</Text>
              {suggestions.map((s, i) => (
                <SuggestionCard
                  key={i}
                  suggestion={s}
                  index={i}
                  testIDPrefix="suggest"
                />
              ))}
            </View>
          )}

          {suggestions && suggestions.length === 0 && !loading && (
            <View style={styles.emptyResult}>
              <Text style={styles.emptyText}>
                No suggestions returned. Try adding more context.
              </Text>
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
  relWrap: {
    marginLeft: -SPACING.lg,
    paddingLeft: SPACING.lg,
  },
  relChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    minHeight: 36,
    justifyContent: "center",
    flexShrink: 0,
  },
  relChipSelected: {
    backgroundColor: COLORS.terracotta,
    borderColor: COLORS.terracotta,
  },
  relChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  textArea: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    minHeight: 110,
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
  emptyResult: { marginTop: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: 13, color: COLORS.textSecondary },
});
