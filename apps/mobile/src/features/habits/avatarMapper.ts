import type { AvatarClass, HeroLoadout } from "@habit/shared";
import type { QuestProgress } from "./questStats";
import {
  AVATAR_GRID_SIZE,
  CLASS_FRAMES,
  CLASS_TITLES,
  COSMETIC_AURA_COLORS,
  COSMETIC_FRAME_COLORS,
  KNIGHT_IDLE_0,
  buildPalette,
} from "./avatarSprites";

export type { AvatarClass };
export type AvatarGearTier =
  | "novice"
  | "adept"
  | "champion"
  | "hero"
  | "legend";
export type AvatarMood = "idle" | "active" | "victory";

export type AvatarVisualState = {
  readonly gridSize: number;
  readonly avatarClass: AvatarClass;
  readonly gearTier: AvatarGearTier;
  readonly classTitle: string;
  readonly mood: AvatarMood;
  readonly sparkleCount: number;
  readonly auraRingColor: string | null;
  readonly auraSparkColor: string | null;
  readonly frameBorderColor: string | null;
  readonly frames: readonly (readonly string[])[];
  readonly actionFrames: readonly (readonly string[])[];
  readonly primaryFrame: readonly string[];
  readonly altFrame: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
};

export function resolveGearTier(level: number): AvatarGearTier {
  if (level >= 20) return "legend";
  if (level >= 10) return "hero";
  if (level >= 5) return "champion";
  if (level >= 3) return "adept";
  return "novice";
}

export function mapQuestProgressToAvatar(
  progress: QuestProgress,
  avatarClass: AvatarClass = "knight",
  loadout?: Partial<HeroLoadout>,
): AvatarVisualState {
  const resolvedClass = loadout?.avatarClass ?? avatarClass;
  const gearTier = resolveGearTier(progress.level);
  const classTitle = CLASS_TITLES[resolvedClass][gearTier];

  const allDone =
    progress.scheduledToday > 0 &&
    progress.completedToday >= progress.scheduledToday;

  const mood: AvatarMood =
    allDone || progress.comboMultiplier >= 2
      ? "victory"
      : progress.completedToday > 0
        ? "active"
        : "idle";

  const aura = loadout?.equippedAuraId
    ? COSMETIC_AURA_COLORS[loadout.equippedAuraId]
    : undefined;
  const frameBorderColor = loadout?.equippedFrameId
    ? (COSMETIC_FRAME_COLORS[loadout.equippedFrameId] ?? null)
    : null;

  const baseSparkles = mood === "victory" ? 4 : mood === "active" ? 2 : 0;
  const sparkleCount = aura ? Math.max(baseSparkles, 4) : baseSparkles;
  const classSet = CLASS_FRAMES[resolvedClass];

  return {
    gridSize: AVATAR_GRID_SIZE,
    avatarClass: resolvedClass,
    gearTier,
    classTitle,
    mood,
    sparkleCount,
    auraRingColor: aura?.ring ?? null,
    auraSparkColor: aura?.spark ?? null,
    frameBorderColor,
    frames: classSet.idle,
    actionFrames: classSet.action,
    primaryFrame: classSet.idle[0] ?? KNIGHT_IDLE_0,
    altFrame: classSet.idle[1] ?? KNIGHT_IDLE_0,
    palette: buildPalette(resolvedClass, gearTier, loadout?.equippedPaletteId),
  };
}
