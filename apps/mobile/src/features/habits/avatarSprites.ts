import type { AvatarClass } from "@habit/shared";
import type { AvatarGearTier } from "./avatarMapper";

export const AVATAR_GRID_SIZE = 32;

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

// 32x32 16-bit RPG human sprites (3-head proportions: head rows 2-12, neck 13-14, torso/arms 15-22, legs/boots 23-29).
// Palette legend:
// .=transparent  O=outline  L=skin highlight  S=skin mid  D=skin shadow  P=blush  E=eye  W=shine
// U=hair/hat hi  H=hair/hat mid  N=hair/hat shadow
// K=armor/cloth hi  A=armor/cloth mid  B=armor/cloth shadow
// C=gold/emblem  M=wood/leather  G=blade/magic mid  T=blade/magic shadow

// Helper to shift a 32x32 sprite vertically or apply small frame deltas cleanly while preserving exact 32x32 bounds.
function patchFrame(
  base: readonly string[],
  overrides: Readonly<Record<number, string>>,
): readonly string[] {
  return base.map((row, idx) => overrides[idx] ?? row);
}

// ============================================================================
// KNIGHT (Open-face circlet, tousled hair, pauldrons, cape, shield & sword)
// ============================================================================
export const KNIGHT_IDLE_0: readonly string[] = [
  "................................",
  "..............OOOO..............",
  "...........OOOUUUUOOO...........",
  "..........OUUUHCCCCHUO..........",
  ".........OUHHOOOOOOOHHO.........",
  "........OUHNNULLLLUUNHHO........",
  "........OHNLLSSSSSSLLNHO........",
  ".......OHNLSSSDSSSDSSLNHO.......",
  ".......O.OLSWESSSSWESLO.O.......",
  ".........OLSEESSSSEESLO.........",
  ".........OPSSSSSSSSSSPO.........",
  "..........ODSSSSSSSSDO..........",
  "...........OODDDDDDOO...........",
  "........OOOOOODSSDDOOOOO........",
  ".......OKKKAOOCSSCCOAABBO.......",
  "......OKKAAKKOAAAAOKKAAKKO..W...",
  "......OKAAKOOKACCAAKOOKAAO.GW...",
  ".....OBKAAKOOKACCAAKOOKAAO.GG...",
  ".....OBBAAKOOKAAAAAKOOKAAO.GT...",
  "....OBB.OSSOOOMCCCMOOOSSOGTGT...",
  "....OB..OSSOOMMMMMMMOOSOCMMCO...",
  "....O...OOOO.OAAAAAO..OO.OMMO...",
  ".............OKAAAKO......OO....",
  "............OKAO.OAKO...........",
  "............OAAO.OAAO...........",
  "............OBBO.OBBO...........",
  "...........OMMMO.OMMMO..........",
  "...........OMBMO.OMBMO..........",
  "...........OBBBO.OBBBO..........",
  "...........OOOOO.OOOOO..........",
  "................................",
  "................................",
];

const KNIGHT_IDLE_1: readonly string[] = patchFrame(KNIGHT_IDLE_0, {
  14: ".......OKKKAOOCSSCCOAABBO...W...",
  15: "......OKKAAKKOAAAAOKKAAKKO.GW...",
  16: ".....OBKAAKOOKACCAAKOOKAAO.GG...",
  17: "....OBBKAAKOOKACCAAKOOKAAO.GT...",
  18: "....OBBBAAKOOKAAAAAKOOKAAOGTG...",
  19: "...OBB..OSSOOOMCCCMOOOSSOCMMCO..",
  20: "...OB...OSSOOMMMMMMMOOSO.OMMO...",
});

const KNIGHT_IDLE_2: readonly string[] = patchFrame(KNIGHT_IDLE_0, {
  8: ".......O.OLSSSSSSSSSSLO.O.......",
  9: ".........OLDOOSSSSOODLO.........",
});

const KNIGHT_IDLE_3: readonly string[] = patchFrame(KNIGHT_IDLE_0, {
  14: ".......OKKKAOOCSSCCOAABBO..CW...",
  15: "......OKKAAKKOAAAAOKKAAKKO.WW...",
  16: "......OKAAKOOKACCAAKOOKAAO.GW...",
  19: "...OBB..OSSOOOMCCCMOOOSSOGTGT...",
});

const KNIGHT_ACTION_0: readonly string[] = patchFrame(KNIGHT_IDLE_0, {
  15: "......OKKAAKKOAAAAOKKAAKKO......",
  16: ".....OBKAAKOOKACCAAKOOKAAO..W...",
  17: "....OBBKAAKOOKACCAAKOOKAAO.GW...",
  18: "....OBBBAAKOOKAAAAAKOOKAAO.GG...",
  19: "...OBB..OSSOOOMCCCMOOOSSOGTGT...",
  20: "...OB...OSSOOMMMMMMMOOSOCMMCO...",
});

const KNIGHT_ACTION_1: readonly string[] = [
  ".........................W......",
  "..............OOOO......GW......",
  "...........OOOUUUUOOO..GGW......",
  "..........OUUUHCCCCHUO.GGT......",
  ".........OUHHOOOOOOOHHOGGT......",
  "........OUHNNULLLLUUNHHOCT......",
  "........OHNLLSSSSSSLLNHOMMO.....",
  ".......OHNLSSSDSSSDSSLNHOSO.....",
  ".......O.OLSWESSSSWESLO.OKAO....",
  ".........OLSEESSSSEESLO.OKAO....",
  ".........OPSSSSSSSSSSPOOKAAO....",
  "..........ODSSSSSSSSDOOKAAO.....",
  "...........OODDDDDDOOOKAAO......",
  "........OOOOOODSSDDOOKKAO.......",
  ".......OKKKAOOCSSCCOAKKO........",
  "......OKKAAKKOAAAAOKKAO.........",
  ".....OBKAAKOOKACCAAKOO..........",
  "....OBBKAAKOOKACCAAKO...........",
  "....OBBBAAKOOKAAAAAKO...........",
  "...OBB..OSSOOOMCCCMOO...........",
  "...OB...OSSOOMMMMMMMO...........",
  "...O....OOOO.OAAAAAO............",
  ".............OKAAAKO............",
  "...........OOKAO.OAKOO..........",
  "...........OAAO...OAAO..........",
  "...........OBBO...OBBO..........",
  "..........OMMMO...OMMMO.........",
  "..........OMBMO...OMBMO.........",
  "..........OBBBO...OBBBO.........",
  "..........OOOOO...OOOOO.........",
  "................................",
  "................................",
];

const KNIGHT_ACTION_2: readonly string[] = patchFrame(KNIGHT_ACTION_1, {
  0: ".......................C.W.C....",
  1: "..............OOOO......WW......",
  2: "...........OOOUUUUOOO..GWW......",
  4: "......C..OUHHOOOOOOOHHOGGT..C...",
  8: ".......O.OLSWESSSSWESLO.OKAO....",
  9: ".........OLSEESSSSEESLO.OKAO....",
});

// ============================================================================
// MAGE (Pointed wizard hat, flowing hair, layered robe, glowing staff & orb)
// ============================================================================
const MAGE_IDLE_0: readonly string[] = [
  "...............OOO..............",
  ".............OOUUUO.............",
  "............OUUHHHNO............",
  "...........OUHHCCCNO............",
  ".........OOUHHHHHHHHNOO.........",
  ".......OOUUHHHHHHHHHHNNOO.......",
  "......OHHHHHHHHHHHHHHHHNNO......",
  ".......OOOHNNULLLLUUNNHOO.......",
  "........OHNLLSSSSSSLLNHO........",
  "........OHOLSWESSSSWESOHO.......",
  "........OHOLSEESSSSEESOHO.......",
  "........OHOPSSSSSSSSSSPOHO......",
  "........OHO.ODSSSSSSDO.OHO......",
  ".........O...OODDDDOO...O.......",
  ".........OOOOOODSSDOOOOO........",
  "........OKKKAOOCSSCOAKKKO..WGW..",
  ".......OKAAKKOAAAAOKKAAKO.WGGGW.",
  "......OKAAKOOKACCAAKOOKAAO.WGTW.",
  "......OAAKO.OKACCAAKO.OAAO..OMO.",
  ".....C.OSSO.OKAAAAAKO.OSSO..OMO.",
  "....WGW.OO..OOMCCCMOO..OO...OMO.",
  ".....W.....OOKAAAAAKOO......OMO.",
  "..........OOKAAACCAAKOO.....OMO.",
  "..........OKAAAKKKAAAKO.....OMO.",
  ".........OKAAAKAAAKAAAKO....OMO.",
  ".........OBBBBKAAAKBBBBO....OMO.",
  "..........OOOOO...OOOOO.....OMO.",
  "...........OMMO...OMMO......OOO.",
  "...........OBBO...OBBO..........",
  "...........OOOO...OOOO..........",
  "................................",
  "................................",
];

const MAGE_IDLE_1: readonly string[] = patchFrame(MAGE_IDLE_0, {
  14: ".........OOOOOODSSDOOOOO...W....",
  15: "........OKKKAOOCSSCOAKKKO.WGGW..",
  16: ".......OKAAKKOAAAAOKKAAKO.GGTG..",
  19: "....WGW.OSSOOKAAAAAKO.OSSO..OMO.",
  20: ".....C..OO..OOMCCCMOO..OO...OMO.",
});

const MAGE_IDLE_2: readonly string[] = patchFrame(MAGE_IDLE_0, {
  9: "........OHOLSSSSSSSSSSOHO.......",
  10: "........OHOLDOOSSSSOODOHO.......",
});

const MAGE_IDLE_3: readonly string[] = patchFrame(MAGE_IDLE_0, {
  14: ".........OOOOOODSSDOOOOO...C....",
  15: "........OKKKAOOCSSCOAKKKO..WWW..",
  16: ".......OKAAKKOAAAAOKKAAKO.WGWGW.",
  19: ".....W.OSSO.OKAAAAAKO.OSSO..OMO.",
  20: "....CWC.OO..OOMCCCMOO..OO...OMO.",
});

const MAGE_ACTION_0: readonly string[] = patchFrame(MAGE_IDLE_0, {
  15: "........OKKKAOOCSSCOAKKKO.......",
  16: ".......OKAAKKOAAAAOKKAAKO..WGW..",
  17: "......OKAAKOOKACCAAKOOKAAOWGGGW.",
  18: "......OAAKO.OKACCAAKO.OAAO.WGTW.",
});

const MAGE_ACTION_1: readonly string[] = [
  "...............OOO........CWC...",
  ".............OOUUUO......WGWGW..",
  "............OUUHHHNO.....WGGGW..",
  "...........OUHHCCCNO......WGTW..",
  ".........OOUHHHHHHHHNOO....OMO..",
  ".......OOUUHHHHHHHHHHNNOO..OMO..",
  "......OHHHHHHHHHHHHHHHHNNO.OMO..",
  ".......OOOHNNULLLLUUNNHOO..OMO..",
  "........OHNLLSSSSSSLLNHO...OMO..",
  "........OHOLSWESSSSWESOHO..OMO..",
  "........OHOLSEESSSSEESOHO..OSO..",
  "........OHOPSSSSSSSSSSPOHO.OKAO.",
  "....C...OHO.ODSSSSSSDO.OHOOKAAO.",
  "...WGW...O...OODDDDOO...OOKAAO..",
  "....C....OOOOOODSSDOOOOOOKAAO...",
  "........OKKKAOOCSSCOAKKKAAKO....",
  ".......OKAAKKOAAAAOKKAAKKOO.....",
  "......OKAAKOOKACCAAKOOOO........",
  "......OSSO..OKACCAAKO...........",
  ".......OO...OKAAAAAKO...........",
  "............OOMCCCMOO...........",
  "...........OOKAAAAAKOO..........",
  "..........OOKAAACCAAKOO.........",
  "..........OKAAAKKKAAAKO.........",
  ".........OKAAAKAAAKAAAKO........",
  ".........OBBBBKAAAKBBBBO........",
  "..........OOOOO...OOOOO.........",
  "...........OMMO...OMMO..........",
  "...........OBBO...OBBO..........",
  "...........OOOO...OOOO..........",
  "................................",
  "................................",
];

const MAGE_ACTION_2: readonly string[] = patchFrame(MAGE_ACTION_1, {
  0: "...............OOO.......CWWWC..",
  1: ".....C.......OOUUUO......WGGGW..",
  2: "....WGW.....OUUHHHNO....CWGWGWC.",
  12: "...CWC..OHO.ODSSSSSSDO.OHOOKAAO.",
  13: "..WGWGW..O...OODDDDOO...OOKAAO..",
});

// ============================================================================
// RANGER (Wind-swept hair, adventurer scarf, leather vest, recurve bow)
// ============================================================================
const RANGER_IDLE_0: readonly string[] = [
  "................................",
  "............OOOOOO..............",
  "..........OOUUUUUUOO............",
  ".........OUUHHHHHHHNOO..........",
  "........OUHHUUUUHHHHNNO.........",
  ".......OUHNNULLLLUUNHHNO........",
  ".......OHNLLSSSSSSLLNHNO........",
  ".......OHOLSSSDSSSDSSOHO........",
  "........OOLSWESSSSWESLO.........",
  ".........OLSEESSSSEESLO.........",
  ".........OPSSSSSSSSSSPO.........",
  "..........ODSSSSSSSSDO..........",
  "...........OODDDDDDOO...........",
  "........OOOOOODSSDDOOOO.........",
  ".......OCCCCOOCSSCCOCCCCO.......",
  "......OKKAAKKOAAAAOKKAAKKO..OO..",
  ".....OBKAAKOOKAMAAAKOOKAAO.OMWO.",
  ".....OBKAAKOOKAAMAAKOOKAAO.OM.W.",
  "....OB.OAAKOOKAAAMAKOOKAAO.OM.W.",
  "....O..OSSO.OOMCCCMOO.OSSOGOMGW.",
  "........OO..OOKAAAKOO..OO..OM.W.",
  "............OKAAAAAKO......OM.W.",
  "............OKAO.OAKO......OMWO.",
  "............OAAO.OAAO.......OO..",
  "............OBBO.OBBO...........",
  "............OBBO.OBBO...........",
  "...........OMMMO.OMMMO..........",
  "...........OMBMO.OMBMO..........",
  "...........OBBBO.OBBBO..........",
  "...........OOOOO.OOOOO..........",
  "................................",
  "................................",
];

const RANGER_IDLE_1: readonly string[] = patchFrame(RANGER_IDLE_0, {
  14: ".......OCCCCOOCSSCCOCCCCO...OO..",
  15: "......OKKAAKKOAAAAOKKAAKKO.OMWO.",
  16: "....OBBKAAKOOKAMAAAKOOKAAO.OM.W.",
  17: "...OBB.KAAKOOKAAMAAKOOKAAO.OM.W.",
  18: "...OB..OAAKOOKAAAMAKOOKAAOGOMGW.",
  19: "...O...OSSO.OOMCCCMOO.OSSO.OM.W.",
  20: "........OO..OOKAAAKOO..OO..OMWO.",
  21: "............OKAAAAAKO.......OO..",
  22: "............OKAO.OAKO...........",
});

const RANGER_IDLE_2: readonly string[] = patchFrame(RANGER_IDLE_0, {
  8: "........OOLSSSSSSSSSSLO.........",
  9: ".........OLDOOSSSSOODLO.........",
});

const RANGER_IDLE_3: readonly string[] = patchFrame(RANGER_IDLE_0, {
  15: "......OKKAAKKOAAAAOKKAAKKO..OO..",
  19: "....O..OSSO.OOMCCCMOO.OSSOWOMWW.",
});

const RANGER_ACTION_0: readonly string[] = patchFrame(RANGER_IDLE_0, {
  16: ".....OBKAAKOOKAMAAAKOOKAAO..OO..",
  17: ".....OBKAAKOOKAAMAAKOOKAAO.OMWO.",
  18: "....OB.OAAKOOKAAAMAKOOKAAO.OM.W.",
  19: "....O..OSSO.OOMCCCMOO.OSSOGOMGW.",
});

const RANGER_ACTION_1: readonly string[] = [
  "................................",
  "............OOOOOO.......OO.....",
  "..........OOUUUUUUOO....OMWO....",
  ".........OUUHHHHHHHNOO..OM.W....",
  "........OUHHUUUUHHHHNNO.OM.W....",
  ".......OUHNNULLLLUUNHHNGOMGW....",
  ".......OHNLLSSSSSSLLNHN.OM.W....",
  ".......OHOLSSSDSSSDSSOH.OMWO....",
  "........OOLSWESSSSWESLO..OO.....",
  ".........OLSEESSSSEESLO.OSO.....",
  ".........OPSSSSSSSSSSPOOKAO.....",
  "..........ODSSSSSSSSDOOKAAO.....",
  "...........OODDDDDDOOOKAAO......",
  "........OOOOOODSSDDOOKKAO.......",
  ".......OCCCCOOCSSCCOCKKO........",
  "......OKKAAKKOAAAAOKKAO.........",
  ".....OBKAAKOOKAMAAAKOO..........",
  "....OBBKAAKOOKAAMAAKO...........",
  "...OBB.OAAKOOKAAAMAKO...........",
  "...OB..OSSO.OOMCCCMOO...........",
  "...O....OO..OOKAAAKOO...........",
  "............OKAAAAAKO...........",
  "...........OOKAO.OAKOO..........",
  "...........OAAO...OAAO..........",
  "...........OBBO...OBBO..........",
  "...........OBBO...OBBO..........",
  "..........OMMMO...OMMMO.........",
  "..........OMBMO...OMBMO.........",
  "..........OBBBO...OBBBO.........",
  "..........OOOOO...OOOOO.........",
  "................................",
  "................................",
];

const RANGER_ACTION_2: readonly string[] = patchFrame(RANGER_ACTION_1, {
  1: "............OOOOOO.....C.OO.C...",
  5: ".......OUHNNULLLLUUNHHNWOMWWC...",
  6: "......COHNLLSSSSSSLLNHN.OM.W....",
});

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
      KNIGHT_IDLE_0,
      KNIGHT_IDLE_2,
      KNIGHT_IDLE_3,
    ],
    action: [KNIGHT_ACTION_0, KNIGHT_ACTION_1, KNIGHT_ACTION_2, KNIGHT_ACTION_1],
  },
  mage: {
    idle: [MAGE_IDLE_0, MAGE_IDLE_1, MAGE_IDLE_0, MAGE_IDLE_2, MAGE_IDLE_3],
    action: [MAGE_ACTION_0, MAGE_ACTION_1, MAGE_ACTION_2, MAGE_ACTION_1],
  },
  ranger: {
    idle: [
      RANGER_IDLE_0,
      RANGER_IDLE_1,
      RANGER_IDLE_0,
      RANGER_IDLE_2,
      RANGER_IDLE_3,
    ],
    action: [RANGER_ACTION_0, RANGER_ACTION_1, RANGER_ACTION_2, RANGER_ACTION_1],
  },
};

const BASE_PALETTE = {
  O: "#231938",
  L: "#FFE5CA",
  S: "#F4BA8E",
  D: "#C67E62",
  P: "#F48CA0",
  E: "#1E1B4B",
  W: "#FFFFFF",
  M: "#8B5A2B",
} as const;

type TierPalette = {
  readonly U: string;
  readonly H: string;
  readonly N: string;
  readonly C: string;
  readonly K: string;
  readonly A: string;
  readonly B: string;
  readonly G: string;
  readonly T: string;
};

const TIER_PALETTES: Record<AvatarClass, Record<AvatarGearTier, TierPalette>> = {
  knight: {
    novice: {
      U: "#93C5FD",
      H: "#3B82F6",
      N: "#1D4ED8",
      C: "#FFD23F",
      K: "#7DD3FC",
      A: "#38BDF8",
      B: "#0369A1",
      G: "#E2E8F0",
      T: "#94A3B8",
    },
    adept: {
      U: "#C4B5FD",
      H: "#7C3AED",
      N: "#4C1D95",
      C: "#FFD23F",
      K: "#A78BFA",
      A: "#6B4DF5",
      B: "#3B1D8E",
      G: "#67E8F9",
      T: "#0284C7",
    },
    champion: {
      U: "#DDD6FE",
      H: "#6B4DF5",
      N: "#3B0764",
      C: "#FFD23F",
      K: "#FEF08A",
      A: "#F59E0B",
      B: "#6B4DF5",
      G: "#67E8F9",
      T: "#0EA5E9",
    },
    hero: {
      U: "#A5B4FC",
      H: "#4338CA",
      N: "#1E1B4B",
      C: "#FDE047",
      K: "#C7D2FE",
      A: "#6366F1",
      B: "#312E81",
      G: "#A5F3FC",
      T: "#06B6D4",
    },
    legend: {
      U: "#FEF08A",
      H: "#F59E0B",
      N: "#B45309",
      C: "#FFFFFF",
      K: "#FDE68A",
      A: "#F59E0B",
      B: "#6B4DF5",
      G: "#FFFFFF",
      T: "#C4B5FD",
    },
  },
  mage: {
    novice: {
      U: "#7DD3FC",
      H: "#0EA5E9",
      N: "#0369A1",
      C: "#FFD23F",
      K: "#BAE6FD",
      A: "#38BDF8",
      B: "#075985",
      G: "#6EE7B7",
      T: "#059669",
    },
    adept: {
      U: "#C4B5FD",
      H: "#6B4DF5",
      N: "#3B0764",
      C: "#FFD23F",
      K: "#A78BFA",
      A: "#7C3AED",
      B: "#4C1D95",
      G: "#67E8F9",
      T: "#0284C7",
    },
    champion: {
      U: "#A78BFA",
      H: "#5B21B6",
      N: "#2E1065",
      C: "#FFD23F",
      K: "#C4B5FD",
      A: "#6B4DF5",
      B: "#B45309",
      G: "#FDA4AF",
      T: "#E11D48",
    },
    hero: {
      U: "#E9D5FF",
      H: "#7E22CE",
      N: "#3B0764",
      C: "#FDE047",
      K: "#D8B4FE",
      A: "#9333EA",
      B: "#4C1D95",
      G: "#7DD3FC",
      T: "#0284C7",
    },
    legend: {
      U: "#C7D2FE",
      H: "#3730A3",
      N: "#1E1B4B",
      C: "#FEF08A",
      K: "#A5B4FC",
      A: "#4F46E5",
      B: "#D97706",
      G: "#F9A8D4",
      T: "#DB2777",
    },
  },
  ranger: {
    novice: {
      U: "#D97706",
      H: "#92400E",
      N: "#451A03",
      C: "#FFD23F",
      K: "#34D399",
      A: "#059669",
      B: "#065F46",
      G: "#A7F3D0",
      T: "#10B981",
    },
    adept: {
      U: "#A7F3D0",
      H: "#059669",
      N: "#064E3B",
      C: "#34D399",
      K: "#10B981",
      A: "#047857",
      B: "#1F2937",
      G: "#67E8F9",
      T: "#0891B2",
    },
    champion: {
      U: "#6EE7B7",
      H: "#047857",
      N: "#064E3B",
      C: "#FFD23F",
      K: "#34D399",
      A: "#059669",
      B: "#B45309",
      G: "#FDE047",
      T: "#D97706",
    },
    hero: {
      U: "#99F6E4",
      H: "#0F766E",
      N: "#134E4A",
      C: "#67E8F9",
      K: "#5EEAD4",
      A: "#0D9488",
      B: "#115E59",
      G: "#FEF08A",
      T: "#CA8A04",
    },
    legend: {
      U: "#FEF08A",
      H: "#047857",
      N: "#022C22",
      C: "#FDE047",
      K: "#6EE7B7",
      A: "#10B981",
      B: "#D97706",
      G: "#A5F3FC",
      T: "#06B6D4",
    },
  },
};

const COSMETIC_PALETTE_OVERRIDES: Readonly<Record<string, TierPalette>> = {
  palette_crimson: {
    U: "#FDA4AF",
    H: "#BE123C",
    N: "#881337",
    C: "#FDE047",
    K: "#FB7185",
    A: "#E11D48",
    B: "#881337",
    G: "#FECDD3",
    T: "#BE123C",
  },
  palette_frost: {
    U: "#BAE6FD",
    H: "#0284C7",
    N: "#075985",
    C: "#E0F2FE",
    K: "#7DD3FC",
    A: "#38BDF8",
    B: "#0369A1",
    G: "#A5F3FC",
    T: "#0891B2",
  },
  palette_solar: {
    U: "#FEF08A",
    H: "#D97706",
    N: "#92400E",
    C: "#FEF9C3",
    K: "#FDE047",
    A: "#F59E0B",
    B: "#B45309",
    G: "#FEF08A",
    T: "#D97706",
  },
  palette_void: {
    U: "#D8B4FE",
    H: "#581C87",
    N: "#1E1B4B",
    C: "#E879F9",
    K: "#A855F7",
    A: "#4C1D95",
    B: "#1E1B4B",
    G: "#E9D5FF",
    T: "#7E22CE",
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
