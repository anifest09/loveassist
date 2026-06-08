import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Screen } from "@/src/components/Screen";
import { PremiumBanner } from "@/src/components/PremiumBanner";
import { useAuth } from "@/src/auth-context";
import { COLORS, RADIUS, SPACING } from "@/src/theme";

type ActionCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accent?: boolean;
  premium?: boolean;
};

const ACTIONS: ActionCard[] = [
  {
    key: "suggest",
    title: "Reply Suggestions",
    subtitle: "Get smart replies for any situation",
    icon: "chatbubbles",
    route: "/suggest",
    accent: true,
  },
  {
    key: "screenshot",
    title: "Screenshot Analysis",
    subtitle: "Upload a chat and get reply ideas",
    icon: "image",
    route: "/screenshot",
  },
  {
    key: "first",
    title: "First Message",
    subtitle: "Break the ice with a great opener",
    icon: "send",
    route: "/first-message",
  },
];

export default function HomeTab() {
  const router = useRouter();
  const { user, subscription } = useAuth();
  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <Screen
      title={`Hi, ${firstName}`}
      subtitle="What can I help you say today?"
      testID="home-screen"
      rightSlot={
        <TouchableOpacity
          testID="home-profile-shortcut"
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {(user?.name || "?").trim().charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      }
    >
      <PremiumBanner
        status={subscription?.status}
        trialEnd={subscription?.trial_end}
        onPress={() => router.push("/(tabs)/premium")}
      />

      <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.key}
            activeOpacity={0.9}
            onPress={() => router.push(a.route as any)}
            style={[
              styles.card,
              a.accent && styles.cardAccent,
            ]}
            testID={`home-action-${a.key}`}
          >
            <View
              style={[
                styles.iconWrap,
                a.accent ? styles.iconWrapAccent : null,
              ]}
            >
              <Ionicons
                name={a.icon}
                size={20}
                color={a.accent ? COLORS.textInverse : COLORS.terracotta}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  a.accent && { color: COLORS.textInverse },
                ]}
              >
                {a.title}
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  a.accent && { color: "rgba(253,251,247,0.85)" },
                ]}
              >
                {a.subtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={a.accent ? COLORS.textInverse : COLORS.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>WHY LOVEASSIST</Text>
      <View style={styles.tipCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.terracotta} />
        <Text style={styles.tipText}>
          Built-in safety filters keep every suggestion respectful and
          consent-aware. Your conversations are never shared.
        </Text>
      </View>
      <View style={styles.tipCard}>
        <Ionicons name="globe-outline" size={20} color={COLORS.terracotta} />
        <Text style={styles.tipText}>
          Generate suggestions in 5 languages — change anytime from your profile.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.textInverse,
    fontWeight: "700",
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  cardAccent: {
    backgroundColor: COLORS.terracotta,
    borderColor: COLORS.terracotta,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bgBase,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapAccent: {
    backgroundColor: "rgba(253,251,247,0.18)",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    marginBottom: SPACING.md,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
});
