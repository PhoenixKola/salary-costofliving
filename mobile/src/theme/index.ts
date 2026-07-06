export const colors = {
  // Base surfaces
  bg: "#07070C",
  bgElevated: "#0E0F17",
  card: "rgba(255,255,255,0.045)",
  cardPressed: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",

  // Text
  text: "#F4F5F7",
  textSecondary: "rgba(244,245,247,0.62)",
  textMuted: "rgba(244,245,247,0.38)",

  // Accent — electric lime, the single brand color
  accent: "#B7F53D",
  accentDim: "rgba(183,245,61,0.14)",
  accentBorder: "rgba(183,245,61,0.28)",
  onAccent: "#0A0F03",

  // Secondary hue for chart contrast (CPI vs wage)
  chartAlt: "#7C9EFF",
  chartAltDim: "rgba(124,158,255,0.14)",

  // Semantic
  positive: "#B7F53D",
  negative: "#FF6B6B",
  negativeDim: "rgba(255,107,107,0.14)",
  warning: "#FFC94D",
  warningDim: "rgba(255,201,77,0.12)",

  // Tab bar
  tabBar: "rgba(14,15,23,0.96)"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999
} as const;

export const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold"
} as const;

export const type = {
  hero: { fontFamily: fonts.extrabold, fontSize: 44, letterSpacing: -1.2, color: colors.text },
  h1: { fontFamily: fonts.extrabold, fontSize: 26, letterSpacing: -0.6, color: colors.text },
  h2: { fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.3, color: colors.text },
  title: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: -0.2, color: colors.text },
  body: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  caption: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  micro: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase" as const, color: colors.textMuted }
} as const;

/** Content bottom padding so scroll views clear the floating tab bar. */
export const TAB_BAR_CLEARANCE = 104;
