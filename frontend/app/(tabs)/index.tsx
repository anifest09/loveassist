import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PremiumBanner } from "@/src/components/PremiumBanner";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS, SHADOWS } from "@/src/theme";

type ActionCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  primary?: boolean;
};

const ACTIONS: ActionCard[] = [
  { key: "suggest", title: "Smart Replies", subtitle: "Get tailored responses for any chat", icon: "chatbubbles", route: "/suggest", primary: true },
  { key: "screenshot", title: "Screenshot Reader", subtitle: "Upload a conversation, get reply ideas", icon: "scan", route: "/screenshot" },
  { key: "first", title: "First Message", subtitle: "Opener from bio screenshot or text", icon: "paper-plane", route: "/first-message" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}

export default function HomeTab() {
  const router = useRouter();
  const { user, subscription } = useAuth();
  const firstName = (user?.name || "there").split(" ")[0];
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  const tap = (path: string) => {
    try { Haptics.selectionAsync(); } catch {}
    router.push(path as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>{greeting()},</Text>
            <Text style={styles.name}>
              {firstName}<Text style={styles.nameItalic}>.</Text>
            </Text>
          </View>
          <TouchableOpacity testID="home-profile-shortcut" onPress={() => tap("/(tabs)/profile")} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.rose} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bannerWrap}>
          <PremiumBanner status={subscription?.status} trialEnd={subscription?.trial_end} onPress={() => tap("/(tabs)/premium")} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.dot} />
          <Text style={styles.sectionHint}>Pick a flow</Text>
        </View>

        {ACTIONS.map((a, i) => {
          if (a.primary) {
            return (
              <Animated.View key={a.key} entering={FadeInDown.delay(i * 70).springify()}>
                <TouchableOpacity activeOpacity={0.92} onPress={() => tap(a.route)} testID={`home-action-${a.key}`}>
                  <LinearGradient colors={GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primaryCard, SHADOWS.card]}>
                    <View style={styles.primaryHeader}>
                      <View style={styles.primaryIcon}>
                        <Ionicons name={a.icon} size={22} color={COLORS.goldBright} />
                      </View>
                      <View style={styles.featuredPill}>
                        <Ionicons name="sparkles" size={9} color={COLORS.goldBright} />
                        <Text style={styles.featuredText}>FEATURED</Text>
                      </View>
                    </View>
                    <Text style={styles.primaryTitle}>{a.title}</Text>
                    <Text style={styles.primarySub}>{a.subtitle}</Text>
                    <View style={styles.primaryFooter}>
                      <Text style={styles.primaryCta}>Open</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.goldBright} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          }
          return (
            <Animated.View key={a.key} entering={FadeInDown.delay(i * 70).springify()}>
              <TouchableOpacity activeOpacity={0.92} onPress={() => tap(a.route)} style={[styles.card, SHADOWS.soft]} testID={`home-action-${a.key}`}>
                <View style={styles.cardIcon}>
                  <Ionicons name={a.icon} size={20} color={COLORS.rose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardSub}>{a.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>WHY LOVEASSIST</Text>
          <View style={styles.dot} />
          <Text style={styles.sectionHint}>Built with care</Text>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}><Ionicons name="shield-checkmark" size={18} color={COLORS.success} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Respectful by design</Text>
            <Text style={styles.tipText}>Safety filters keep every reply consent-aware. Your conversations stay private.</Text>
          </View>
        </View>
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}><Ionicons name="globe-outline" size={18} color={COLORS.copper} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Five languages, your voice</Text>
            <Text style={styles.tipText}>Generate suggestions in English, Spanish, French, Hindi, or Portuguese.</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.lg,
  },
  greet: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, letterSpacing: 0.2 },
  name: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.textPrimary, marginTop: 2, lineHeight: 32 },
  nameItalic: { fontFamily: FONTS.displayItalic, color: COLORS.rose },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: COLORS.textInverse, fontFamily: FONTS.bodyBold, fontSize: 16 },
  bannerWrap: { paddingHorizontal: SPACING.lg },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionLabel: { fontFamily: FONTS.bodyHeavy, fontSize: 10, color: COLORS.textSecondary, letterSpacing: 2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.sandBorderDark },
  sectionHint: { fontFamily: FONTS.bodyMedium, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.5, fontStyle: "italic" },
  primaryCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.25)",
    minHeight: 180,
  },
  primaryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(200,165,116,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  featuredPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.4)",
    backgroundColor: "rgba(200,165,116,0.10)",
  },
  featuredText: { color: COLORS.goldBright, fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 1.2 },
  primaryTitle: { color: COLORS.textInverse, fontFamily: FONTS.display, fontSize: 26, marginTop: SPACING.md, letterSpacing: -0.3 },
  primarySub: { color: "rgba(251,247,242,0.72)", fontFamily: FONTS.body, fontSize: 13, marginTop: 4, lineHeight: 19 },
  primaryFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.md },
  primaryCta: { color: COLORS.goldBright, fontFamily: FONTS.bodyBold, fontSize: 13, letterSpacing: 0.5 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.bgBase,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.blush,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontFamily: FONTS.displayMedium, fontSize: 17, color: COLORS.textPrimary, marginBottom: 2 },
  cardSub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  tipIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.bgBase,
    alignItems: "center", justifyContent: "center",
  },
  tipTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.textPrimary, marginBottom: 2 },
  tipText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
