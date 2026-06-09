import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

const { width: SCREEN_W } = Dimensions.get("window");

type Stats = Awaited<ReturnType<typeof api.adminStats>>;

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const data = await api.adminStats();
      setStats(data);
    } catch (e: any) {
      const msg = e?.message || "Failed to load stats";
      if (msg.toLowerCase().includes("admin access required") || msg.includes("403")) {
        setError("Admin access required — your account is not on the admin list.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) load(true);
    else if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, load, router]);

  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.neonPink} />
          <Text style={styles.loadingText}>Loading admin stats…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed" size={40} color={COLORS.neonPink} />
          <Text style={styles.errorTitle}>Access denied</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace("/(tabs)")}
            testID="admin-error-back"
          >
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) return null;

  // Sparkline geometry
  const sparkMax = Math.max(1, ...stats.daily_signups.map((d) => d.count));
  const sparkW = SCREEN_W - SPACING.lg * 2 - 32;
  const sparkBarWidth = (sparkW - 6 * 6) / 7;
  const sparkH = 60;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.neonPink}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBack}
            hitSlop={10}
            testID="admin-back"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>LOVEASSIST · ADMIN</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.liveDot}>
            <View style={styles.liveDotInner} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Hero KPI */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.heroCard}>
          <LinearGradient
            colors={["#EC4899", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.heroLabel}>Total signups</Text>
          <Text style={styles.heroValue}>{fmtNum(stats.total_users)}</Text>
          <View style={styles.heroFooterRow}>
            <View style={styles.heroChip}>
              <Ionicons name="trending-up" size={11} color="#FFFFFF" />
              <Text style={styles.heroChipText}>+{stats.signups_today} today</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="calendar" size={11} color="#FFFFFF" />
              <Text style={styles.heroChipText}>+{stats.signups_week} / 7d</Text>
            </View>
          </View>
        </Animated.View>

        {/* 4-stat grid */}
        <View style={styles.grid}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(16,185,129,0.18)" }]}>
              <Ionicons name="people" size={18} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{fmtNum(stats.active_sessions)}</Text>
            <Text style={styles.statLabel}>Active sessions</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(236,72,153,0.18)" }]}>
              <Ionicons name="diamond" size={18} color={COLORS.neonPink} />
            </View>
            <Text style={styles.statValue}>{fmtNum(stats.premium_users)}</Text>
            <Text style={styles.statLabel}>Premium users</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(139,92,246,0.18)" }]}>
              <Ionicons name="time" size={18} color={COLORS.neonViolet} />
            </View>
            <Text style={styles.statValue}>{fmtNum(stats.trial_users)}</Text>
            <Text style={styles.statLabel}>On trial</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(245,158,11,0.18)" }]}>
              <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{fmtNum(stats.signups_month)}</Text>
            <Text style={styles.statLabel}>Last 30 days</Text>
          </Animated.View>
        </View>

        {/* Sparkline — last 7 days */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Signups · last 7 days</Text>
            <Text style={styles.sectionMeta}>
              {stats.signups_yesterday > 0 && stats.signups_today >= 0
                ? `${stats.signups_today >= stats.signups_yesterday ? "▲" : "▼"} vs yesterday`
                : ""}
            </Text>
          </View>
          <View style={styles.sparkRow}>
            {stats.daily_signups.map((d, i) => {
              const h = (d.count / sparkMax) * sparkH;
              const isToday = i === stats.daily_signups.length - 1;
              return (
                <View key={d.date} style={styles.sparkCol}>
                  <View style={[styles.sparkBarWrap, { height: sparkH, width: sparkBarWidth }]}>
                    <LinearGradient
                      colors={
                        isToday
                          ? ["#EC4899", "#7C3AED"]
                          : ["rgba(139,92,246,0.55)", "rgba(139,92,246,0.20)"]
                      }
                      style={[
                        styles.sparkBar,
                        { height: Math.max(2, h), width: sparkBarWidth },
                      ]}
                    />
                  </View>
                  <Text style={[styles.sparkLabel, isToday && { color: COLORS.neonPink }]}>
                    {d.date.slice(5).replace("-", "/")}
                  </Text>
                  <Text style={[styles.sparkCount, isToday && styles.sparkCountActive]}>
                    {d.count}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Login methods */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>Login methods</Text>
          <View style={styles.methodRow}>
            <View style={styles.methodCard}>
              <View style={[styles.methodIcon, { backgroundColor: "#FFFFFF" }]}>
                <Ionicons name="logo-google" size={16} color="#0A0A0F" />
              </View>
              <Text style={styles.methodValue}>{stats.login_methods.google}</Text>
              <Text style={styles.methodLabel}>Google</Text>
            </View>
            <View style={styles.methodCard}>
              <View style={[styles.methodIcon, { backgroundColor: "#0A0A0F", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }]}>
                <Ionicons name="logo-apple" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.methodValue}>{stats.login_methods.apple}</Text>
              <Text style={styles.methodLabel}>Apple</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent signups */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent signups</Text>
          {stats.recent_signups.length === 0 ? (
            <Text style={styles.emptyText}>No signups yet.</Text>
          ) : (
            stats.recent_signups.map((u, i) => (
              <View key={`${u.email || i}`} style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {u.name || u.email || "Anonymous"}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {u.email || "no email"}
                  </Text>
                </View>
                <View style={styles.userMetaCol}>
                  <Text style={styles.userTime}>{timeAgo(u.created_at)}</Text>
                  {u.subscription_status === "premium" || u.subscription_status === "active" ? (
                    <View style={[styles.statusPill, { backgroundColor: COLORS.neonPink }]}>
                      <Text style={styles.statusPillText}>PREMIUM</Text>
                    </View>
                  ) : u.subscription_status === "trial" ? (
                    <View style={[styles.statusPill, { backgroundColor: "rgba(139,92,246,0.30)" }]}>
                      <Text style={[styles.statusPillText, { color: "#FFFFFF" }]}>TRIAL</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusPill, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
                      <Text style={[styles.statusPillText, { color: "rgba(255,255,255,0.7)" }]}>FREE</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </Animated.View>

        <Text style={styles.generatedAt}>Updated {timeAgo(stats.generated_at)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.lg },
  loadingText: {
    marginTop: 14, color: COLORS.textSecondary, fontFamily: FONTS.bodyMedium, fontSize: 13,
  },
  errorTitle: {
    marginTop: 16, color: "#FFFFFF", fontFamily: FONTS.heading, fontSize: 22,
  },
  errorBody: {
    marginTop: 8, color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 13,
    textAlign: "center", maxWidth: 280,
  },
  backBtn: {
    marginTop: 22, paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.neonPink,
  },
  backBtnText: { color: "#0A0A0F", fontFamily: FONTS.bodyHeavy, fontSize: 14 },

  headerRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: SPACING.lg,
  },
  headerBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  eyebrow: {
    fontFamily: FONTS.bodyHeavy, fontSize: 10, color: COLORS.neonPink, letterSpacing: 2,
  },
  title: {
    fontFamily: "Inter_900Black", fontSize: 28, color: "#FFFFFF",
    letterSpacing: -1, marginTop: 2,
  },
  liveDot: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 999, backgroundColor: "rgba(16,185,129,0.18)",
    borderWidth: 1, borderColor: "rgba(16,185,129,0.40)",
  },
  liveDotInner: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981",
  },
  liveText: {
    fontFamily: FONTS.bodyHeavy, fontSize: 9, color: "#10B981", letterSpacing: 1.2,
  },

  // Hero
  heroCard: {
    borderRadius: 24, padding: 22, overflow: "hidden",
    shadowColor: "#EC4899", shadowOpacity: 0.5,
    shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  heroLabel: { fontFamily: FONTS.bodyHeavy, fontSize: 11, color: "rgba(255,255,255,0.85)", letterSpacing: 2 },
  heroValue: {
    fontFamily: "Inter_900Black", fontSize: 56, color: "#FFFFFF",
    letterSpacing: -2, marginTop: 4, lineHeight: 60,
  },
  heroFooterRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  heroChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  heroChipText: { fontFamily: FONTS.bodyHeavy, fontSize: 10, color: "#FFFFFF" },

  // Stat grid
  grid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: SPACING.md,
  },
  statCard: {
    width: "48%", flexGrow: 1,
    padding: 14, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  statValue: {
    fontFamily: "Inter_900Black", fontSize: 24, color: "#FFFFFF", letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.textSecondary, marginTop: 2,
  },

  // Section blocks
  section: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: "#FFFFFF" },
  sectionMeta: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary },

  // Sparkline
  sparkRow: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-between", marginTop: 16,
  },
  sparkCol: { alignItems: "center", gap: 6 },
  sparkBarWrap: { justifyContent: "flex-end" },
  sparkBar: { borderRadius: 4 },
  sparkLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.textSecondary },
  sparkCount: { fontFamily: FONTS.bodyHeavy, fontSize: 11, color: "#FFFFFF" },
  sparkCountActive: { color: COLORS.neonPink },

  // Login methods
  methodRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  methodCard: {
    flex: 1, padding: 14, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-start",
  },
  methodIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  methodValue: {
    fontFamily: "Inter_900Black", fontSize: 22, color: "#FFFFFF", letterSpacing: -0.6,
  },
  methodLabel: {
    fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.textSecondary, marginTop: 2,
  },

  // Recent signups
  userRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.neonViolet,
    alignItems: "center", justifyContent: "center",
  },
  userAvatarText: { color: "#FFFFFF", fontFamily: FONTS.bodyHeavy, fontSize: 14 },
  userName: { fontFamily: FONTS.bodyBold, fontSize: 13, color: "#FFFFFF" },
  userEmail: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  userMetaCol: { alignItems: "flex-end", gap: 4 },
  userTime: { fontFamily: FONTS.bodyMedium, fontSize: 10, color: COLORS.textSecondary },
  statusPill: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  statusPillText: { fontFamily: FONTS.bodyHeavy, fontSize: 8, color: "#0A0A0F", letterSpacing: 1 },

  emptyText: {
    fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary,
    textAlign: "center", paddingVertical: 18,
  },
  generatedAt: {
    fontFamily: FONTS.body, fontSize: 10, color: "rgba(255,255,255,0.35)",
    textAlign: "center", marginTop: SPACING.lg,
  },
});
