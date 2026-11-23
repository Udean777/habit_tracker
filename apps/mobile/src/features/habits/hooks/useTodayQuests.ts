import { useCallback, useMemo } from "react";
import {
  addDays,
  isDayCompleted,
  isScheduledOnDay,
  type LocalDate,
} from "@habit/shared";
import type { HabitLogRecord } from "@/features/logs";
import type { HabitRecord } from "../repository";

export function useTodayQuests(
  activeHabits: readonly HabitRecord[],
  logs: readonly HabitLogRecord[],
  selectedDate: LocalDate,
  effectiveToday: LocalDate,
  backfillWindowDays: number,
) {
  const dateStrip = useMemo(() => {
    const pastCount = Math.min(backfillWindowDays, 3);
    const total = pastCount + 1 + 3;
    return Array.from({ length: total }, (_, idx) =>
      addDays(effectiveToday, idx - pastCount),
    );
  }, [effectiveToday, backfillWindowDays]);

  const logsByHabitId = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      if (log.logDate === selectedDate) {
        map.set(log.habitId, log.value);
      }
    }
    return map;
  }, [logs, selectedDate]);

  const allLogsByHabitId = useMemo(() => {
    const map = new Map<string, { logDate: LocalDate; value: number }[]>();
    for (const log of logs) {
      const list = map.get(log.habitId) ?? [];
      list.push({ logDate: log.logDate, value: log.value });
      map.set(log.habitId, list);
    }
    return map;
  }, [logs]);

  const { scheduledHabits, offDayHabits } = useMemo(() => {
    const scheduled: HabitRecord[] = [];
    const offDay: HabitRecord[] = [];
    for (const h of activeHabits) {
      const isSched = isScheduledOnDay(
        {
          type: h.scheduleType,
          daysBitmask: h.scheduleDays,
          timesPerWeek: h.scheduleTimes,
        },
        selectedDate,
      );
      if (isSched) scheduled.push(h);
      else offDay.push(h);
    }
    return { scheduledHabits: scheduled, offDayHabits: offDay };
  }, [activeHabits, selectedDate]);

  const logValueByDateHabit = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      map.set(`${log.logDate}:${log.habitId}`, log.value);
    }
    return map;
  }, [logs]);

  const isDateFullyCompleted = useCallback(
    (date: LocalDate): boolean => {
      if (activeHabits.length === 0) return false;
      let scheduledCount = 0;
      for (const h of activeHabits) {
        const scheduled = isScheduledOnDay(
          {
            type: h.scheduleType,
            daysBitmask: h.scheduleDays,
            timesPerWeek: h.scheduleTimes,
          },
          date,
        );
        if (!scheduled) continue;
        scheduledCount += 1;
        const val = logValueByDateHabit.get(`${date}:${h.id}`) ?? 0;
        if (!isDayCompleted(val, h.type, h.targetValue)) return false;
      }
      return scheduledCount > 0;
    },
    [activeHabits, logValueByDateHabit],
  );

  return {
    dateStrip,
    logsByHabitId,
    allLogsByHabitId,
    scheduledHabits,
    offDayHabits,
    isDateFullyCompleted,
  };
}
