import type { LocalDate } from "./schemas";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

export function parseLocalDate(dateStr: LocalDate): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
} {
  const parts = dateStr.split("-");
  const year = Number(parts[0] ?? 1970);
  const month = Number(parts[1] ?? 1);
  const day = Number(parts[2] ?? 1);
  return { year, month, day };
}

export function formatUtcDateAsLocalDate(utcDate: Date): LocalDate {
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Shift UTC clock by local timezone and day-start rollover offset before reading calendar date.
export function toLocalDate(
  nowUtc: Date,
  tzOffsetMin: number,
  dayStartOffsetMin = 0,
): LocalDate {
  const shifted = new Date(
    nowUtc.getTime() + (tzOffsetMin - dayStartOffsetMin) * MS_PER_MINUTE,
  );
  return formatUtcDateAsLocalDate(shifted);
}

export function getDeviceLocalDate(
  now = new Date(),
  dayStartOffsetMin = 0,
): LocalDate {
  return toLocalDate(now, -now.getTimezoneOffset(), dayStartOffsetMin);
}

export function addDays(dateStr: LocalDate, deltaDays: number): LocalDate {
  const { year, month, day } = parseLocalDate(dateStr);
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return formatUtcDateAsLocalDate(utc);
}

export function diffDays(a: LocalDate, b: LocalDate): number {
  const pa = parseLocalDate(a);
  const pb = parseLocalDate(b);
  const utcA = Date.UTC(pa.year, pa.month - 1, pa.day);
  const utcB = Date.UTC(pb.year, pb.month - 1, pb.day);
  return Math.round((utcA - utcB) / MS_PER_DAY);
}

// Returns 0..6 for Monday..Sunday to match the weekday bitmask.
export function getDayOfWeekIso(dateStr: LocalDate): number {
  const { year, month, day } = parseLocalDate(dateStr);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (utcDay + 6) % 7;
}

export function getIsoWeekMonday(dateStr: LocalDate): LocalDate {
  return addDays(dateStr, -getDayOfWeekIso(dateStr));
}

export function isWithinBackfillWindow(
  targetDate: LocalDate,
  today: LocalDate,
  windowDays: number,
): boolean {
  const delta = diffDays(today, targetDate);
  return delta >= 0 && delta <= windowDays;
}
