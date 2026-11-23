import {
  isDayCompleted,
  isScheduledOnDay,
  toHabitSchedule,
  type LocalDate,
} from "@habit/shared";
import type { HabitLogRecord } from "@/features/logs";
import type { HabitRecord } from "./repository";

const XP_PER_COMPLETION = 25;
const XP_ALL_DONE_BONUS = 25;
const BASE_XP_PER_LEVEL = 100;

export type QuestProgress = {
  readonly level: number;
  readonly totalXp: number;
  readonly xpIntoLevel: number;
  readonly xpForNextLevel: number;
  readonly completedToday: number;
  readonly scheduledToday: number;
  readonly comboMultiplier: number;
};

export function computeQuestProgress(
  habits: readonly HabitRecord[],
  logs: readonly HabitLogRecord[],
  selectedDate: LocalDate,
): QuestProgress {
  const habitById = new Map(habits.map((h) => [h.id, h]));

  let totalCompletions = 0;
  let completedToday = 0;
  let scheduledToday = 0;

  const todayLogs = new Map<string, number>();
  for (const log of logs) {
    const habit = habitById.get(log.habitId);
    if (!habit) continue;
    if (isDayCompleted(log.value, habit.type, habit.targetValue)) {
      totalCompletions += 1;
    }
    if (log.logDate === selectedDate) {
      todayLogs.set(log.habitId, log.value);
    }
  }

  for (const habit of habits) {
    if (!isScheduledOnDay(toHabitSchedule(habit), selectedDate)) continue;
    scheduledToday += 1;
    const val = todayLogs.get(habit.id) ?? 0;
    if (isDayCompleted(val, habit.type, habit.targetValue)) {
      completedToday += 1;
    }
  }

  const allDoneBonus =
    scheduledToday > 0 && completedToday === scheduledToday
      ? XP_ALL_DONE_BONUS
      : 0;
  const totalXp = totalCompletions * XP_PER_COMPLETION + allDoneBonus;

  let level = 1;
  let remainingXp = totalXp;
  let xpForNextLevel = BASE_XP_PER_LEVEL * level;
  while (remainingXp >= xpForNextLevel) {
    remainingXp -= xpForNextLevel;
    level += 1;
    xpForNextLevel = BASE_XP_PER_LEVEL * level;
  }

  const xpIntoLevel = remainingXp;
  const comboMultiplier = Math.max(1, completedToday);

  return {
    level,
    totalXp,
    xpIntoLevel,
    xpForNextLevel,
    completedToday,
    scheduledToday,
    comboMultiplier,
  };
}
