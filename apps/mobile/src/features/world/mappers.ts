import {
  addDays,
  computeStreak,
  isDayCompleted,
  isScheduledOnDay,
  type HabitColorKey,
  type HabitType,
  type LocalDate,
} from "@habit/shared";
import type { HabitRecord } from "@/features/habits/repository";
import type { HabitLogRecord } from "@/features/logs";
import { worldColors } from "@/theme/tokens";

export type QualityTier = "high" | "medium" | "low";

export type WorldOrganism = {
  readonly habitId: string;
  readonly name: string;
  readonly xRatio: number;
  readonly yRatio: number;
  readonly baseRadius: number;
  readonly glowRadius: number;
  readonly opacity: number;
  readonly color: string;
  readonly completedToday: boolean;
  readonly currentStreak: number;
};

export type TimeOfDayPalette = {
  readonly background: string;
  readonly accent: string;
};

export type HeatmapCell = {
  readonly index: number;
  readonly date: LocalDate;
  readonly completion: number;
};

const COLOR_MAP: Record<HabitColorKey, string> = {
  primary: worldColors.glowCyan,
  emerald: worldColors.glowEmerald,
  violet: worldColors.glowViolet,
  amber: worldColors.glowAmber,
  cyan: worldColors.glowCyan,
};

export function mapTimeOfDayPalette(hour: number): TimeOfDayPalette {
  if (hour >= 5 && hour <= 8) {
    return { background: "#0F172A", accent: worldColors.glowAmber };
  }
  if (hour >= 9 && hour <= 16) {
    return { background: "#0B1324", accent: worldColors.glowCyan };
  }
  if (hour >= 17 && hour <= 20) {
    return { background: "#111026", accent: worldColors.glowViolet };
  }
  return { background: worldColors.nightBg, accent: worldColors.glowEmerald };
}

export function mapHabitsToWorldOrganisms(
  habits: readonly HabitRecord[],
  logs: readonly HabitLogRecord[],
  today: LocalDate,
): readonly WorldOrganism[] {
  const logsByHabit = new Map<string, { logDate: LocalDate; value: number }[]>();
  const todayValueByHabit = new Map<string, number>();

  for (const log of logs) {
    const list = logsByHabit.get(log.habitId) ?? [];
    list.push({ logDate: log.logDate, value: log.value });
    logsByHabit.set(log.habitId, list);
    if (log.logDate === today) {
      todayValueByHabit.set(log.habitId, log.value);
    }
  }

  const total = habits.length;
  const cols = total <= 3 ? Math.max(1, total) : total <= 6 ? 3 : 4;
  const rows = Math.max(1, Math.ceil(total / cols));

  return habits.map((habit, index) => {
    const habitLogs = logsByHabit.get(habit.id) ?? [];
    const schedule = {
      type: habit.scheduleType,
      daysBitmask: habit.scheduleDays,
      timesPerWeek: habit.scheduleTimes,
    };
    const streak = computeStreak({
      logs: habitLogs,
      schedule,
      habitType: habit.type,
      targetValue: habit.targetValue,
      startDate: habit.startDate,
      today,
    });

    const completedToday = isDayCompleted(
      todayValueByHabit.get(habit.id) ?? 0,
      habit.type,
      habit.targetValue,
    );

    const yesterday = addDays(today, -1);
    const yesterdayLog = habitLogs.find((l) => l.logDate === yesterday);
    const missedYesterday =
      isScheduledOnDay(schedule, yesterday) &&
      !isDayCompleted(yesterdayLog?.value ?? 0, habit.type, habit.targetValue);

    const streakFactor = Math.min(streak.currentStreak / 30, 1);
    const baseRadius = 15 + streakFactor * 11 + streak.rate30d * 5;
    const glowRadius = completedToday ? baseRadius * 2.1 : baseRadius * 1.4;
    const opacity =
      !completedToday && missedYesterday ? 0.5 : completedToday ? 1 : 0.82;
    const color =
      !completedToday && missedYesterday
        ? worldColors.dimmed
        : COLOR_MAP[habit.color];

    const col = index % cols;
    const row = Math.floor(index / cols);
    const xRatio = (col + 0.5) / cols;
    const yRatio = (row + 0.5) / rows;

    return {
      habitId: habit.id,
      name: habit.name,
      xRatio,
      yRatio,
      baseRadius,
      glowRadius,
      opacity,
      color,
      completedToday,
      currentStreak: streak.currentStreak,
    };
  });
}

export function mapLogsToHeatmapCells(
  logs: readonly { readonly logDate: LocalDate; readonly value: number }[],
  habitType: HabitType,
  targetValue: number | null,
  today: LocalDate,
  daysCount = 56,
): readonly HeatmapCell[] {
  const byDate = new Map<LocalDate, number>();
  for (const log of logs) {
    byDate.set(log.logDate, log.value);
  }

  const target = habitType === "boolean" ? 1 : Math.max(1, targetValue ?? 1);
  return Array.from({ length: daysCount }, (_, index) => {
    const date = addDays(today, -(daysCount - 1 - index));
    const val = byDate.get(date) ?? 0;
    const completion = Math.min(1, Math.max(0, val / target));
    return {
      index,
      date,
      completion: Number(completion.toFixed(2)),
    };
  });
}

export function mapAggregateLogsToHeatmapCells(
  habits: readonly HabitRecord[],
  logs: readonly HabitLogRecord[],
  today: LocalDate,
  daysCount = 56,
): readonly HeatmapCell[] {
  if (habits.length === 0) {
    return Array.from({ length: daysCount }, (_, index) => ({
      index,
      date: addDays(today, -(daysCount - 1 - index)),
      completion: 0,
    }));
  }

  const byDateHabit = new Map<string, number>();
  for (const log of logs) {
    byDateHabit.set(`${log.logDate}:${log.habitId}`, log.value);
  }

  return Array.from({ length: daysCount }, (_, index) => {
    const date = addDays(today, -(daysCount - 1 - index));
    let doneCount = 0;
    for (const habit of habits) {
      const val = byDateHabit.get(`${date}:${habit.id}`) ?? 0;
      if (isDayCompleted(val, habit.type, habit.targetValue)) {
        doneCount++;
      }
    }
    return {
      index,
      date,
      completion: Number((doneCount / habits.length).toFixed(2)),
    };
  });
}
