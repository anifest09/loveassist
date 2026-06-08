import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../theme";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: any;
  testID?: string;
};

export const Screen: React.FC<Props> = ({
  children,
  title,
  subtitle,
  onBack,
  rightSlot,
  scroll = true,
  contentStyle,
  testID,
}) => {
  const Body = (
    <View style={[styles.body, contentStyle]} testID={testID}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {(title || onBack || rightSlot) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backBtn}
                testID="screen-back-button"
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {rightSlot}
        </View>
      )}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {Body}
        </ScrollView>
      ) : (
        Body
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === "ios" ? SPACING.sm : SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgBase,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: SPACING.lg,
  },
});
