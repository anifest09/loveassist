// LoveAssist AI – shared theme constants (Organic & Earthy)
export const COLORS = {
  bgBase: "#FDFBF7",
  bgSurface: "#F5F3EC",
  bgPremium: "#2C362B",
  bgPremiumSoft: "#3A4639",
  textPrimary: "#2C2C2A",
  textSecondary: "#6B6B66",
  textMuted: "#8F8E87",
  textInverse: "#FDFBF7",
  terracotta: "#E06D53",
  terracottaDark: "#C95F47",
  rose: "#D94F4F",
  sandBorder: "#E5E1D8",
  sandBorderDark: "#D6D0C2",
  gold: "#D4A65E",
};

export const FONTS = {
  heading: "System", // expo default; visually similar weight to Outfit
  body: "System",
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const MODE_META: Record<
  "normal" | "flirty" | "exclusive",
  { label: string; emoji: string; color: string; description: string }
> = {
  normal: {
    label: "Normal",
    emoji: "😊",
    color: COLORS.bgSurface,
    description: "Friendly & natural",
  },
  flirty: {
    label: "Flirty",
    emoji: "😉",
    color: "#F4D3C8",
    description: "Playful & romantic",
  },
  exclusive: {
    label: "Exclusive",
    emoji: "🔥",
    color: "#2C362B",
    description: "Premium voice",
  },
};

export const LANGUAGES: { code: string; name: string; native: string }[] = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "pt", name: "Portuguese", native: "Português" },
];
