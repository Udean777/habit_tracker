import type { QuestProgress } from "./questStats";
import {
  CLASS_FRAMES,
  CLASS_TITLES,
  KNIGHT_IDLE_0,
  KNIGHT_IDLE_1,
  buildPalette,
} from "./avatarSprites";

export type AvatarClass = "knight" | "mage" | "ranger";
export type AvatarGearTier = "novice" | "adept" | "champion";
export type AvatarMood = "idle" | "active" | "victory";

export type AvatarVisualState = {
  readonly avatarClass: AvatarClass;
  readonly gearTier: AvatarGearTier;
  readonly classTitle: string;
  readonly mood: AvatarMood;
  readonly sparkleCount: number;
  readonly frames: readonly (readonly string[])[];
  readonly actionFrames: readonly (readonly string[])[];
  readonly primaryFrame: readonly string[];
  readonly altFrame: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
};

export function resolveGearTier(level: number): AvatarGearTier {
  if (level >= 5) return "champion";
  if (level >= 3) return "adept";
  return "novice";
}

export function mapQuestProgressToAvatar(
  progress: QuestProgress,
  avatarClass: AvatarClass = "knight",
): AvatarVisualState {
  const gearTier = resolveGearTier(progress.level);
  const classTitle = CLASS_TITLES[avatarClass][gearTier];

  const allDone =
    progress.scheduledToday > 0 &&
    progress.completedToday >= progress.scheduledToday;

  const mood: AvatarMood =
    allDone || progress.comboMultiplier >= 2
      ? "victory"
      : progress.completedToday > 0
        ? "active"
        : "idle";

  const sparkleCount = mood === "victory" ? 4 : mood === "active" ? 2 : 0;
  const classSet = CLASS_FRAMES[avatarClass];

  return {
    avatarClass,
    gearTier,
    classTitle,
    mood,
    sparkleCount,
    frames: classSet.idle,
    actionFrames: classSet.action,
    primaryFrame: classSet.idle[0] ?? KNIGHT_IDLE_0,
    altFrame: classSet.idle[1] ?? KNIGHT_IDLE_1,
    palette: buildPalette(avatarClass, gearTier),
  };
}
