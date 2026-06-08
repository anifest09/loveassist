import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, RADIUS, SPACING, MODE_META } from "../theme";

type Mode = "normal" | "flirty" | "exclusive";

type Props = {
  value: Mode;
  onChange: (m: Mode) => void;
  isPremium: boolean;
  onLockedPress?: () => void;
};

export const ModeSelector: React.FC<Props> = ({
  value,
  onChange,
  isPremium,
  onLockedPress,
}) => {
  const modes: Mode[] = ["normal", "flirty", "exclusive"];
  return (
    <View style={styles.row}>
      {modes.map((m) => {
        const meta = MODE_META[m];
        const isExclusive = m === "exclusive";
        const locked = isExclusive && !isPremium;
        const selected = value === m;
        return (
          <TouchableOpacity
            key={m}
            testID={`mode-chip-${m}`}
            activeOpacity={0.85}
            onPress={() => {
              if (locked) {
                onLockedPress?.();
                return;
              }
              onChange(m);
            }}
            style={[
              styles.chip,
              isExclusive && styles.chipExclusive,
              selected && !isExclusive && styles.chipSelected,
              selected && isExclusive && styles.chipExclusiveSelected,
            ]}
          >
            <Text
              style={[
                styles.emoji,
                isExclusive && { color: COLORS.textInverse },
              ]}
            >
              {meta.emoji}
            </Text>
            <Text
              style={[
                styles.label,
                isExclusive && { color: COLORS.textInverse },
                selected && !isExclusive && { color: COLORS.textInverse },
              ]}
            >
              {meta.label}
            </Text>
            {locked && (
              <View style={styles.lockBadge}>
                <Text style={styles.lockText}>PRO</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    backgroundColor: COLORS.bgSurface,
    minHeight: 48,
    position: "relative",
  },
  chipSelected: {
    backgroundColor: COLORS.terracotta,
    borderColor: COLORS.terracotta,
  },
  chipExclusive: {
    backgroundColor: COLORS.bgPremium,
    borderColor: COLORS.bgPremium,
  },
  chipExclusiveSelected: {
    backgroundColor: COLORS.bgPremium,
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  lockBadge: {
    position: "absolute",
    top: -6,
    right: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2C2C2A",
    letterSpacing: 0.5,
  },
});
