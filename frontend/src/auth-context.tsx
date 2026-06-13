import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, clearToken, getToken, setToken } from "./api";

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  preferred_language?: string;
  default_mode?: string;
};

export type Subscription = {
  status: "none" | "trialing" | "active" | "expired";
  mode: "none" | "simulated" | "stripe";
  trial_end?: string | null;
  premium_until?: string | null;
};

type AuthContextType = {
  loading: boolean;
  user: User | null;
  subscription: Subscription | null;
  signInWithToken: (token: string) => Promise<void>;
  signInGoogleWithSessionId: (sessionId: string) => Promise<void>;
  signInApple: (params: {
    identity_token: string;
    nonce?: string | null;
    full_name?: { givenName?: string | null; familyName?: string | null } | null;
    email?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUserLocal: (patch: Partial<User>) => void;
  isPremium: boolean;
  /** Trial finished and no active subscription — features should hard-lock. */
  isAccessLocked: boolean;
  /** Days remaining in trial (0 if not on trial). */
  trialDaysLeft: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        setSubscription(null);
        return;
      }
      const data = await api.me();
      setUser(data.user);
      setSubscription(data.subscription);
    } catch {
      await clearToken();
      setUser(null);
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signInWithToken = useCallback(
    async (token: string) => {
      await setToken(token);
      await refresh();
    },
    [refresh],
  );

  const signInGoogleWithSessionId = useCallback(
    async (sessionId: string) => {
      const res = await api.googleSession(sessionId);
      await setToken(res.session_token);
      setUser(res.user);
      await refresh();
    },
    [refresh],
  );

  const signInApple = useCallback(
    async (params: {
      identity_token: string;
      nonce?: string | null;
      full_name?: { givenName?: string | null; familyName?: string | null } | null;
      email?: string | null;
    }) => {
      const res = await api.appleSignIn(params);
      await setToken(res.session_token);
      setUser(res.user);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    await clearToken();
    setUser(null);
    setSubscription(null);
  }, []);

  const updateUserLocal = useCallback((patch: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const isPremium =
    subscription?.status === "trialing" || subscription?.status === "active";

  // Trial expired & no active sub — feature wall trigger.
  const isAccessLocked =
    !!subscription &&
    !isPremium &&
    (subscription.status === "expired" || subscription.status === "none");

  // Days remaining in trial (rounded up).
  const trialDaysLeft = useMemo(() => {
    if (subscription?.status !== "trialing" || !subscription.trial_end) return 0;
    const end = new Date(subscription.trial_end).getTime();
    const diff = end - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }, [subscription]);

  const value = useMemo(
    () => ({
      loading,
      user,
      subscription,
      signInWithToken,
      signInGoogleWithSessionId,
      signInApple,
      signOut,
      refresh,
      updateUserLocal,
      isPremium,
      isAccessLocked,
      trialDaysLeft,
    }),
    [
      loading,
      user,
      subscription,
      signInWithToken,
      signInGoogleWithSessionId,
      signInApple,
      signOut,
      refresh,
      updateUserLocal,
      isPremium,
      isAccessLocked,
      trialDaysLeft,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
