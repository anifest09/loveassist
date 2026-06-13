
New Chat
⌘
K

Slides

Websites

Docs

Deep Research

Sheets

Agent Swarm

Kimi Code

Kimi Claw

Remove demo mode button
Fixing AI Endpoint Bug
修复字符串错误
FastAPI Security Hardening
make it proper

Get App

Remove demo mode button

https://github.com/anifest09/loveassist.git.remove demo mode from this app

Copy

Share

Remove Demo Mode from GitHub App by Analyzing Repository

Let me start by examining the repository to understand its structure and locate the demo mode implementation.

Browse
https://github.com/anifest09/loveassist.git


Think

Let me clone the repository and explore its structure to find the demo mode implementation.

Failed to execute Terminal

Output stopped




https://github.com/anifest09/loveassist.git.remove demo mode button from this app

Copy

Share

Clone repository, locate demo mode button, and remove it

Let me clone the repository locally to examine the code and find the demo mode button.

Failed to execute Terminal


Think

Let me try a shallow clone to speed things up.

Execute Terminal
Shallow clone loveassist repository


Think


Execute Terminal
Check git status of cloned repo


Delete empty repo and retry clone or download ZIP from GitHub


Failed to execute Terminal


Search GitHub repo for demo mode files

Let me search for the demo mode button directly in the GitHub repository using the browser.

Browse
https://github.com/search?q=repo%3Aanifest09%2Floveassist%20demo&type=code


Search for demo mode button in frontend directory

GitHub code search requires authentication. Let me browse the frontend directory directly on GitHub to find the demo mode button.

Browse
https://github.com/anifest09/loveassist/tree/main/frontend


Explore Expo Router app for demo mode button

This is an Expo React Native project. Let me clone it properly and explore the code structure.

Failed to execute Terminal


Troubleshooting Git Clone Timeout via API, Tarball, and Curl

Git clone keeps timing out. Let me explore the source code directly through GitHub's web interface.

Browse
https://github.com/anifest09/loveassist/tree/main/frontend/src


Locate Demo Mode Button in Expo Router App

Let me explore the app directory (Expo Router pages) and components to find the demo mode button.

Browse
https://github.com/anifest09/loveassist/tree/main/frontend/app


Locate Demo Mode Button in Login Screen

Let me check the login screen first — that's typically where demo mode buttons are found.

Browse
https://github.com/anifest09/loveassist/blob/main/frontend/app/login.tsx


Locate Demo Sign-In Button in login.tsx Using signInDev

I can see references to a "dev" sign-in mode. Let me scroll down to find the demo mode button in the UI.

Scroll down webpage


Find Demo Button in JSX

I found the handleDev function. Let me continue scrolling to find the demo button in the JSX.

Scroll down webpage


Download Modal File with Curl and Remove Demo Buttons

I found the demo mode button and all related code. Let me also check the auth-context for the signInDev function, then download and modify the files.

Browse
https://raw.githubusercontent.com/anifest09/loveassist/main/frontend/src/auth-context.tsx


Check api.ts for devLogin, download files, edit


Browse
https://raw.githubusercontent.com/anifest09/loveassist/main/frontend/src/api.ts


Remove dev login functions from auth context and API

Now I have a complete picture of all the demo mode code. Let me download and modify the three affected files.

Failed to execute Terminal


Download file via Python requests after curl timeout

Network seems slow. Let me use Python to download the files.

Execute Python code


Handling Python Environment Timeout with Explicit Timeout Setting


Execute Python code


Create updated auth-context.tsx and api.ts files from existing content

Network downloads are blocked. Let me use the file content I already obtained from the browser and create the modified files directly.

Execute Python code


Think

Let me write the modified files directly using the content I already obtained from the browser.

File created


Think

Now let me write the auth-context.tsx with signInDev removed.

File created


Think

Now let me write the api.ts with devLogin removed.

File created


Verify Written Files and Summarize Changes

Let me verify all the modified files are correctly written.

Read
login.tsx


Read
auth-context.tsx


Read
api.ts


Think

I see signInDev is still present in auth-context.tsx. Let me check the full file and fix it.

Read
auth-context.tsx


Think

The file wasn't properly overwritten. Let me fix it with targeted edits to remove all signInDev references.

Edit
auth-context.tsx


Think


Edit
auth-context.tsx


Think


Failed to edit file


Think


Edit
auth-context.tsx


Think

Let me verify the auth-context.tsx is now clean.

Read
auth-context.tsx


Think

auth-context.tsx is now clean. Let me verify login.tsx has no remaining demo references.

Execute Terminal
Check for remaining demo references


Think

The login.tsx still has demo code too. Let me fix it with targeted edits.

Edit
login.tsx


Think


Edit
login.tsx


Think


Read
login.tsx


Think


Edit
login.tsx


Think

Now let me find and remove the "Try Demo" ghost button.

Read
login.tsx


Think


Edit
login.tsx


Think

Now let me fix the Apple Sign-In modal — remove the "Continue with Demo" button and update the text.

Read
login.tsx


Think


Edit
login.tsx


Think


Edit
login.tsx


Think

Now let me clean up the unused styles (ghostBtn, ghostBtnText, modalSecondaryBtn, modalSecondaryText).

Read
login.tsx


Think


Read
login.tsx


Think


Read
login.tsx


Think


Edit
login.tsx


Think


Edit
login.tsx


Think

Let me do a final verification of all three files.

Execute Terminal
Final verification of all files


Think

All demo mode code has been successfully removed. Here's a summary of the changes made to 3 files:
Changes Summary

Table


File	Changes
frontend/app/login.tsx	Removed the "Try Demo" ghost button, removed handleDev function, removed signInDev from auth import, removed "dev" from busy state type, removed "Continue with Demo" button from Apple modal, updated modal text, cleaned up unused styles (ghostBtn, ghostBtnText, modalSecondaryBtn, modalSecondaryText)
frontend/src/auth-context.tsx	Removed signInDev from AuthContextType, removed signInDev callback function, removed from value memo and dependency array
frontend/src/api.ts	Removed devLogin endpoint from the API client
The login screen now only shows Google and Apple sign-in options. The Apple Sign-In modal on non-iOS devices now directs users to "Continue with Google" instead of offering a demo mode fallback.

All files
View or download files






Task completed



Trial credits used up
Upgrade
K2.6 Agent


auth-context.tsx

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
