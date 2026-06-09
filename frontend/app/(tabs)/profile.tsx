import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, FONTS, LANGUAGES, MODE_META } from "@/src/theme";

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

  const onDeleteAccount = () => {
    const confirmDelete = async () => {
      setBusy("delete");
      try {
        await api.deleteAccount();
        await signOut();
        router.replace("/onboarding");
      } catch (e: any) {
        if (Platform.OS === "web") {
          // eslint-disable-next-line no-alert
          window.alert("Failed to delete account: " + (e?.message || "unknown"));
        } else {
          Alert.alert("Error", e?.message || "Failed to delete account");
        }
      } finally {
        setBusy(null);
      }
    };

    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(
        "Delete account permanently?\n\nThis will permanently erase your account, history, chats, and subscription data. This cannot be undone.",
      );
      if (ok) confirmDelete();
      return;
    }

    Alert.alert(
      "Delete account permanently?",
      "This will permanently erase your account, chat history, and subscription. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete forever", style: "destructive", onPress: confirmDelete },
      ],
    );
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
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>Profile<Text style={styles.titleItalic}>.</Text></Text>

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

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDeleteAccount}
          activeOpacity={0.85}
          disabled={busy === "delete"}
          testID="profile-delete-account"
        >
          {busy === "delete" ? (
            <ActivityIndicator color="#F87171" size="small" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#F87171" />
          )}
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteSub}>
          Permanently erases your account, history, and subscription data. Required by Apple Sign-In policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  eyebrow: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    color: COLORS.rose,
    letterSpacing: 2,
    marginTop: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginTop: 2,
    marginBottom: SPACING.lg,
    lineHeight: 32,
  },
  titleItalic: { fontFamily: FONTS.displayItalic, color: COLORS.rose },
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
    backgroundColor: COLORS.rose,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: 22,
    fontFamily: FONTS.bodyBold,
  },
  name: { fontSize: 16, fontFamily: FONTS.bodyBold, color: COLORS.textPrimary },
  email: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontFamily: FONTS.body },
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
    fontFamily: FONTS.bodyHeavy,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    color: COLORS.textSecondary,
    letterSpacing: 2.2,
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
    borderColor: COLORS.rose,
    backgroundColor: COLORS.bgBase,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bodySemi,
    color: COLORS.textPrimary,
  },
  optionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontFamily: FONTS.body,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.sandBorderDark,
  },
  lockBadge: {
    backgroundColor: COLORS.goldBright,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bodyHeavy,
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
    fontFamily: FONTS.bodyBold,
  },
  deleteBtn: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.30)",
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  deleteText: {
    fontSize: 13,
    color: "#F87171",
    fontFamily: FONTS.bodyBold,
  },
  deleteSub: {
    marginTop: 8,
    paddingHorizontal: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontFamily: FONTS.body,
    lineHeight: 16,
    textAlign: "center",
  },
});
