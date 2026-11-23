import type { QuestProgress } from "./questStats";

export type AvatarClass = "knight" | "mage" | "ranger";
export type AvatarGearTier = "novice" | "adept" | "champion";
export type AvatarMood = "idle" | "active" | "victory";

export type AvatarVisualState = {
  readonly avatarClass: AvatarClass;
  readonly gearTier: AvatarGearTier;
  readonly classTitle: string;
  readonly mood: AvatarMood;
  readonly sparkleCount: number;
  readonly primaryFrame: readonly string[];
  readonly altFrame: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
};

const CLASS_TITLES: Record<AvatarClass, Record<AvatarGearTier, string>> = {
  knight: {
    novice: "Squire",
    adept: "Arcane Knight",
    champion: "Royal Paladin",
  },
  mage: {
    novice: "Apprentice Mage",
    adept: "Battle Mage",
    champion: "Grand Archmage",
  },
  ranger: {
    novice: "Forest Scout",
    adept: "Shadow Ranger",
    champion: "Grand Warden",
  },
};

// Legend for 16x16 pixel grids:
// . = transparent
// O = dark outline (#2A2140)
// S = skin (#FDBA74)
// E = eye/detail (#2A2140)
// W = eye shine / blade highlight (#FFFFFF)
// H = headgear / helmet / hat primary
// C = crown / accent trim (#FFD23F)
// A = armor / robe primary
// B = secondary / cape / belt
// M = weapon shaft / hilt (#A16207)
// G = weapon blade / magic crystal

const KNIGHT_IDLE_1: readonly string[] = [
  ".....OOOOOO.....",
  "....OHHHHHHO....",
  "...OHCCCCCCCHO..",
  "...OHHHHHHHHHO..",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "...OSSSSSSSSSO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAABBO",
  ".OBB.OOOOOOO.GGO",
  "..O..OAAAAAO.GWO",
  ".....OAA.AAO.GGO",
  ".....OBB.BBO.MMO",
  ".....OOO.OOO..O.",
];

const KNIGHT_IDLE_2: readonly string[] = [
  "................",
  ".....OOOOOO.....",
  "....OHHHHHHO....",
  "...OHCCCCCCCHO..",
  "...OHHHHHHHHHO..",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAABBO",
  ".OBB.OOOOOOO.GWO",
  "..O..OAAAAAO.GGO",
  ".....OAA.AAO.MMO",
  ".....OBB.BBO..O.",
  ".....OOO.OOO....",
];

const KNIGHT_VICTORY: readonly string[] = [
  ".............GG.",
  ".....OOOOOO..GW.",
  "....OHHHHHHO.GG.",
  "...OHCCCCCCCHMM.",
  "...OHHHHHHHHHO..",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "....OOOOOOOOO...",
  ".OBBAAAAAAAAAOO.",
  "OBBBAAACCCAAABBO",
  "OBBBAAAAAAAAABBO",
  ".OO..OOOOOOO..O.",
  ".....OAAAAAO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "....OOO...OOO...",
];

const MAGE_IDLE_1: readonly string[] = [
  "......OOOO......",
  ".....OHHHHO.....",
  "....OHHHHHHO....",
  "..OOHCCCCCCCHOO.",
  ".OHHHHHHHHHHHHHO",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAA.GO",
  "..O.OAAAAAAAO.WO",
  "....OAAAAAAAO.MO",
  "....OAAACAAAO.MO",
  "....OBBB.BBBO.MO",
  "....OOOO.OOOO.O.",
];

const MAGE_IDLE_2: readonly string[] = [
  ".......OO.......",
  "......OHHO......",
  ".....OHHHHO.....",
  "..OOHCCCCCCCHOO.",
  ".OHHHHHHHHHHHHHO",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAA.WO",
  "..O.OAAAAAAAO.GO",
  "....OAAAAAAAO.MO",
  "....OAAACAAAO.MO",
  "....OBBB.BBBO.MO",
  "....OOOO.OOOO.O.",
];

const MAGE_VICTORY: readonly string[] = [
  "......OOOO...GGG",
  ".....OHHHHO..GWG",
  "....OHHHHHHO.GGG",
  "..OOHCCCCCCCH.M.",
  ".OHHHHHHHHHHH.M.",
  "...OSSSSSSSSS.M.",
  "...OSEWSSSWES.M.",
  "....OOOOOOOOO.M.",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAABBO",
  "....OAAAAAAAO...",
  "....OAAACAAAO...",
  "...OOAAAAAAAOO..",
  "...OBBB...BBBO..",
  "...OOOO...OOOO..",
];

const RANGER_IDLE_1: readonly string[] = [
  ".....OOOOOO.....",
  "....OHHHHHHCCO..",
  "...OHHHHHHHHHO..",
  "...OHHHCCCHHHO..",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "...OSSSSSSSSSO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAA.MO",
  "..O..OOOOOOO.MWO",
  ".....OAAAAAO.M.O",
  ".....OAA.AAO.MWO",
  ".....OBB.BBO..MO",
  ".....OOO.OOO....",
];

const RANGER_IDLE_2: readonly string[] = [
  "................",
  ".....OOOOOO.....",
  "....OHHHHHHCCO..",
  "...OHHHHHHHHHO..",
  "...OHHHCCCHHHO..",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAA.MO",
  "..O..OOOOOOO.MWO",
  ".....OAAAAAO.M.O",
  ".....OAA.AAO.MWO",
  ".....OBB.BBO..MO",
  ".....OOO.OOO....",
];

const RANGER_VICTORY: readonly string[] = [
  ".............MO.",
  ".....OOOOOO.MWO.",
  "....OHHHHHHCM.O.",
  "...OHHHHHHHHMWO.",
  "...OHHHCCCHH.MO.",
  "...OSSSSSSSSSO..",
  "...OSEWSSSWESO..",
  "....OOOOOOOOO...",
  "..OOAAAAAAAAAOO.",
  ".OBBAAACCCAAABBO",
  ".OBBAAAAAAAAABBO",
  ".....OOOOOOO....",
  ".....OAAAAAO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "....OOO...OOO...",
];

function buildPalette(
  avatarClass: AvatarClass,
  gearTier: AvatarGearTier,
): Readonly<Record<string, string>> {
  const base = {
    O: "#2A2140",
    S: "#FDBA74",
    E: "#2A2140",
    W: "#FFFFFF",
    M: "#92400E",
  };

  if (avatarClass === "knight") {
    if (gearTier === "novice") {
      return {
        ...base,
        H: "#4FB3FF",
        C: "#FFD23F",
        A: "#38BDF8",
        B: "#0284C7",
        G: "#E2E8F0",
      };
    }
    if (gearTier === "adept") {
      return {
        ...base,
        H: "#6B4DF5",
        C: "#FFD23F",
        A: "#7C3AED",
        B: "#4C1D95",
        G: "#38BDF8",
      };
    }
    return {
      ...base,
      H: "#6B4DF5",
      C: "#FFD23F",
      A: "#FFD23F",
      B: "#6B4DF5",
      G: "#22D3EE",
    };
  }

  if (avatarClass === "mage") {
    if (gearTier === "novice") {
      return {
        ...base,
        H: "#0EA5E9",
        C: "#FFD23F",
        A: "#38BDF8",
        B: "#0369A1",
        G: "#34D399",
      };
    }
    if (gearTier === "adept") {
      return {
        ...base,
        H: "#6B4DF5",
        C: "#FFD23F",
        A: "#8B5CF6",
        B: "#4C1D95",
        G: "#22D3EE",
      };
    }
    return {
      ...base,
      H: "#4C1D95",
      C: "#FFD23F",
      A: "#6B4DF5",
      B: "#FFD23F",
      G: "#F43F5E",
    };
  }

  // Ranger
  if (gearTier === "novice") {
    return {
      ...base,
      H: "#10B981",
      C: "#FFD23F",
      A: "#059669",
      B: "#065F46",
      G: "#A7F3D0",
    };
  }
  if (gearTier === "adept") {
    return {
      ...base,
      H: "#059669",
      C: "#34D399",
      A: "#047857",
      B: "#2A2140",
      G: "#22D3EE",
    };
  }
  return {
    ...base,
    H: "#047857",
    C: "#FFD23F",
    A: "#10B981",
    B: "#FFD23F",
    G: "#FFD23F",
  };
}

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

  const sparkleCount =
    mood === "victory" ? 4 : mood === "active" ? 2 : 0;

  const frames =
    avatarClass === "mage"
      ? {
          idle1: MAGE_IDLE_1,
          idle2: MAGE_IDLE_2,
          victory: MAGE_VICTORY,
        }
      : avatarClass === "ranger"
        ? {
            idle1: RANGER_IDLE_1,
            idle2: RANGER_IDLE_2,
            victory: RANGER_VICTORY,
          }
        : {
            idle1: KNIGHT_IDLE_1,
            idle2: KNIGHT_IDLE_2,
            victory: KNIGHT_VICTORY,
          };

  const primaryFrame = mood === "victory" ? frames.victory : frames.idle1;
  const altFrame = mood === "victory" ? frames.idle1 : frames.idle2;

  return {
    avatarClass,
    gearTier,
    classTitle,
    mood,
    sparkleCount,
    primaryFrame,
    altFrame,
    palette: buildPalette(avatarClass, gearTier),
  };
}
