import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { COLORS, RADIUS, SPACING, MODE_META } from "@/src/theme";

type HistoryItem = {
  id: string;
  kind: string;
  prompt_summary: string;
  suggestions: string[];
  mode: "normal" | "flirty" | "exclusive";
  language: string;
  created_at: string;
};

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const KIND_LABEL: Record<string, string> = {
  reply: "Reply Ideas",
  "first-message": "First Message",
  screenshot: "Screenshot Reply",
};

export default function HistoryTab() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const data = await api.listHistory();
      setItems(data.items as HistoryItem[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const remove = async (id: string) => {
    setItems((arr) => (arr ? arr.filter((i) => i.id !== id) : arr));
    try {
      await api.deleteHistory(id);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your recent AI suggestions</Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={COLORS.terracotta} />
        </View>
      ) : items && items.length === 0 ? (
        <View style={styles.empty} testID="history-empty">
          <Ionicons name="time-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>
            Generated suggestions will be saved here for quick access.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.terracotta}
            />
          }
        >
          {items?.map((it) => {
            const meta = MODE_META[it.mode];
            const isOpen = expanded[it.id];
            return (
              <View key={it.id} style={styles.card} testID={`history-item-${it.id}`}>
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardKind}>
                      {KIND_LABEL[it.kind] || it.kind}
                    </Text>
                    <Text style={styles.cardSummary} numberOfLines={2}>
                      {it.prompt_summary || "—"}
                    </Text>
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.modeChip,
                          it.mode === "exclusive" && styles.modeChipExclusive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeChipText,
                            it.mode === "exclusive" && {
                              color: COLORS.textInverse,
                            },
                          ]}
                        >
                          {meta.emoji} {meta.label}
                        </Text>
                      </View>
                      <Text style={styles.time}>{timeAgo(it.created_at)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => remove(it.id)}
                    style={styles.trashBtn}
                    testID={`history-delete-${it.id}`}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setExpanded((e) => ({ ...e, [it.id]: !isOpen }))
                  }
                  style={styles.expandBtn}
                  testID={`history-toggle-${it.id}`}
                >
                  <Text style={styles.expandText}>
                    {isOpen
                      ? "Hide suggestions"
                      : `Show ${it.suggestions.length} suggestion${
                          it.suggestions.length === 1 ? "" : "s"
                        }`}
                  </Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={COLORS.terracotta}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ marginTop: SPACING.sm, gap: SPACING.sm }}>
                    {it.suggestions.map((s, i) => (
                      <View key={i} style={styles.sug}>
                        <Text style={styles.sugText}>{s}</Text>
                        <TouchableOpacity
                          onPress={() => Clipboard.setStringAsync(s)}
                          style={styles.sugCopy}
                          hitSlop={6}
                          testID={`history-copy-${it.id}-${i}`}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={14}
                            color={COLORS.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  title: { fontSize: 22, fontWeight: "600", color: COLORS.textPrimary },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    marginBottom: SPACING.md,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  cardKind: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.terracotta,
    letterSpacing: 1.5,
  },
  cardSummary: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  metaRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  modeChip: {
    backgroundColor: COLORS.bgBase,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  modeChipExclusive: {
    backgroundColor: COLORS.bgPremium,
    borderColor: COLORS.bgPremium,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  time: { fontSize: 11, color: COLORS.textMuted },
  trashBtn: {
    padding: 6,
  },
  expandBtn: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expandText: {
    fontSize: 12,
    color: COLORS.terracotta,
    fontWeight: "700",
  },
  sug: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    backgroundColor: COLORS.bgBase,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
  },
  sugText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 19 },
  sugCopy: { padding: 4 },
});
