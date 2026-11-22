import { getDayOfWeekIso } from "./dates";
import type { HabitType, LocalDate, Schedule } from "./schemas";

export function isScheduledOnDay(
  schedule: Schedule,
  dateStr: LocalDate,
): boolean {
  if (schedule.type === "daily" || schedule.type === "times_per_week") {
    return true;
  }
  const bitmask = schedule.daysBitmask ?? 127;
  const isoDay = getDayOfWeekIso(dateStr);
  return (bitmask & (1 << isoDay)) !== 0;
}

export function isDayCompleted(
  value: number,
  habitType: HabitType,
  targetValue: number | null,
): boolean {
  if (habitType === "boolean") {
    return value >= 1;
  }
  return value >= Math.max(1, targetValue ?? 1);
}
