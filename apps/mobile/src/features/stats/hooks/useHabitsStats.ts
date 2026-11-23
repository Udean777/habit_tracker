import { useMemo } from "react";
import { computeStreak, isDayCompleted, type LocalDate } from "@habit/shared";
import { computeQuestProgress, type HabitRecord } from "@/features/habits";
import type { HabitLogRecord } from "@/features/logs";
import { mapAggregateLogsToHeatmapCells } from "../mappers";

export function useHabitsStats(
  activeHabits: readonly HabitRecord[],
  logs: readonly HabitLogRecord[],
  effectiveToday: LocalDate,
) {
  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );

  const aggregateCells = useMemo(
    () => mapAggregateLogsToHeatmapCells(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );

  const habitStats = useMemo(() => {
    const logsByHabit = new Map<
      string,
      { logDate: LocalDate; value: number }[]
    >();
    const todayValueByHabit = new Map<string, number>();

    for (const log of logs) {
      const list = logsByHabit.get(log.habitId) ?? [];
      list.push({ logDate: log.logDate, value: log.value });
      logsByHabit.set(log.habitId, list);
      if (log.logDate === effectiveToday) {
        todayValueByHabit.set(log.habitId, log.value);
      }
    }

    return activeHabits.map((habit) => {
      const stats = computeStreak({
        logs: logsByHabit.get(habit.id) ?? [],
        schedule: {
          type: habit.scheduleType,
          daysBitmask: habit.scheduleDays,
          timesPerWeek: habit.scheduleTimes,
        },
        habitType: habit.type,
        targetValue: habit.targetValue,
        startDate: habit.startDate,
        today: effectiveToday,
      });
      const completedToday = isDayCompleted(
        todayValueByHabit.get(habit.id) ?? 0,
        habit.type,
        habit.targetValue,
      );
      return { habit, stats, completedToday };
    });
  }, [activeHabits, logs, effectiveToday]);

  const completedTodayCount = habitStats.filter((s) => s.completedToday).length;
  const avg30d =
    habitStats.length === 0
      ? 0
      : Math.round(
          (habitStats.reduce((sum, s) => sum + s.stats.rate30d, 0) /
            habitStats.length) *
            100,
        );

  return {
    questProgress,
    aggregateCells,
    habitStats,
    completedTodayCount,
    avg30d,
  };
}
