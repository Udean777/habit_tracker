import {
  addDays,
  isDayCompleted,
  type HabitType,
  type LocalDate,
} from "@habit/shared";
import type { HabitRecord } from "@/features/habits";
import type { HabitLogRecord } from "@/features/logs";

export type HeatmapCell = {
  readonly index: number;
  readonly date: LocalDate;
  readonly completion: number;
};

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
