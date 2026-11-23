import { addDays, diffDays } from "./dates";
import { isDayCompleted, isScheduledOnDay } from "./schedule";
import type {
  AvatarClass,
  HabitIconKey,
  HabitType,
  LocalDate,
  Schedule,
  ShopItemCategory,
} from "./schemas";
import { computeStreak, groupLogsByHabit } from "./streak";

export const GOLD_PER_COMPLETION = 10;
export const GOLD_ALL_DONE_BONUS = 15;
export const GOLD_PER_LEVEL_UP = 25;
export const STREAK_DAYS_PER_EARNED_SHIELD = 7;
export const MAX_EARNED_SHIELDS_PER_HABIT = 3;

export const STREAK_GOLD_MILESTONES: readonly {
  readonly days: number;
  readonly gold: number;
}[] = [
  { days: 7, gold: 30 },
  { days: 14, gold: 60 },
  { days: 30, gold: 150 },
  { days: 100, gold: 400 },
] as const;

export type ShopItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ShopItemCategory;
  readonly costGold: number;
  readonly previewColor: string;
  readonly accentColor: string;
};

export const STREAK_SHIELD_ITEM_ID = "streak_shield" as const;

export const SHOP_CATALOG: readonly ShopItem[] = [
  {
    id: "palette_crimson",
    name: "Crimson Vanguard",
    description: "Ruby-forged armor & scarlet blade tint.",
    category: "palette",
    costGold: 120,
    previewColor: "#E11D48",
    accentColor: "#FDA4AF",
  },
  {
    id: "palette_frost",
    name: "Glacier Mystic",
    description: "Crystalline ice armor with cyan glow.",
    category: "palette",
    costGold: 150,
    previewColor: "#0EA5E9",
    accentColor: "#67E8F9",
  },
  {
    id: "palette_solar",
    name: "Solar Sovereign",
    description: "Sunlit gold armor & radiant trim.",
    category: "palette",
    costGold: 220,
    previewColor: "#F59E0B",
    accentColor: "#FEF08A",
  },
  {
    id: "palette_void",
    name: "Obsidian Phantom",
    description: "Midnight steel with violet neon edge.",
    category: "palette",
    costGold: 300,
    previewColor: "#4C1D95",
    accentColor: "#C084FC",
  },
  {
    id: "aura_ember",
    name: "Ember Sparks",
    description: "Warm floating ember motes behind your hero.",
    category: "aura",
    costGold: 140,
    previewColor: "#F97316",
    accentColor: "#FDBA74",
  },
  {
    id: "aura_arcane",
    name: "Arcane Orbit",
    description: "Shimmering arcane halo ring & cyan sparks.",
    category: "aura",
    costGold: 180,
    previewColor: "#6366F1",
    accentColor: "#38BDF8",
  },
  {
    id: "aura_crown",
    name: "Golden Halo",
    description: "Radiant champion ring & starlight particles.",
    category: "aura",
    costGold: 280,
    previewColor: "#EAB308",
    accentColor: "#FEF08A",
  },
  {
    id: "frame_emerald",
    name: "Emerald Crest",
    description: "Verdant emerald border for your avatar frame.",
    category: "frame",
    costGold: 100,
    previewColor: "#10B981",
    accentColor: "#6EE7B7",
  },
  {
    id: "frame_gold",
    name: "Royal Gilded",
    description: "Polished golden crest frame.",
    category: "frame",
    costGold: 200,
    previewColor: "#F59E0B",
    accentColor: "#FDE047",
  },
  {
    id: "frame_nebula",
    name: "Starlight Border",
    description: "Deep cosmic violet frame with bright rim.",
    category: "frame",
    costGold: 260,
    previewColor: "#8B5CF6",
    accentColor: "#E879F9",
  },
  {
    id: STREAK_SHIELD_ITEM_ID,
    name: "Streak Shield",
    description: "Protects a missed scheduled day so your streak stays alive.",
    category: "consumable",
    costGold: 80,
    previewColor: "#06B6D4",
    accentColor: "#A5F3FC",
  },
] as const;

export function getShopItemById(itemId: string): ShopItem | undefined {
  return SHOP_CATALOG.find((item) => item.id === itemId);
}

export type GamificationHabitInput = {
  readonly id: string;
  readonly icon: HabitIconKey;
  readonly type: HabitType;
  readonly targetValue: number | null;
  readonly schedule: Schedule;
  readonly startDate: LocalDate;
};

export type GamificationLogInput = {
  readonly habitId: string;
  readonly logDate: LocalDate;
  readonly value: number;
  readonly completedAt?: string | null;
};

export type InventoryItemInput = {
  readonly id: string;
  readonly itemId: string;
  readonly category: ShopItemCategory;
  readonly costGold: number;
  readonly deletedAt?: string | null;
};

export type StreakFreezeInput = {
  readonly habitId: string;
  readonly freezeDate: LocalDate;
  readonly deletedAt?: string | null;
};

export type HeroLoadout = {
  readonly avatarClass: AvatarClass;
  readonly equippedPaletteId: string | null;
  readonly equippedAuraId: string | null;
  readonly equippedFrameId: string | null;
};

export const DEFAULT_HERO_LOADOUT: HeroLoadout = {
  avatarClass: "knight",
  equippedPaletteId: null,
  equippedAuraId: null,
  equippedFrameId: null,
};

export type GoldBreakdown = {
  readonly questsGold: number;
  readonly perfectDaysGold: number;
  readonly streakMilestonesGold: number;
  readonly achievementsGold: number;
  readonly levelUpGold: number;
};

export type GoldEconomy = {
  readonly earnedGold: number;
  readonly spentGold: number;
  readonly availableGold: number;
  readonly perfectDaysCount: number;
  readonly breakdown: GoldBreakdown;
};

type GoldEconomyOptions = {
  readonly freezes?: readonly StreakFreezeInput[];
  readonly today?: LocalDate;
  readonly level?: number;
};

function countCompletionsAndPerfectDays(
  habits: readonly GamificationHabitInput[],
  logs: readonly GamificationLogInput[],
): { readonly totalCompletions: number; readonly perfectDaysCount: number } {
  const habitById = new Map(habits.map((h) => [h.id, h]));
  let totalCompletions = 0;
  const completedByDate = new Map<LocalDate, Set<string>>();

  for (const log of logs) {
    const habit = habitById.get(log.habitId);
    if (!habit) continue;
    if (!isDayCompleted(log.value, habit.type, habit.targetValue)) continue;

    totalCompletions += 1;
    const set = completedByDate.get(log.logDate) ?? new Set<string>();
    set.add(habit.id);
    completedByDate.set(log.logDate, set);
  }

  let perfectDaysCount = 0;
  completedByDate.forEach((completedSet, date) => {
    let scheduledCount = 0;
    let doneCount = 0;
    for (const habit of habits) {
      if (diffDays(date, habit.startDate) < 0) continue;
      if (!isScheduledOnDay(habit.schedule, date)) continue;
      scheduledCount += 1;
      if (completedSet.has(habit.id)) doneCount += 1;
    }
    if (scheduledCount > 0 && doneCount === scheduledCount) {
      perfectDaysCount += 1;
    }
  });

  return { totalCompletions, perfectDaysCount };
}

export function computeGoldEconomy(
  habits: readonly GamificationHabitInput[],
  logs: readonly GamificationLogInput[],
  inventory: readonly InventoryItemInput[],
  options?: GoldEconomyOptions,
): GoldEconomy {
  const { totalCompletions, perfectDaysCount } = countCompletionsAndPerfectDays(
    habits,
    logs,
  );

  const questsGold = totalCompletions * GOLD_PER_COMPLETION;
  const perfectDaysGold = perfectDaysCount * GOLD_ALL_DONE_BONUS;

  let streakMilestonesGold = 0;
  let achievementsGold = 0;

  if (options?.today) {
    const freezes = options.freezes ?? [];
    const { logsByHabitId } = groupLogsByHabit(logs);
    const freezesByHabit = new Map<string, LocalDate[]>();
    for (const f of freezes) {
      if (f.deletedAt) continue;
      const list = freezesByHabit.get(f.habitId) ?? [];
      list.push(f.freezeDate);
      freezesByHabit.set(f.habitId, list);
    }

    for (const habit of habits) {
      const stats = computeStreak({
        logs: logsByHabitId.get(habit.id) ?? [],
        freezeDates: freezesByHabit.get(habit.id) ?? [],
        schedule: habit.schedule,
        habitType: habit.type,
        targetValue: habit.targetValue,
        startDate: habit.startDate,
        today: options.today,
      });
      for (const milestone of STREAK_GOLD_MILESTONES) {
        if (stats.bestStreak >= milestone.days) {
          streakMilestonesGold += milestone.gold;
        }
      }
    }

    const achievements = evaluateAchievements(
      habits,
      logs,
      inventory,
      freezes,
      options.today,
    );
    for (const a of achievements) {
      if (a.unlocked) achievementsGold += a.rewardGold;
    }
  }

  const levelUpGold =
    options?.level && options.level > 1
      ? (options.level - 1) * GOLD_PER_LEVEL_UP
      : 0;

  const earnedGold =
    questsGold +
    perfectDaysGold +
    streakMilestonesGold +
    achievementsGold +
    levelUpGold;

  let spentGold = 0;
  for (const item of inventory) {
    if (item.deletedAt) continue;
    spentGold += Math.max(0, item.costGold);
  }

  return {
    earnedGold,
    spentGold,
    availableGold: Math.max(0, earnedGold - spentGold),
    perfectDaysCount,
    breakdown: {
      questsGold,
      perfectDaysGold,
      streakMilestonesGold,
      achievementsGold,
      levelUpGold,
    },
  };
}

export type ShieldInventoryStats = {
  readonly earnedShields: number;
  readonly purchasedShields: number;
  readonly usedShields: number;
  readonly availableShields: number;
};

export function computeAvailableShields(
  habits: readonly GamificationHabitInput[],
  logs: readonly GamificationLogInput[],
  inventory: readonly InventoryItemInput[],
  freezes: readonly StreakFreezeInput[],
  today: LocalDate,
): ShieldInventoryStats {
  const { logsByHabitId } = groupLogsByHabit(logs);
  const freezesByHabit = new Map<string, LocalDate[]>();
  let usedShields = 0;

  for (const f of freezes) {
    if (f.deletedAt) continue;
    usedShields += 1;
    const list = freezesByHabit.get(f.habitId) ?? [];
    list.push(f.freezeDate);
    freezesByHabit.set(f.habitId, list);
  }

  let earnedShields = 0;
  for (const habit of habits) {
    const stats = computeStreak({
      logs: logsByHabitId.get(habit.id) ?? [],
      freezeDates: freezesByHabit.get(habit.id) ?? [],
      schedule: habit.schedule,
      habitType: habit.type,
      targetValue: habit.targetValue,
      startDate: habit.startDate,
      today,
    });
    const habitEarned = Math.min(
      MAX_EARNED_SHIELDS_PER_HABIT,
      Math.floor(stats.bestStreak / STREAK_DAYS_PER_EARNED_SHIELD),
    );
    earnedShields += habitEarned;
  }

  let purchasedShields = 0;
  for (const item of inventory) {
    if (item.deletedAt) continue;
    if (item.itemId === STREAK_SHIELD_ITEM_ID) {
      purchasedShields += 1;
    }
  }

  return {
    earnedShields,
    purchasedShields,
    usedShields,
    availableShields: Math.max(
      0,
      earnedShields + purchasedShields - usedShields,
    ),
  };
}

export type ShieldableMiss = {
  readonly habitId: string;
  readonly missedDate: LocalDate;
  readonly previousStreak: number;
};

export function findShieldableMisses(
  habits: readonly GamificationHabitInput[],
  logs: readonly GamificationLogInput[],
  freezes: readonly StreakFreezeInput[],
  today: LocalDate,
): readonly ShieldableMiss[] {
  const yesterday = addDays(today, -1);
  const { logsByHabitId } = groupLogsByHabit(logs);
  const freezeSetByHabit = new Map<string, Set<LocalDate>>();

  for (const f of freezes) {
    if (f.deletedAt) continue;
    const set = freezeSetByHabit.get(f.habitId) ?? new Set<LocalDate>();
    set.add(f.freezeDate);
    freezeSetByHabit.set(f.habitId, set);
  }

  const misses: ShieldableMiss[] = [];
  for (const habit of habits) {
    if (habit.schedule.type === "times_per_week") continue;
    if (diffDays(yesterday, habit.startDate) < 0) continue;
    if (!isScheduledOnDay(habit.schedule, yesterday)) continue;

    const habitFreezes = freezeSetByHabit.get(habit.id) ?? new Set<LocalDate>();
    if (habitFreezes.has(yesterday)) continue;

    const habitLogs = logsByHabitId.get(habit.id) ?? [];
    const yesterdayLog = habitLogs.find((l) => l.logDate === yesterday);
    if (
      yesterdayLog &&
      isDayCompleted(yesterdayLog.value, habit.type, habit.targetValue)
    ) {
      continue;
    }

    const dayBeforeYesterday = addDays(yesterday, -1);
    const priorStats = computeStreak({
      logs: habitLogs,
      freezeDates: Array.from(habitFreezes),
      schedule: habit.schedule,
      habitType: habit.type,
      targetValue: habit.targetValue,
      startDate: habit.startDate,
      today: dayBeforeYesterday,
    });

    if (priorStats.currentStreak >= 2) {
      misses.push({
        habitId: habit.id,
        missedDate: yesterday,
        previousStreak: priorStats.currentStreak,
      });
    }
  }

  return misses.sort((a, b) => b.previousStreak - a.previousStreak);
}

export type AchievementId =
  | "first_quest"
  | "perfect_day"
  | "streak_7"
  | "streak_30"
  | "century_club"
  | "collector";

export type AchievementStatus = {
  readonly id: AchievementId;
  readonly title: string;
  readonly description: string;
  readonly rewardGold: number;
  readonly current: number;
  readonly target: number;
  readonly unlocked: boolean;
};

export function evaluateAchievements(
  habits: readonly GamificationHabitInput[],
  logs: readonly GamificationLogInput[],
  inventory: readonly InventoryItemInput[],
  freezes: readonly StreakFreezeInput[],
  today: LocalDate,
): readonly AchievementStatus[] {
  const { totalCompletions, perfectDaysCount } = countCompletionsAndPerfectDays(
    habits,
    logs,
  );
  const { logsByHabitId } = groupLogsByHabit(logs);
  const freezesByHabit = new Map<string, LocalDate[]>();
  for (const f of freezes) {
    if (f.deletedAt) continue;
    const list = freezesByHabit.get(f.habitId) ?? [];
    list.push(f.freezeDate);
    freezesByHabit.set(f.habitId, list);
  }

  let maxBestStreak = 0;
  for (const habit of habits) {
    const s = computeStreak({
      logs: logsByHabitId.get(habit.id) ?? [],
      freezeDates: freezesByHabit.get(habit.id) ?? [],
      schedule: habit.schedule,
      habitType: habit.type,
      targetValue: habit.targetValue,
      startDate: habit.startDate,
      today,
    });
    if (s.bestStreak > maxBestStreak) {
      maxBestStreak = s.bestStreak;
    }
  }

  const ownedCosmetics = new Set(
    inventory
      .filter((i) => !i.deletedAt && i.category !== "consumable")
      .map((i) => i.itemId),
  ).size;

  const list: AchievementStatus[] = [
    {
      id: "first_quest",
      title: "First Step",
      description: "Complete your very first habit quest.",
      rewardGold: 25,
      current: Math.min(1, totalCompletions),
      target: 1,
      unlocked: totalCompletions >= 1,
    },
    {
      id: "perfect_day",
      title: "Perfect Day",
      description: "Finish every scheduled quest in a single day.",
      rewardGold: 30,
      current: Math.min(1, perfectDaysCount),
      target: 1,
      unlocked: perfectDaysCount >= 1,
    },
    {
      id: "streak_7",
      title: "Week Warrior",
      description: "Reach a 7-day streak on any habit.",
      rewardGold: 75,
      current: Math.min(7, maxBestStreak),
      target: 7,
      unlocked: maxBestStreak >= 7,
    },
    {
      id: "streak_30",
      title: "Unstoppable",
      description: "Reach a 30-day streak on any habit.",
      rewardGold: 200,
      current: Math.min(30, maxBestStreak),
      target: 30,
      unlocked: maxBestStreak >= 30,
    },
    {
      id: "century_club",
      title: "Century Club",
      description: "Complete 100 total habit quests.",
      rewardGold: 250,
      current: Math.min(100, totalCompletions),
      target: 100,
      unlocked: totalCompletions >= 100,
    },
    {
      id: "collector",
      title: "Wardrobe Collector",
      description: "Unlock 3 avatar cosmetics from the Hero Shop.",
      rewardGold: 50,
      current: Math.min(3, ownedCosmetics),
      target: 3,
      unlocked: ownedCosmetics >= 3,
    },
  ];

  return list;
}
