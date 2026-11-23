import type { LocalDate } from "@habit/shared";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatReadableDate(date: LocalDate, includeYear = false): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  const weekday = WEEKDAYS[dt.getUTCDay()] ?? "";
  const month = MONTHS[(m ?? 1) - 1] ?? "";
  const day = String(d ?? 1);
  return includeYear
    ? `${weekday}, ${day} ${month} ${y}`
    : `${weekday}, ${day} ${month}`;
}
