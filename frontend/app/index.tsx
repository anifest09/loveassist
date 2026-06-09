import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth-context";
import { storage } from "@/src/utils/storage";
import { COLORS } from "@/src/theme";

const ONBOARDING_KEY = "loveassist_seen_onboarding";

export default function Index() {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    (async () => {
      const seen = await storage.getItem<boolean>(ONBOARDING_KEY, false);
      if (!user) {
        // Show onboarding BEFORE login for new users
        if (!seen) router.replace("/onboarding");
        else router.replace("/login");
        return;
      }
      // Logged in users go straight to app
      router.replace("/(tabs)");
    })();
  }, [loading, user, router]);

  return (
    <View style={styles.container} testID="auth-gate-loading">
      <ActivityIndicator color={COLORS.neonPink} />
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
