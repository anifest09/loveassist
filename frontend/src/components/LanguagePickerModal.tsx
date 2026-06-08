import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONTS, LANGUAGES } from "@/src/theme";

type Props = {
  visible: boolean;
  selected?: string;
  title?: string;
  subtitle?: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function LanguagePickerModal({
  visible,
  selected,
  title = "Choose language",
  subtitle = "Suggestions and translations will use this language",
  onSelect,
  onClose,
}: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.native.toLowerCase().includes(s) ||
        l.code.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} testID="lang-picker-close">
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            placeholder="Search 20 languages..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.code}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const isSel = item.code === selected;
            return (
              <TouchableOpacity
                style={[styles.row, isSel && styles.rowSelected]}
                activeOpacity={0.85}
                onPress={() => {
                  onSelect(item.code);
                  onClose();
                }}
                testID={`lang-row-${item.code}`}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.native}>{item.native}</Text>
                </View>
                {isSel ? (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.rose} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <Text style={styles.empty}>No language matches “{q}”</Text>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: COLORS.bgBase,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.sm,
    maxHeight: "82%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.sandBorder,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  title: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.textPrimary },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInput: { flex: 1, fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  rowSelected: { backgroundColor: COLORS.blush },
  flag: { fontSize: 24 },
  name: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.textPrimary },
  native: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  sep: { height: 1, backgroundColor: "rgba(28,26,20,0.04)" },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 24, fontFamily: FONTS.body },
});
