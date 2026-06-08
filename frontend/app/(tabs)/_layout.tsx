import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, StyleSheet, Platform } from "react-native";

import { COLORS, FONTS } from "@/src/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.rose,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.bgBase,
          borderTopColor: COLORS.sandBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 60 + Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.bodySemi,
          fontSize: 10,
          letterSpacing: 0.4,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "sparkles" : "sparkles-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "time" : "time-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: "Premium",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "diamond" : "diamond-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person-circle" : "person-circle-outline"} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={focused ? 22 : 20} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  dot: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? -6 : -7,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
