import type { HabitColorKey } from "@habit/shared";

export const lightColors = {
  background: "#FFF7EA",
  surface: "#FFFFFF",
  surfaceMuted: "#D9EEFF",
  textPrimary: "#2A2140",
  textSecondary: "#5C5375",
  primary: "#5B3DF0",
  primaryPressed: "#4628D1",
  primaryText: "#FFFFFF",
  primaryTextAccent: "#4B2ED6",
  accent: "#FFD23F",
  accentBg: "#FFD23F",
  accentBorder: "#B45309",
  accentText: "#2A2140",
  sky: "#4FB3FF",
  success: "#15803D",
  danger: "#C81E1E",
  dangerPressed: "#991B1B",
  dangerText: "#B91C1C",
  dangerSurface: "#FEF2F2",
  border: "#6B8EAE",
  borderStrong: "#5C5375",
} as const;

export const darkColors = {
  background: "#130F1E",
  surface: "#1E1830",
  surfaceMuted: "#2A2242",
  textPrimary: "#F8FAFC",
  textSecondary: "#C4BCD8",
  primary: "#6B4DF5",
  primaryPressed: "#5438D6",
  primaryText: "#FFFFFF",
  primaryTextAccent: "#C4B5FD",
  accent: "#FFD23F",
  accentBg: "#FFD23F",
  accentBorder: "#EAB308",
  accentText: "#2A2140",
  sky: "#4FB3FF",
  success: "#4ADE80",
  danger: "#DC2626",
  dangerPressed: "#991B1B",
  dangerText: "#FCA5A5",
  dangerSurface: "#3B1822",
  border: "#6C618E",
  borderStrong: "#9489B8",
} as const;

export type ThemeColors = {
  readonly [K in keyof typeof lightColors]: string;
};

export const colors = lightColors;

export const habitAccents: Record<HabitColorKey, string> = {
  primary: "#2D6A4F",
  emerald: "#047857",
  violet: "#6D28D9",
  amber: "#B45309",
  cyan: "#0E7490",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  card: 16,
  button: 12,
  badge: 8,
  pill: 999,
} as const;

export const elevation = {
  card: {
    shadowColor: "#1F2421",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tactileLip: {
    borderBottomWidth: 3,
  },
} as const;

export const motion = {
  fastMs: 150,
  normalMs: 250,
  slowMs: 450,
  springs: {
    snappy: { damping: 18, stiffness: 320, mass: 0.8 },
    bouncy: { damping: 12, stiffness: 240, mass: 0.9 },
  },
} as const;
