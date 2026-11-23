import { describe, expect, it } from "vitest";
import {
  addDays,
  computeStreak,
  diffDays,
  groupLogsByHabit,
  isScheduledOnDay,
  isWithinBackfillWindow,
  toHabitSchedule,
  toLocalDate,
} from "../index";

describe("dates and day-start offset", () => {
  it("keeps late-night activity on the previous calendar day when dayStartOffsetMin is 240 (04:00)", () => {
    // 2026-11-22 20:30 UTC == 2026-11-23 03:30 UTC+7
    const utc = new Date("2026-11-22T20:30:00Z");
    expect(toLocalDate(utc, 420, 240)).toBe("2026-11-22");

    // 2026-11-22 21:15 UTC == 2026-11-23 04:15 UTC+7
    const afterRollover = new Date("2026-11-22T21:15:00Z");
    expect(toLocalDate(afterRollover, 420, 240)).toBe("2026-11-23");
  });

  it("handles timezone shifts and DST calendar boundaries cleanly", () => {
    const springForwardUtc = new Date("2026-03-08T08:30:00Z");
    expect(toLocalDate(springForwardUtc, -480, 0)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(diffDays("2026-03-09", "2026-03-08")).toBe(1);
  });

  it("checks backfill window bounds", () => {
    expect(isWithinBackfillWindow("2026-11-09", "2026-11-23", 14)).toBe(true);
    expect(isWithinBackfillWindow("2026-11-08", "2026-11-23", 14)).toBe(false);
    expect(isWithinBackfillWindow("2026-11-24", "2026-11-23", 14)).toBe(false);
  });
});

describe("schedule evaluation", () => {
  it("evaluates weekday bitmask (Mon=1, Wed=4, Fri=16 => 21)", () => {
    const schedule = {
      type: "weekdays" as const,
      daysBitmask: 21,
      timesPerWeek: null,
    };
    expect(isScheduledOnDay(schedule, "2026-11-23")).toBe(true); // Monday
    expect(isScheduledOnDay(schedule, "2026-11-24")).toBe(false); // Tuesday
    expect(isScheduledOnDay(schedule, "2026-11-25")).toBe(true); // Wednesday
    expect(isScheduledOnDay(schedule, "2026-11-28")).toBe(false); // Saturday
  });
});

describe("computeStreak", () => {
  const daily = { type: "daily" as const, daysBitmask: null, timesPerWeek: null };

  it("preserves yesterday's streak when today is still pending", () => {
    const stats = computeStreak({
      logs: [
        { logDate: "2026-11-20", value: 1 },
        { logDate: "2026-11-21", value: 1 },
        { logDate: "2026-11-22", value: 1 },
      ],
      schedule: daily,
      habitType: "boolean",
      targetValue: null,
      startDate: "2026-11-20",
      today: "2026-11-23",
    });

    expect(stats.currentStreak).toBe(3);
    expect(stats.bestStreak).toBe(3);
  });

  it("keeps streak alive when a freeze covers a missed day", () => {
    const stats = computeStreak({
      logs: [
        { logDate: "2026-11-20", value: 1 },
        { logDate: "2026-11-22", value: 1 },
        { logDate: "2026-11-23", value: 1 },
      ],
      freezeDates: ["2026-11-21"],
      schedule: daily,
      habitType: "boolean",
      targetValue: null,
      startDate: "2026-11-20",
      today: "2026-11-23",
    });

    expect(stats.currentStreak).toBe(3);
    expect(stats.bestStreak).toBe(3);
  });

  it("skips unscheduled weekend days without breaking weekday streak", () => {
    // Mon-Fri bitmask = 1+2+4+8+16 = 31
    const weekdays = {
      type: "weekdays" as const,
      daysBitmask: 31,
      timesPerWeek: null,
    };
    const stats = computeStreak({
      logs: [
        { logDate: "2026-11-19", value: 8 }, // Thu
        { logDate: "2026-11-20", value: 8 }, // Fri
        { logDate: "2026-11-23", value: 8 }, // Mon
      ],
      schedule: weekdays,
      habitType: "count",
      targetValue: 8,
      startDate: "2026-11-19",
      today: "2026-11-23",
    });

    expect(stats.currentStreak).toBe(3);
    expect(stats.rate7d).toBe(1);
  });

  it("requires full target for count/duration habits", () => {
    const stats = computeStreak({
      logs: [
        { logDate: "2026-11-21", value: 30 },
        { logDate: "2026-11-22", value: 15 },
        { logDate: "2026-11-23", value: 30 },
      ],
      schedule: daily,
      habitType: "duration",
      targetValue: 30,
      startDate: "2026-11-21",
      today: "2026-11-23",
    });

    expect(stats.currentStreak).toBe(1);
    expect(stats.bestStreak).toBe(1);
  });

  it("evaluates times_per_week across ISO weeks", () => {
    const threePerWeek = {
      type: "times_per_week" as const,
      daysBitmask: null,
      timesPerWeek: 3,
    };
    const stats = computeStreak({
      logs: [
        { logDate: "2026-11-16", value: 1 },
        { logDate: "2026-11-18", value: 1 },
        { logDate: "2026-11-20", value: 1 },
        { logDate: "2026-11-23", value: 1 },
      ],
      schedule: threePerWeek,
      habitType: "boolean",
      targetValue: null,
      startDate: "2026-11-16",
      today: "2026-11-23",
    });

    expect(stats.currentStreak).toBe(4);
    expect(stats.bestStreak).toBe(4);
  });

  it("maps habit record fields to schedule and groups logs by habitId", () => {
    const schedule = toHabitSchedule({
      scheduleType: "weekdays",
      scheduleDays: 21,
      scheduleTimes: null,
    });
    expect(schedule).toEqual({
      type: "weekdays",
      daysBitmask: 21,
      timesPerWeek: null,
    });

    const grouped = groupLogsByHabit(
      [
        { habitId: "h1", logDate: "2026-11-22", value: 1 },
        { habitId: "h1", logDate: "2026-11-23", value: 2 },
        { habitId: "h2", logDate: "2026-11-23", value: 5 },
      ],
      "2026-11-23",
    );

    expect(grouped.logsByHabitId.get("h1")).toHaveLength(2);
    expect(grouped.valueOnTargetDateByHabitId.get("h1")).toBe(2);
    expect(grouped.valueOnTargetDateByHabitId.get("h2")).toBe(5);
  });
});
