// Dumbys Design System — Identity Refresh 2026
// Dark mode: "Nuit Electrique" | Light mode: Clean & Vibrant

// ─── Color Palette ───────────────────────────────────────────────
export const PALETTE = {
  // Brand Colors (shared across modes)
  fuchsia: "#FF2D7D",       // Fuchsia Defi — energy, action
  sarcelle: "#3FD0C9",      // Sarcelle Dumbys — modernity, freshness
  jaune: "#FDB813",         // Jaune Sourire — joy, success

  // Dark Mode: Nuit Electrique
  charbon: "#121212",       // Fond principal
  ardoise: "#1F1F1F",       // Surfaces (cards, chats)
  plomb: "#2C2C2C",         // Dividers, structure
  blancCasse: "#F5F5F5",    // Texte principal
  grisSouris: "#A0A0A0",    // Texte secondaire
  grisCiment: "#606060",    // Texte desactive

  // Light Mode
  white: "#FFFFFF",
  offWhite: "#F8F8FA",
} as const;

// ─── Dark Mode Colors (default) ─────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg: PALETTE.charbon,
  surface: PALETTE.ardoise,
  elevated: PALETTE.plomb,
  card: PALETTE.ardoise,

  // Brand
  brand: PALETTE.fuchsia,
  brandLight: "#FF5A9E",
  brandDark: "#D4135F",
  accent: PALETTE.sarcelle,
  accentDark: "#2BB5AE",

  // Semantic
  success: "#10B981",
  warning: PALETTE.jaune,
  error: "#F43F5E",
  info: "#3B82F6",

  // Text
  textPrimary: PALETTE.blancCasse,
  textSecondary: PALETTE.grisSouris,
  textTertiary: PALETTE.grisCiment,
  textMuted: "#4A4A4A",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.10)",
  borderBrand: "rgba(255,45,125,0.3)",

  // Overlays
  overlay: "rgba(0,0,0,0.65)",
  overlayLight: "rgba(0,0,0,0.4)",
  glass: "rgba(255,255,255,0.04)",
  glassLight: "rgba(255,255,255,0.07)",
} as const;

// ─── Light Mode Colors ──────────────────────────────────────────
export const COLORS_LIGHT = {
  bg: PALETTE.white,
  surface: PALETTE.offWhite,
  elevated: "#EFEFEF",
  card: PALETTE.white,

  brand: PALETTE.fuchsia,
  brandLight: "#FF5A9E",
  brandDark: "#D4135F",
  accent: PALETTE.sarcelle,
  accentDark: "#2BB5AE",

  success: "#10B981",
  warning: PALETTE.jaune,
  error: "#F43F5E",
  info: "#3B82F6",

  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  textTertiary: "#999999",
  textMuted: "#BBBBBB",

  border: "rgba(0,0,0,0.06)",
  borderLight: "rgba(0,0,0,0.10)",
  borderBrand: "rgba(255,45,125,0.15)",

  overlay: "rgba(0,0,0,0.3)",
  overlayLight: "rgba(0,0,0,0.15)",
  glass: "rgba(0,0,0,0.02)",
  glassLight: "rgba(0,0,0,0.04)",
} as const;

// ─── Gradients ──────────────────────────────────────────────────
export const GRADIENTS = {
  brand: [PALETTE.fuchsia, "#D4135F"] as const,
  brandAccent: [PALETTE.fuchsia, PALETTE.sarcelle] as const,
  accent: [PALETTE.sarcelle, "#06B6D4"] as const,
  sunset: ["#F43F5E", "#FB923C"] as const,
  gold: [PALETTE.jaune, "#F59E0B"] as const,
  overlay: ["transparent", "rgba(0,0,0,0.85)"] as const,
  cardShine: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0)"] as const,
  // Phase gradients
  uploadPhase: [PALETTE.fuchsia, "#D4135F"] as const,
  votePhase: [PALETTE.sarcelle, "#2BB5AE"] as const,
  podiumPhase: [PALETTE.jaune, "#D97706"] as const,
  // Mascotte gradient (D-Challengeur)
  mascotte: [PALETTE.fuchsia, PALETTE.jaune] as const,
} as const;

// ─── Spacing & Layout ───────────────────────────────────────────
export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 28,
  "3xl": 32,
  full: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 6,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

// ─── Typography ─────────────────────────────────────────────────
export const FONT_FAMILY = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  extrabold: "Poppins-ExtraBold",
  black: "Poppins-Black",
} as const;

export const FONT = {
  sizes: {
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 16,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    "4xl": 28,
    "5xl": 34,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
    black: "900" as const,
  },
} as const;

// ─── Reusable Style Patterns ────────────────────────────────────
export const CARD_STYLE = {
  backgroundColor: COLORS.card,
  borderRadius: RADIUS.xl,
  borderWidth: 1,
  borderColor: COLORS.border,
} as const;

export const INPUT_STYLE = {
  backgroundColor: COLORS.glassLight,
  borderWidth: 1,
  borderColor: COLORS.border,
  color: COLORS.textPrimary,
  paddingHorizontal: 18,
  paddingVertical: 15,
  borderRadius: RADIUS.md,
  fontSize: FONT.sizes.lg,
} as const;

export const SECTION_HEADER_STYLE = {
  color: COLORS.textTertiary,
  fontSize: FONT.sizes.xs,
  fontWeight: FONT.weights.bold,
  textTransform: "uppercase" as const,
  letterSpacing: 1.5,
};

export const HEADER_BUTTON_STYLE = {
  width: 40,
  height: 40,
  borderRadius: RADIUS.sm,
  backgroundColor: COLORS.glass,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderWidth: 1,
  borderColor: COLORS.border,
};

// Avatar color palette (deterministic from username hash)
export const AVATAR_COLORS = [
  PALETTE.fuchsia,
  PALETTE.sarcelle,
  PALETTE.jaune,
  "#F43F5E",
  "#10B981",
  "#3B82F6",
  "#EC4899",
  "#06B6D4",
];
