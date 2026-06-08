// LoveAssist AI – Premium theme system
// Vibe: Warm romantic luxury — cream + rose-gold + ink + champagne gold

export const COLORS = {
  // Surfaces
  bgBase: "#FBF7F2",        // warm cream
  bgSurface: "#F3EBE0",     // soft cream/beige
  bgSurfaceAlt: "#EFE5D6",  // slightly deeper cream
  bgInk: "#16140F",         // luxe near-black
  bgInkSoft: "#22201A",
  bgPremium: "#16140F",     // dark hero base
  bgPremiumSoft: "#2B271F",

  // Text
  textPrimary: "#1C1A14",
  textSecondary: "#6B655B",
  textMuted: "#9A9388",
  textInverse: "#FBF7F2",
  textInverseSoft: "rgba(251,247,242,0.78)",

  // Accents
  rose: "#B14A56",          // deep rose
  roseDeep: "#8A3641",
  roseSoft: "#E8B7AE",
  blush: "#F2D8D0",
  terracotta: "#C9603F",
  copper: "#A45A3C",

  // Premium metals
  gold: "#C8A574",          // champagne gold
  goldBright: "#E0BE85",
  goldDeep: "#9A7B49",

  // Lines
  sandBorder: "#E5DFD2",
  sandBorderDark: "#D4CCB8",
  inkBorder: "rgba(28,26,20,0.10)",

  // System
  success: "#5E7A4D",
  danger: "#C24A4A",
};

// Gradient stops
export const GRADIENTS = {
  hero: ["#1C1A14", "#3A2A24", "#7A463E"] as const, // ink → mocha → rose
  rose: ["#B14A56", "#C9603F"] as const,
  roseDeep: ["#8A3641", "#B14A56"] as const,
  gold: ["#E0BE85", "#9A7B49"] as const,
  premium: ["#1A1812", "#2B271F", "#3A2D22"] as const,
  cream: ["#FBF7F2", "#F3EBE0"] as const,
  cardCream: ["#FFFBF4", "#F3EBE0"] as const,
  cardRose: ["#FCE5DE", "#F4CFC4"] as const,
};

export const FONTS = {
  display: "PlayfairDisplay_700Bold",
  displayMedium: "PlayfairDisplay_600SemiBold",
  displayItalic: "PlayfairDisplay_400Regular_Italic",
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
    shadowColor: "#1C1A14",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  hero: {
    shadowColor: "#1C1A14",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  soft: {
    shadowColor: "#1C1A14",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
};

export const MODE_META: Record<
  "normal" | "flirty" | "exclusive",
  { label: string; emoji: string; description: string }
> = {
  normal: {
    label: "Normal",
    emoji: "✨",
    description: "Warm & natural",
  },
  flirty: {
    label: "Flirty",
    emoji: "💋",
    description: "Playful & romantic",
  },
  exclusive: {
    label: "Exclusive",
    emoji: "🥂",
    description: "Premium voice",
  },
};

export const LANGUAGES: { code: string; name: string; native: string; flag: string }[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
];
