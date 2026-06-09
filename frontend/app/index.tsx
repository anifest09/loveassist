import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth-context";
import { storage } from "@/src/utils/storage";
import { COLORS } from "@/src/theme";
import SplashIntro from "@/src/components/SplashIntro";

const ONBOARDING_KEY = "loveassist_seen_onboarding";

export default function Index() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);

  // Decide destination as soon as auth loads
  useEffect(() => {
    if (loading) return;
    (async () => {
      const seen = await storage.getItem<boolean>(ONBOARDING_KEY, false);
      if (!user) {
        setDestination(seen ? "/login" : "/onboarding");
      } else {
        setDestination("/(tabs)");
      }
    })();
  }, [loading, user]);

  // Route once both splash + destination are ready
  useEffect(() => {
    if (splashDone && destination) {
      router.replace(destination as any);
    }
  }, [splashDone, destination, router]);

  return (
    <View style={styles.container} testID="auth-gate-loading">
      <SplashIntro onDone={() => setSplashDone(true)} />
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
