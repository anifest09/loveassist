// LoveAssist AI – API client
import { storage } from "@/src/utils/storage";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = "loveassist_session_token";

export async function getToken(): Promise<string | null> {
  return await storage.secureGet<string>(TOKEN_KEY, "");
}

export async function setToken(t: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, t);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (data?.detail && typeof data.detail === "object") {
      message = data.detail.message ?? message;
      code = data.detail.code;
    }
    const err: any = new Error(message);
    err.status = res.status;
    if (code) err.code = code;
    throw err;
  }
  return data as T;
}

export const api = {
  // Auth
  googleSession: (session_token: string) =>
    request<{ session_token: string; user: any }>(
      "/auth/google/session",
      { method: "POST", body: JSON.stringify({ session_token }) },
      false,
    ),
  devLogin: (name: string, email: string) =>
    request<{ session_token: string; user: any }>(
      "/auth/dev-login",
      { method: "POST", body: JSON.stringify({ name, email }) },
      false,
    ),
  appleSignIn: (params: {
    identity_token: string;
    nonce?: string | null;
    full_name?: { givenName?: string | null; familyName?: string | null } | null;
    email?: string | null;
  }) =>
    request<{ session_token: string; user: any }>(
      "/auth/apple",
      { method: "POST", body: JSON.stringify(params) },
      false,
    ),
  me: () =>
    request<{ user: any; subscription: any }>("/auth/me", { method: "GET" }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  deleteAccount: () =>
    request<{ ok: boolean }>("/auth/delete-account", { method: "DELETE" }),
  adminStats: () =>
    request<{
      total_users: number;
      signups_today: number;
      signups_yesterday: number;
      signups_week: number;
      signups_month: number;
      active_sessions: number;
      premium_users: number;
      trial_users: number;
      login_methods: { google: number; apple: number };
      recent_signups: Array<{
        email?: string;
        name?: string;
        picture?: string;
        created_at?: string;
        subscription_status?: string;
      }>;
      daily_signups: Array<{ date: string; count: number }>;
      generated_at: string;
    }>("/admin/stats", { method: "GET" }),

  // Subscription
  subStatus: () =>
    request<{ subscription: any }>("/subscription/status", { method: "GET" }),
  startTrial: () =>
    request<{ subscription: any }>("/subscription/start-trial", {
      method: "POST",
    }),
  upgrade: () =>
    request<{ subscription: any; message: string }>("/subscription/upgrade", {
      method: "POST",
    }),

  // AI
  suggestions: (body: {
    context: string;
    relationship: string;
    mode: string;
    language: string;
    count?: number;
  }) =>
    request<{ suggestions: string[] }>("/ai/suggestions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  firstMessage: (body: {
    about_person: string;
    context?: string;
    mode: string;
    language: string;
    count?: number;
  }) =>
    request<{ suggestions: string[] }>("/ai/first-message", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  screenshot: (body: {
    image_base64: string;
    mode: string;
    language: string;
    count?: number;
    extra_context?: string;
  }) =>
    request<{ suggestions: string[] }>("/ai/screenshot", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  firstMessageFromBio: (body: {
    image_base64: string;
    mode: string;
    language: string;
    count?: number;
    extra_context?: string;
  }) =>
    request<{ suggestions: string[] }>("/ai/first-message-from-bio", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // History
  saveHistory: (body: {
    kind: string;
    prompt_summary: string;
    suggestions: string[];
    mode: string;
    language: string;
  }) =>
    request<{ item: any }>("/history", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listHistory: () =>
    request<{ items: any[] }>("/history", { method: "GET" }),
  deleteHistory: (id: string) =>
    request<{ deleted: number }>(`/history/${id}`, { method: "DELETE" }),

  // Settings
  updateSettings: (body: {
    preferred_language?: string;
    default_mode?: string;
  }) =>
    request<{ user: any }>("/me/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Translate
  translate: (body: {
    texts: string[];
    target_language: string;
    source_language?: string;
    preserve_tone?: boolean;
  }) =>
    request<{ translations: string[]; target_language: string }>(
      "/ai/translate",
      { method: "POST", body: JSON.stringify(body) },
    ),

  // Payments
  pricing: () =>
    request<{
      currency: string;
      price: number;
      plan: string;
      trial_days: number;
      gateways: { razorpay: boolean; paypal: boolean; any_simulated: boolean };
    }>("/payments/pricing", { method: "GET" }, false),
  razorpayCreate: (body: {
    return_url?: string;
    cancel_url?: string;
  } = {}) =>
    request<{
      simulated: boolean;
      payment_link_id: string;
      short_url: string;
      amount_usd: number;
      message?: string;
    }>("/payments/razorpay/create-link", {
      method: "POST",
      body: JSON.stringify({ plan: "monthly_premium", ...body }),
    }),
  razorpayVerify: (payment_link_id: string) =>
    request<{
      ok: boolean;
      simulated?: boolean;
      status?: string;
      subscription: any;
    }>(`/payments/razorpay/verify/${payment_link_id}`, { method: "POST" }),
  paypalCreate: (body: {
    return_url?: string;
    cancel_url?: string;
  } = {}) =>
    request<{
      simulated: boolean;
      order_id: string;
      approve_url: string;
      amount_usd: number;
      message?: string;
    }>("/payments/paypal/create-order", {
      method: "POST",
      body: JSON.stringify({ plan: "monthly_premium", ...body }),
    }),
  paypalCapture: (order_id: string) =>
    request<{
      ok: boolean;
      simulated?: boolean;
      status?: string;
      subscription: any;
    }>("/payments/paypal/capture", {
      method: "POST",
      body: JSON.stringify({ order_id }),
    }),

  // ============ Admin ============
  adminStats: () =>
    request<{
      total_users: number;
      signups_today: number;
      signups_yesterday: number;
      signups_week: number;
      signups_month: number;
      active_sessions: number;
      premium_users: number;
      trial_users: number;
      logins_today: number;
      logins_week: number;
      logins_total: number;
      login_methods: { google: number; apple: number };
      recent_signups: Array<{
        email?: string;
        name?: string;
        created_at?: string;
        google_sub?: string;
        apple_sub?: string;
      }>;
      daily_signups: Array<{ date: string; count: number }>;
      daily_logins: Array<{ date: string; count: number }>;
      generated_at: string;
    }>("/admin/stats"),
};
