// LoveAssist AI – "RIZZ" Dark Theme
// Vibe: Pitch-black backgrounds · violet glow · neon pink accents · heavy bold Inter.
// NOTE: Legacy color keys (rose, blush, gold, etc.) are preserved but remapped to dark
// RIZZ values so older screens auto-inherit the new aesthetic without breaking.

export const COLORS = {
  // Surfaces
  bgBase: "#0A0A0F",        // deep black
  bgSurface: "#14141F",     // dark glass card
  bgSurfaceAlt: "#1C1C2A",  // raised surface
  bgInk: "#000000",         // pure black (CTAs etc.)
  bgInkSoft: "#0A0A0F",
  bgPremium: "#0A0A0F",
  bgPremiumSoft: "#1A1428",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  textInverse: "#FFFFFF",
  textInverseSoft: "rgba(255,255,255,0.78)",

  // Accents (legacy "rose" now violet glow)
  rose: "#A78BFA",          // violet glow (primary)
  roseDeep: "#7C3AED",
  roseSoft: "#C4B5FD",
  blush: "#1F1A33",         // dark violet tinted surface
  terracotta: "#EC4899",    // neon pink
  copper: "#F472B6",

  // Legacy "gold/premium" now neon pink/violet
  gold: "#EC4899",
  goldBright: "#F472B6",
  goldDeep: "#DB2777",

  // Lines (subtle violet hairlines on black)
  sandBorder: "rgba(139,92,246,0.16)",
  sandBorderDark: "rgba(139,92,246,0.32)",
  inkBorder: "rgba(255,255,255,0.10)",

  // System
  success: "#10B981",
  danger: "#F87171",

  // RIZZ-specific extras
  neonViolet: "#8B5CF6",
  neonPink: "#EC4899",
  neonGlow: "rgba(139,92,246,0.55)",
  glassDark: "rgba(20,20,31,0.78)",
  glassLight: "rgba(255,255,255,0.06)",

  // Pastel paywall sheet
  pastelPink: "#FBCFE8",
  pastelBlue: "#DBEAFE",
  pastelLavender: "#E9D5FF",
};

// Gradient stops
export const GRADIENTS = {
  hero: ["#0A0A0F", "#1F1442", "#3B1A6B"] as const,           // black → deep violet
  rose: ["#8B5CF6", "#EC4899"] as const,                       // violet → neon pink
  roseDeep: ["#7C3AED", "#DB2777"] as const,
  gold: ["#F472B6", "#A78BFA"] as const,
  premium: ["#0A0A0F", "#1A1428", "#2D1B4E"] as const,
  cream: ["#0A0A0F", "#14141F"] as const,
  cardCream: ["#14141F", "#1C1C2A"] as const,
  cardRose: ["#2D1B4E", "#14141F"] as const,
  pastelSheet: ["#FBCFE8", "#E9D5FF", "#DBEAFE"] as const,    // paywall sheet
  glowPurple: ["rgba(139,92,246,0.4)", "transparent"] as const,
  glowPink: ["rgba(236,72,153,0.35)", "transparent"] as const,
};

// Fonts — Inter only (heavy bold), no serif.
// "display" maps to Inter ExtraBold so legacy <Text style={{fontFamily: FONTS.display}}/>
// renders heavy bold instead of Playfair serif.
export const FONTS = {
  display: "Inter_800ExtraBold",
  displayMedium: "Inter_700Bold",
  displayItalic: "Inter_700Bold",   // legacy alias — no italic in RIZZ aesthetic
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyHeavy: "Inter_800ExtraBold",
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  xxl: 32,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const SHADOWS = {
  card: {
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  hero: {
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.35,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  soft: {
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pinkGlow: {
    shadowColor: "#EC4899",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

export const MODE_META: Record<
  "normal" | "flirty" | "exclusive",
  { label: string; emoji: string; description: string }
> = {
  normal: {
    label: "Normal",
    emoji: "✨",
    description: "Chill & natural",
  },
  flirty: {
    label: "Flirty",
    emoji: "💋",
    description: "Playful & bold",
  },
  exclusive: {
    label: "Exclusive",
    emoji: "🔥",
    description: "Rizz-tier voice",
  },
};

export const LANGUAGES: { code: string; name: string; native: string; flag: string }[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", flag: "🇹🇼" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "tl", name: "Filipino", native: "Filipino", flag: "🇵🇭" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
];
