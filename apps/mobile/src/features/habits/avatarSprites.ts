import type { AvatarClass } from "@habit/shared";
import type { AvatarGearTier } from "./avatarMapper";

export const CLASS_TITLES: Record<AvatarClass, Record<AvatarGearTier, string>> = {
  knight: {
    novice: "Squire",
    adept: "Arcane Knight",
    champion: "Royal Paladin",
    hero: "Astral Templar",
    legend: "Eternal Sovereign",
  },
  mage: {
    novice: "Apprentice Mage",
    adept: "Battle Mage",
    champion: "Grand Archmage",
    hero: "Starweaver",
    legend: "Celestial Oracle",
  },
  ranger: {
    novice: "Forest Scout",
    adept: "Shadow Ranger",
    champion: "Grand Warden",
    hero: "Windrunner",
    legend: "Mythic Pathfinder",
  },
};

// 16x16 grid: rows 0-1 headroom, cols 5-10 face/torso, cols 3-4 cape, cols 11-14 weapon.
// Legend: .=transparent O=outline S=skin P=blush E=eye W=shine H=headgear C=gold A=armor B=boots/cape M=wood G=blade/spell.
export const KNIGHT_IDLE_0: readonly string[] = [
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

export const KNIGHT_IDLE_1: readonly string[] = [
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

export const CLASS_FRAMES: Record<
  AvatarClass,
  {
    readonly idle: readonly (readonly string[])[];
    readonly action: readonly (readonly string[])[];
  }
> = {
  knight: {
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
  },
  mage: {
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
  },
  ranger: {
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
  },
};

const BASE_PALETTE = {
  O: "#2A2140",
  S: "#FDBA74",
  P: "#FB7185",
  E: "#2A2140",
  W: "#FFFFFF",
  M: "#92400E",
} as const;

type TierPalette = {
  readonly H: string;
  readonly C: string;
  readonly A: string;
  readonly B: string;
  readonly G: string;
};

const TIER_PALETTES: Record<AvatarClass, Record<AvatarGearTier, TierPalette>> = {
  knight: {
    novice: { H: "#4FB3FF", C: "#FFD23F", A: "#38BDF8", B: "#0284C7", G: "#E2E8F0" },
    adept: { H: "#6B4DF5", C: "#FFD23F", A: "#7C3AED", B: "#4C1D95", G: "#38BDF8" },
    champion: { H: "#6B4DF5", C: "#FFD23F", A: "#FFD23F", B: "#6B4DF5", G: "#22D3EE" },
    hero: { H: "#4338CA", C: "#FDE047", A: "#818CF8", B: "#312E81", G: "#67E8F9" },
    legend: { H: "#F59E0B", C: "#FEF08A", A: "#FBBF24", B: "#7C3AED", G: "#FFFFFF" },
  },
  mage: {
    novice: { H: "#0EA5E9", C: "#FFD23F", A: "#38BDF8", B: "#0369A1", G: "#34D399" },
    adept: { H: "#6B4DF5", C: "#FFD23F", A: "#8B5CF6", B: "#4C1D95", G: "#22D3EE" },
    champion: { H: "#4C1D95", C: "#FFD23F", A: "#6B4DF5", B: "#FFD23F", G: "#F43F5E" },
    hero: { H: "#7E22CE", C: "#FDE047", A: "#A855F7", B: "#3B0764", G: "#38BDF8" },
    legend: { H: "#312E81", C: "#FEF08A", A: "#6366F1", B: "#F59E0B", G: "#F472B6" },
  },
  ranger: {
    novice: { H: "#10B981", C: "#FFD23F", A: "#059669", B: "#065F46", G: "#A7F3D0" },
    adept: { H: "#059669", C: "#34D399", A: "#047857", B: "#2A2140", G: "#22D3EE" },
    champion: { H: "#047857", C: "#FFD23F", A: "#10B981", B: "#FFD23F", G: "#FFD23F" },
    hero: { H: "#0F766E", C: "#67E8F9", A: "#14B8A6", B: "#134E4A", G: "#FDE047" },
    legend: { H: "#065F46", C: "#FEF08A", A: "#34D399", B: "#F59E0B", G: "#A5F3FC" },
  },
};

const COSMETIC_PALETTE_OVERRIDES: Readonly<Record<string, TierPalette>> = {
  palette_crimson: {
    H: "#BE123C",
    C: "#FDE047",
    A: "#E11D48",
    B: "#881337",
    G: "#FDA4AF",
  },
  palette_frost: {
    H: "#0284C7",
    C: "#E0F2FE",
    A: "#38BDF8",
    B: "#075985",
    G: "#67E8F9",
  },
  palette_solar: {
    H: "#D97706",
    C: "#FEF08A",
    A: "#F59E0B",
    B: "#92400E",
    G: "#FDE047",
  },
  palette_void: {
    H: "#3B0764",
    C: "#E879F9",
    A: "#581C87",
    B: "#1E1B4B",
    G: "#C084FC",
  },
};

export const COSMETIC_AURA_COLORS: Readonly<
  Record<string, { readonly ring: string; readonly spark: string }>
> = {
  aura_ember: { ring: "rgba(249, 115, 22, 0.28)", spark: "#F97316" },
  aura_arcane: { ring: "rgba(99, 102, 241, 0.30)", spark: "#38BDF8" },
  aura_crown: { ring: "rgba(234, 179, 8, 0.32)", spark: "#FACC15" },
};

export const COSMETIC_FRAME_COLORS: Readonly<Record<string, string>> = {
  frame_emerald: "#10B981",
  frame_gold: "#F59E0B",
  frame_nebula: "#8B5CF6",
};

export function buildPalette(
  avatarClass: AvatarClass,
  gearTier: AvatarGearTier,
  equippedPaletteId?: string | null,
): Readonly<Record<string, string>> {
  const override = equippedPaletteId
    ? COSMETIC_PALETTE_OVERRIDES[equippedPaletteId]
    : undefined;
  return {
    ...BASE_PALETTE,
    ...(override ?? TIER_PALETTES[avatarClass][gearTier]),
  };
}
