import type { HabitColorKey } from "@habit/shared";

export const colors = {
  background: "#FFF7EA",
  surface: "#FFFFFF",
  surfaceMuted: "#D9EEFF",
  textPrimary: "#2A2140",
  textSecondary: "#6B6285",
  primary: "#6B4DF5",
  primaryPressed: "#5438D6",
  primaryText: "#FFFFFF",
  accent: "#FFD23F",
  accentBg: "#FFD23F",
  accentText: "#2A2140",
  sky: "#4FB3FF",
  success: "#15803D",
  danger: "#DC2626",
  border: "#A9D8FF",
  borderStrong: "#6B6285",
} as const;

export const habitAccents: Record<HabitColorKey, string> = {
  primary: "#2D6A4F",
  emerald: "#059669",
  violet: "#7C3AED",
  amber: "#D97706",
  cyan: "#0891B2",
};

export const worldColors = {
  nightBg: "#070B14",
  nightSurface: "#111827",
  glowCyan: "#22D3EE",
  glowEmerald: "#34D399",
  glowViolet: "#A78BFA",
  glowAmber: "#FBBF24",
  dimmed: "#475569",
  particle: "#BAE6FD",
} as const;

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
