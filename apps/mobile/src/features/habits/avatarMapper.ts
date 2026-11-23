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
  readonly frames: readonly (readonly string[])[];
  readonly actionFrames: readonly (readonly string[])[];
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

// Slim 16-bit RPG Hero Proportions (16x16 grid):
// Rows 0-1: headroom so jumps/weapons never clip at the top
// Cols 5-10 (6px): slim head & face
// Cols 5-9 (5px): slim torso & legs
// Cols 3-4: flowing cape
// Cols 11-14: weapon & slash/spell effects
//
// Legend:
// . = transparent
// O = outline (#2A2140)
// S = skin (#FDBA74)
// P = cheek blush (#FB7185)
// E = eye (#2A2140)
// W = white shine / highlight (#FFFFFF)
// H = headgear primary
// C = gold crown / trim / spark (#FFD23F)
// A = armor / robe primary
// B = cape / boots / secondary
// M = wood / hilt / bow (#92400E)
// G = blade / magic crystal / arrow

// ==================== KNIGHT (Slim & Proportional) ====================
const KNIGHT_IDLE_0: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO..",
  "....OPESSSEPO.G.",
  ".....OSSSSSO.GW.",
  "....OOAAACAOO.G.",
  "...OBOAAAAAOSMM.",
  "...OBOAAACAAO.M.",
  "....O.OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const KNIGHT_IDLE_1: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO.W",
  "....OPESSSEPO.GG",
  ".....OSSSSSO..G.",
  "...OBOAAACAOO.M.",
  "..OBBOAAAAAOSMM.",
  "..OB.OAAACAAO...",
  "......OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const KNIGHT_IDLE_2: readonly string[] = [
  "................",
  "................",
  "......OOOO......",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO.G",
  "....OPESSSEPO.GW",
  ".....OSSSSSO..G.",
  "...OBOAAACAOOMM.",
  "..OBBOAAAAAOSM..",
  "...O.OAAACAAO...",
  ".....OOOOOOO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const KNIGHT_IDLE_3: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSSSSSSSO...",
  "....OPEESEEPO.G.",
  ".....OSSSSSO.GW.",
  "....OOAAACAOO.G.",
  "...OBOAAAAAOSMM.",
  "...OBOAAACAAO.M.",
  "....O.OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const KNIGHT_IDLE_4: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO..C",
  "....OSWSSSWSSOGW",
  "....OPESSSEPO.GG",
  ".....OSSSSSO..G.",
  "....OOAAACAOO.M.",
  "...OBOAAAAAOSMM.",
  "...OBOAAACAAO...",
  "....O.OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const KNIGHT_ACTION_0: readonly string[] = [
  "................",
  "................",
  "......OOOO......",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO..",
  "....OPESSSEPO.G.",
  "...OBOAAACAOO.GW",
  "..OBBOAAAAAOSMM.",
  "..OB.OAAACAAO.M.",
  "......OOOOOO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "....OOO...OOO...",
  "................",
];

const KNIGHT_ACTION_1: readonly string[] = [
  "...........GGW..",
  "......OOOO..GGW.",
  ".....OHCCCHO.GG.",
  "....OHHHHHHHOMO.",
  "....OSSSSSSSMO..",
  "....OSWSSSWSSO..",
  "....OPESSSEPO...",
  "...OBOAAACAOO...",
  "..OBBOAAAAAABO..",
  "..OB.OAAACAAO...",
  "......OOOOOO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "....OOO...OOO...",
  "................",
  "................",
];

const KNIGHT_ACTION_2: readonly string[] = [
  ".........C.GGWC.",
  "......OOOO..GGWW",
  ".....OHCCCHO.GGW",
  "....OHHHHHHHOMO.",
  "....OSSSSSSSMO..",
  "...COSWSSSWSSO.C",
  "....OPESSSEPO...",
  "..OBBOAAACAOO...",
  ".OBBBOAAAAAABO..",
  "..OO.OAAACAAO...",
  "......OOOOOO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "................",
  "................",
  "................",
];

const KNIGHT_ACTION_3: readonly string[] = [
  "................",
  "......OOOO..C...",
  ".....OHCCCHO....",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO..",
  "....OPESSSEPO...",
  ".....OSSSSSO....",
  "...OBOAAACAOO...",
  "..OBBOAAAAAASMM.",
  "...O.OAAACAAOGGW",
  "......OOOOOO..GG",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

// ==================== MAGE (Slim & Proportional) ====================
const MAGE_IDLE_0: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHO.....",
  "...OOHCCCCHOO...",
  "..OHHHHHHHHHHO..",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO..",
  "....OPESSSEPO.GW",
  ".....OSSSSSO..GG",
  "....OOAAACAOO.M.",
  "...OBOAAAAAOSMM.",
  "...OBOAAACAAO.M.",
  "....OOAAAAAOO.M.",
  ".....OAA.AAO..M.",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
];

const MAGE_IDLE_1: readonly string[] = [
  "................",
  ".......OO.......",
  ".....OHHHHO.....",
  "...OOHCCCCHOO...",
  "..OHHHHHHHHHHO..",
  "....OSSSSSSSO.C.",
  "....OSWSSSWSSOGW",
  "....OPESSSEPO.GG",
  ".....OSSSSSO..M.",
  "...OBOAAACAOO.M.",
  "..OBBOAAAAAOSMM.",
  "...O.OAAACAAO.M.",
  ".....OAAAAAOO.M.",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
];

const MAGE_IDLE_2: readonly string[] = [
  "................",
  "................",
  "......OOOO......",
  ".....OHHHHO.....",
  "...OOHCCCCHOO...",
  "..OHHHHHHHHHHO..",
  "....OSSSSSSSO.GW",
  "....OSWSSSWSSOGG",
  "....OPESSSEPO.M.",
  "...OBOAAACAOO.M.",
  "..OBBOAAAAAOSMM.",
  "...O.OAAACAAO.M.",
  ".....OAAAAAOO.M.",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
];

const MAGE_IDLE_3: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHO.....",
  "...OOHCCCCHOO...",
  "..OHHHHHHHHHHO..",
  "....OSSSSSSSO...",
  "....OSSSSSSSO...",
  "....OPEESEEPO.GW",
  ".....OSSSSSO..GG",
  "....OOAAACAOO.M.",
  "...OBOAAAAAOSMM.",
  "...OBOAAACAAO.M.",
  "....OOAAAAAOO.M.",
  ".....OAA.AAO..M.",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
];

const MAGE_IDLE_4: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHO..C..",
  "...OOHCCCCHOO...",
  "..OHHHHHHHHHHO..",
  "....OSSSSSSSO.WG",
  "....OSWSSSWSSOGW",
  "....OPESSSEPO.M.",
  ".....OSSSSSO..M.",
  "....OOAAACAOO.M.",
  "...OBOAAAAAOSMM.",
  "...OBOAAACAAO.M.",
  "....OOAAAAAOO.M.",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
];

const MAGE_ACTION_1: readonly string[] = [
  "............CWC.",
  "......OOOO..GWG.",
  ".....OHHHHO.GGG.",
  "...OOHCCCCHOO.M.",
  "..OHHHHHHHHHHSMO",
  "....OSSSSSSSO.M.",
  "....OSWSSSWSSO.M",
  "....OPESSSEPO..M",
  "...OBOAAACAOO..M",
  "..OBBOAAAAAABO..",
  "...O.OAAACAAO...",
  ".....OAAAAAOO...",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "................",
  "................",
];

const MAGE_ACTION_2: readonly string[] = [
  "....C.......WGW.",
  "......OOOO..CWC.",
  ".....OHHHHO.GWG.",
  "...OOHCCCCHOO.M.",
  "..OHHHHHHHHHHSMO",
  "...COSSSSSSSO.M.",
  "....OSWSSSWSSO.M",
  "....OPESSSEPO..M",
  "..OBBOAAACAOO...",
  ".OBBBOAAAAAABO..",
  "..OO.OAAAAAOO...",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "................",
  "................",
  "................",
];

// ==================== RANGER (Slim & Proportional) ====================
const RANGER_IDLE_0: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHCCO...",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSO..",
  "....OPESSSEPO.MO",
  ".....OSSSSSO..MW",
  "....OOAAACAOO.MW",
  "...OBOAAAAAOSMMW",
  "...OBOAAACAAO.MO",
  "....O.OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const RANGER_IDLE_1: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHCCO...",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSOMO",
  "....OPESSSEPO.MW",
  ".....OSSSSSO..MW",
  "...OBOAAACAOO.MW",
  "..OBBOAAAAAOSMMO",
  "..OB.OAAACAAO...",
  "......OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const RANGER_IDLE_2: readonly string[] = [
  "................",
  "................",
  "......OOOO......",
  ".....OHHHHCCO...",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSWSSSWSSOMO",
  "....OPESSSEPO.MW",
  ".....OSSSSSO..MW",
  "...OBOAAACAOOMMW",
  "..OBBOAAAAAOSMO.",
  "...O.OAAACAAO...",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const RANGER_IDLE_3: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHCCO...",
  "....OHHHHHHHO...",
  "....OSSSSSSSO...",
  "....OSSSSSSSO...",
  "....OPEESEEPO.MO",
  ".....OSSSSSO..MW",
  "....OOAAACAOO.MW",
  "...OBOAAAAAOSMMW",
  "...OBOAAACAAO.MO",
  "....O.OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const RANGER_IDLE_4: readonly string[] = [
  "................",
  "......OOOO......",
  ".....OHHHHCCO...",
  "....OHHHHHHHO...",
  "....OSSSSSSSO..C",
  "....OSWSSSWSSOMO",
  "....OPESSSEPO.MW",
  ".....OSSSSSO.GMW",
  "....OOAAACAOOGMW",
  "...OBOAAAAAOSMMO",
  "...OBOAAACAAO...",
  "....O.OOOOOO....",
  ".....OAA.AAO....",
  ".....OBB.BBO....",
  ".....OOO.OOO....",
  "................",
];

const RANGER_ACTION_1: readonly string[] = [
  "................",
  "......OOOO..MO..",
  ".....OHHHHCCMW..",
  "....OHHHHHHHMWC.",
  "....OSSSSSSSMWW.",
  "....OSWSSSWSSMO.",
  "....OPESSSEPO...",
  "...OBOAAACAOO...",
  "..OBBOAAAAAABO..",
  "...O.OAAACAAO...",
  "......OOOOOO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "....OOO...OOO...",
  "................",
  "................",
];

const RANGER_ACTION_2: readonly string[] = [
  "....C.......MO..",
  "......OOOO..MWC.",
  ".....OHHHHCCMWWC",
  "....OHHHHHHHSMO.",
  "....OSSSSSSSO...",
  "...COSWSSSWSSO.C",
  "....OPESSSEPO...",
  "..OBBOAAACAOO...",
  ".OBBBOAAAAAABO..",
  "..OO.OAAACAAO...",
  "......OOOOOO....",
  "....OOAA.AAOO...",
  "....OBB...BBO...",
  "................",
  "................",
  "................",
];

function buildPalette(
  avatarClass: AvatarClass,
  gearTier: AvatarGearTier,
): Readonly<Record<string, string>> {
  const base = {
    O: "#2A2140",
    S: "#FDBA74",
    P: "#FB7185",
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

  const sparkleCount = mood === "victory" ? 4 : mood === "active" ? 2 : 0;

  const classSet =
    avatarClass === "mage"
      ? {
          idle: [
            MAGE_IDLE_0,
            MAGE_IDLE_1,
            MAGE_IDLE_2,
            MAGE_IDLE_0,
            MAGE_IDLE_3,
            MAGE_IDLE_4,
          ],
          action: [
            MAGE_IDLE_2,
            MAGE_ACTION_1,
            MAGE_ACTION_2,
            MAGE_ACTION_1,
            MAGE_IDLE_4,
          ],
        }
      : avatarClass === "ranger"
        ? {
            idle: [
              RANGER_IDLE_0,
              RANGER_IDLE_1,
              RANGER_IDLE_2,
              RANGER_IDLE_0,
              RANGER_IDLE_3,
              RANGER_IDLE_4,
            ],
            action: [
              RANGER_IDLE_2,
              RANGER_ACTION_1,
              RANGER_ACTION_2,
              RANGER_ACTION_1,
              RANGER_IDLE_4,
            ],
          }
        : {
            idle: [
              KNIGHT_IDLE_0,
              KNIGHT_IDLE_1,
              KNIGHT_IDLE_2,
              KNIGHT_IDLE_0,
              KNIGHT_IDLE_3,
              KNIGHT_IDLE_4,
            ],
            action: [
              KNIGHT_ACTION_0,
              KNIGHT_ACTION_1,
              KNIGHT_ACTION_2,
              KNIGHT_ACTION_3,
              KNIGHT_IDLE_4,
            ],
          };

  const frames = classSet.idle;
  const actionFrames = classSet.idle;

  return {
    avatarClass,
    gearTier,
    classTitle,
    mood,
    sparkleCount,
    frames,
    actionFrames,
    primaryFrame: frames[0] ?? KNIGHT_IDLE_0,
    altFrame: frames[1] ?? KNIGHT_IDLE_1,
    palette: buildPalette(avatarClass, gearTier),
  };
}
