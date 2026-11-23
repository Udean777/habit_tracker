import { describe, expect, it } from "vitest";
import {
  computeAvailableShields,
  computeGoldEconomy,
  evaluateAchievements,
  findShieldableMisses,
  GOLD_ALL_DONE_BONUS,
  GOLD_PER_COMPLETION,
  STREAK_SHIELD_ITEM_ID,
  type GamificationHabitInput,
  type GamificationLogInput,
} from "../gamification";

const dailyHabit: GamificationHabitInput = {
  id: "h1",
  icon: "run",
  type: "boolean",
  targetValue: null,
  schedule: { type: "daily", daysBitmask: null, timesPerWeek: null },
  startDate: "2026-11-01",
};

const secondDailyHabit: GamificationHabitInput = {
  id: "h2",
  icon: "book",
  type: "count",
  targetValue: 10,
  schedule: { type: "daily", daysBitmask: null, timesPerWeek: null },
  startDate: "2026-11-01",
};

describe("gamification domain", () => {
  it("computes earned, spent, and available gold deterministically", () => {
    const logs: GamificationLogInput[] = [
      { habitId: "h1", logDate: "2026-11-01", value: 1 },
      { habitId: "h2", logDate: "2026-11-01", value: 10 },
      { habitId: "h1", logDate: "2026-11-02", value: 1 },
    ];
    const inventory = [
      {
        id: "inv1",
        itemId: "frame_emerald",
        category: "frame" as const,
        costGold: 20,
      },
      {
        id: "inv2",
        itemId: "palette_crimson",
        category: "palette" as const,
        costGold: 120,
        deletedAt: "2026-11-02T10:00:00.000Z",
      },
    ];

    const economy = computeGoldEconomy(
      [dailyHabit, secondDailyHabit],
      logs,
      inventory,
    );

    // 3 completions * 10 + 1 perfect day * 15 = 45 earned; 20 spent (deleted ignored)
    expect(economy.perfectDaysCount).toBe(1);
    expect(economy.earnedGold).toBe(
      3 * GOLD_PER_COMPLETION + GOLD_ALL_DONE_BONUS,
    );
    expect(economy.spentGold).toBe(20);
    expect(economy.availableGold).toBe(25);
  });

  it("computes earned, purchased, used, and available streak shields", () => {
    const logs: GamificationLogInput[] = Array.from({ length: 7 }, (_, i) => ({
      habitId: "h1",
      logDate: `2026-11-0${i + 1}`,
      value: 1,
    }));
    const inventory = [
      {
        id: "inv-shield-1",
        itemId: STREAK_SHIELD_ITEM_ID,
        category: "consumable" as const,
        costGold: 80,
      },
    ];
    const freezes = [{ habitId: "h1", freezeDate: "2026-11-08" }];

    const shields = computeAvailableShields(
      [dailyHabit],
      logs,
      inventory,
      freezes,
      "2026-11-09",
    );

    expect(shields.earnedShields).toBe(1);
    expect(shields.purchasedShields).toBe(1);
    expect(shields.usedShields).toBe(1);
    expect(shields.availableShields).toBe(1);
  });

  it("detects shieldable yesterday misses only when prior streak >= 2", () => {
    const logs: GamificationLogInput[] = [
      { habitId: "h1", logDate: "2026-11-01", value: 1 },
      { habitId: "h1", logDate: "2026-11-02", value: 1 },
      // missed 2026-11-03 (yesterday)
    ];

    const misses = findShieldableMisses(
      [dailyHabit],
      logs,
      [],
      "2026-11-04",
    );
    expect(misses).toHaveLength(1);
    expect(misses[0]).toEqual({
      habitId: "h1",
      missedDate: "2026-11-03",
      previousStreak: 2,
    });

    // Once shielded, it should no longer appear as shieldable
    const afterFreeze = findShieldableMisses(
      [dailyHabit],
      logs,
      [{ habitId: "h1", freezeDate: "2026-11-03" }],
      "2026-11-04",
    );
    expect(afterFreeze).toHaveLength(0);
  });

  it("evaluates achievements accurately", () => {
    const logs: GamificationLogInput[] = Array.from({ length: 7 }, (_, i) => ({
      habitId: "h1",
      logDate: `2026-11-0${i + 1}`,
      value: 1,
    }));
    const inventory = [
      { id: "i1", itemId: "palette_crimson", category: "palette" as const, costGold: 120 },
      { id: "i2", itemId: "aura_ember", category: "aura" as const, costGold: 140 },
      { id: "i3", itemId: "frame_emerald", category: "frame" as const, costGold: 100 },
    ];

    const achievements = evaluateAchievements(
      [dailyHabit],
      logs,
      inventory,
      [],
      "2026-11-07",
    );
    const byId = new Map(achievements.map((a) => [a.id, a]));

    expect(byId.get("first_quest")?.unlocked).toBe(true);
    expect(byId.get("perfect_day")?.unlocked).toBe(true);
    expect(byId.get("streak_7")?.unlocked).toBe(true);
    expect(byId.get("streak_30")?.unlocked).toBe(false);
    expect(byId.get("collector")?.unlocked).toBe(true);
  });
});
