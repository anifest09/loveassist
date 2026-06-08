import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, LANGUAGES, MODE_META } from "@/src/theme";

export default function ProfileTab() {
  const router = useRouter();
  const { user, subscription, signOut, updateUserLocal, isPremium } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const setLanguage = async (code: string) => {
    setBusy(`lang-${code}`);
    try {
      const res = await api.updateSettings({ preferred_language: code });
      updateUserLocal({ preferred_language: res.user.preferred_language });
    } finally {
      setBusy(null);
    }
  };

  const setMode = async (mode: "normal" | "flirty" | "exclusive") => {
    if (mode === "exclusive" && !isPremium) return;
    setBusy(`mode-${mode}`);
    try {
      const res = await api.updateSettings({ default_mode: mode });
      updateUserLocal({ default_mode: res.user.default_mode });
    } finally {
      setBusy(null);
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const lang = user?.preferred_language ?? "en";
  const defaultMode = user?.default_mode ?? "normal";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard} testID="profile-card">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || "?").trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || "Guest"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View
              style={[
                styles.tier,
                isPremium ? styles.tierPremium : styles.tierFree,
              ]}
            >
              <Ionicons
                name={
                  subscription?.status === "active"
                    ? "diamond"
                    : subscription?.status === "trialing"
                    ? "sparkles"
                    : "person"
                }
                size={11}
                color={isPremium ? COLORS.gold : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tierText,
                  isPremium && { color: COLORS.gold },
                ]}
              >
                {subscription?.status === "active"
                  ? "PREMIUM"
                  : subscription?.status === "trialing"
                  ? "FREE TRIAL"
                  : "FREE"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>LANGUAGE</Text>
        <View style={styles.optionList}>
          {LANGUAGES.map((l) => {
            const selected = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.optionRow, selected && styles.optionSelected]}
                activeOpacity={0.85}
                onPress={() => setLanguage(l.code)}
                testID={`profile-lang-${l.code}`}
                disabled={busy !== null}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{l.name}</Text>
                  <Text style={styles.optionSub}>{l.native}</Text>
                </View>
                {busy === `lang-${l.code}` ? (
                  <ActivityIndicator size="small" color={COLORS.terracotta} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.terracotta} />
                ) : (
                  <View style={styles.radio} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>DEFAULT MODE</Text>
        <View style={styles.optionList}>
          {(["normal", "flirty", "exclusive"] as const).map((m) => {
            const meta = MODE_META[m];
            const selected = defaultMode === m;
            const locked = m === "exclusive" && !isPremium;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.optionRow, selected && styles.optionSelected]}
                activeOpacity={0.85}
                onPress={() => setMode(m)}
                disabled={locked || busy !== null}
                testID={`profile-mode-${m}`}
              >
                <Text style={{ fontSize: 18, marginRight: SPACING.md }}>
                  {meta.emoji}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{meta.label}</Text>
                  <Text style={styles.optionSub}>{meta.description}</Text>
                </View>
                {locked ? (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockBadgeText}>PREMIUM</Text>
                  </View>
                ) : busy === `mode-${m}` ? (
                  <ActivityIndicator size="small" color={COLORS.terracotta} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.terracotta} />
                ) : (
                  <View style={styles.radio} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onSignOut}
          activeOpacity={0.85}
          testID="profile-logout"
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.rose} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: 22,
    fontWeight: "700",
  },
  name: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  email: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tier: {
    marginTop: SPACING.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  tierFree: {
    backgroundColor: COLORS.bgBase,
    borderColor: COLORS.sandBorder,
  },
  tierPremium: {
    backgroundColor: COLORS.bgPremium,
    borderColor: COLORS.gold,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  optionList: { gap: SPACING.sm },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    minHeight: 56,
  },
  optionSelected: {
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.bgBase,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  optionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.sandBorderDark,
  },
  lockBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2C2C2A",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    backgroundColor: COLORS.bgSurface,
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.rose,
    fontWeight: "600",
  },
});
