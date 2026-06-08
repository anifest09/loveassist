import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, FONTS, GRADIENTS, MODE_META } from "../theme";

type Mode = "normal" | "flirty" | "exclusive";

type Props = {
  value: Mode;
  onChange: (m: Mode) => void;
  isPremium: boolean;
  onLockedPress?: () => void;
};

export const ModeSelector: React.FC<Props> = ({ value, onChange, isPremium, onLockedPress }) => {
  const modes: Mode[] = ["normal", "flirty", "exclusive"];
  return (
    <View style={styles.row}>
      {modes.map((m) => {
        const meta = MODE_META[m];
        const isExclusive = m === "exclusive";
        const locked = isExclusive && !isPremium;
        const selected = value === m;
        const onPress = () => { if (locked) { onLockedPress?.(); return; } onChange(m); };
        if (isExclusive) {
          return (
            <TouchableOpacity key={m} testID={`mode-chip-${m}`} activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
              <LinearGradient colors={GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.chip, styles.chipExclusive, selected && styles.chipExclusiveSelected]}>
                <Text style={[styles.emoji, { color: COLORS.textInverse }]}>{meta.emoji}</Text>
                <Text style={[styles.label, { color: COLORS.goldBright, fontFamily: FONTS.bodyBold }]}>{meta.label}</Text>
                {locked && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={8} color={COLORS.textPrimary} />
                    <Text style={styles.lockText}>PRO</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        }
        if (selected) {
          return (
            <TouchableOpacity key={m} testID={`mode-chip-${m}`} activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
              <LinearGradient colors={GRADIENTS.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.chip, styles.chipSelected]}>
                <Text style={styles.emoji}>{meta.emoji}</Text>
                <Text style={[styles.label, { color: COLORS.textInverse }]}>{meta.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={m} testID={`mode-chip-${m}`} activeOpacity={0.85} onPress={onPress} style={[styles.chip, { flex: 1 }]}>
            <Text style={styles.emoji}>{meta.emoji}</Text>
            <Text style={styles.label}>{meta.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: SPACING.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    backgroundColor: COLORS.bgSurface,
    minHeight: 52,
    position: "relative",
  },
  chipSelected: { borderColor: COLORS.rose },
  chipExclusive: {
    borderColor: "rgba(200,165,116,0.4)",
  },
  chipExclusiveSelected: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  emoji: { fontSize: 18 },
  label: {
    fontSize: 13,
    fontFamily: FONTS.bodySemi,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  lockBadge: {
    position: "absolute",
    top: -7,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.goldBright,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockText: {
    fontSize: 8,
    fontFamily: FONTS.bodyHeavy,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
});
