import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth-context";
import { COLORS } from "@/src/theme";

export default function Index() {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return (
    <View style={styles.container} testID="auth-gate-loading">
      <ActivityIndicator color={COLORS.terracotta} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
    alignItems: "center",
    justifyContent: "center",
  },
});
