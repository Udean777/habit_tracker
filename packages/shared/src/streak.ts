import { addDays, diffDays, getIsoWeekMonday } from "./dates";
import { isDayCompleted, isScheduledOnDay } from "./schedule";
import type { HabitType, LocalDate, Schedule } from "./schemas";

export type DayLogEntry = {
  readonly logDate: LocalDate;
  readonly value: number;
};

export function groupLogsByHabit(
  logs: readonly {
    readonly habitId: string;
    readonly logDate: LocalDate;
    readonly value: number;
  }[],
  targetDate?: LocalDate,
): {
  readonly logsByHabitId: ReadonlyMap<string, readonly DayLogEntry[]>;
  readonly valueOnTargetDateByHabitId: ReadonlyMap<string, number>;
} {
  const logsByHabitId = new Map<string, DayLogEntry[]>();
  const valueOnTargetDateByHabitId = new Map<string, number>();

  for (const log of logs) {
    const list = logsByHabitId.get(log.habitId) ?? [];
    list.push({ logDate: log.logDate, value: log.value });
    logsByHabitId.set(log.habitId, list);
    if (targetDate !== undefined && log.logDate === targetDate) {
      valueOnTargetDateByHabitId.set(log.habitId, log.value);
    }
  }

  return { logsByHabitId, valueOnTargetDateByHabitId };
}

export type StreakStats = {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly rate7d: number;
  readonly rate30d: number;
  readonly rate90d: number;
};

type ComputeStreakParams = {
  readonly logs: readonly DayLogEntry[];
  readonly freezeDates?: readonly LocalDate[];
  readonly schedule: Schedule;
  readonly habitType: HabitType;
  readonly targetValue: number | null;
  readonly startDate: LocalDate;
  readonly today: LocalDate;
};

function roundRate(ratio: number): number {
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100) / 100;
}

function computeTimesPerWeekStreak(
  logMap: ReadonlyMap<LocalDate, number>,
  freezeSet: ReadonlySet<LocalDate>,
  schedule: Schedule,
  habitType: HabitType,
  targetValue: number | null,
  earliest: LocalDate,
  today: LocalDate,
): { currentStreak: number; bestStreak: number } {
  const target = Math.max(1, schedule.timesPerWeek ?? 1);
  const firstMonday = getIsoWeekMonday(earliest);
  const currentMonday = getIsoWeekMonday(today);

  let running = 0;
  let best = 0;
  let weekStart = firstMonday;

  while (diffDays(currentMonday, weekStart) >= 0) {
    let satisfied = 0;
    let freezes = 0;
    for (let offset = 0; offset < 7; offset++) {
      const d = addDays(weekStart, offset);
      if (diffDays(today, d) < 0) break;
      if (isDayCompleted(logMap.get(d) ?? 0, habitType, targetValue)) {
        satisfied++;
      } else if (freezeSet.has(d)) {
        freezes++;
      }
    }

    const isCurrentWeek = weekStart === currentMonday;
    if (satisfied + freezes >= target) {
      running += satisfied;
      if (running > best) best = running;
    } else if (isCurrentWeek) {
      // Current week is still open, so keep prior streak and include completed days so far.
      running += satisfied;
      if (running > best) best = running;
    } else {
      running = 0;
    }

    weekStart = addDays(weekStart, 7);
  }

  return { currentStreak: running, bestStreak: best };
}

export function computeStreak(params: ComputeStreakParams): StreakStats {
  const {
    logs,
    freezeDates = [],
    schedule,
    habitType,
    targetValue,
    startDate,
    today,
  } = params;

  const logMap = new Map<LocalDate, number>();
  for (const entry of logs) {
    logMap.set(entry.logDate, entry.value);
  }
  const freezeSet = new Set<LocalDate>(freezeDates);

  let earliest = diffDays(today, startDate) >= 0 ? startDate : today;
  for (const entry of logs) {
    if (diffDays(earliest, entry.logDate) > 0) {
      earliest = entry.logDate;
    }
  }

  let currentStreak = 0;
  let bestStreak = 0;

  if (schedule.type === "times_per_week") {
    const weekly = computeTimesPerWeekStreak(
      logMap,
      freezeSet,
      schedule,
      habitType,
      targetValue,
      earliest,
      today,
    );
    currentStreak = weekly.currentStreak;
    bestStreak = weekly.bestStreak;
  } else {
    let running = 0;
    const totalDays = diffDays(today, earliest);
    for (let i = 0; i <= totalDays; i++) {
      const d = addDays(earliest, i);
      if (!isScheduledOnDay(schedule, d)) {
        continue;
      }
      const value = logMap.get(d) ?? 0;
      if (isDayCompleted(value, habitType, targetValue)) {
        running++;
        if (running > bestStreak) bestStreak = running;
      } else if (freezeSet.has(d)) {
        continue;
      } else if (d !== today) {
        running = 0;
      }
    }
    currentStreak = running;
  }

  function computeWindowRate(windowDays: number): number {
    const windowStart = addDays(today, -(windowDays - 1));
    const effectiveStart =
      diffDays(startDate, windowStart) > 0 ? startDate : windowStart;
    if (diffDays(today, effectiveStart) < 0) {
      return 0;
    }

    const span = diffDays(today, effectiveStart) + 1;
    let completed = 0;
    let scheduled = 0;
    for (let i = 0; i < span; i++) {
      const d = addDays(effectiveStart, i);
      const isDone = isDayCompleted(
        logMap.get(d) ?? 0,
        habitType,
        targetValue,
      );
      if (schedule.type === "times_per_week") {
        if (isDone) completed++;
      } else if (isScheduledOnDay(schedule, d)) {
        scheduled++;
        if (isDone) completed++;
      }
    }

    if (schedule.type === "times_per_week") {
      const target = Math.max(1, schedule.timesPerWeek ?? 1);
      const expected = (span / 7) * target;
      return expected <= 0 ? 0 : roundRate(completed / expected);
    }

    return scheduled === 0 ? 0 : roundRate(completed / scheduled);
  }

  return {
    currentStreak,
    bestStreak,
    rate7d: computeWindowRate(7),
    rate30d: computeWindowRate(30),
    rate90d: computeWindowRate(90),
  };
}
