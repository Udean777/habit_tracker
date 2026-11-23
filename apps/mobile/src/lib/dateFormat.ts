import { parseLocalDate, type LocalDate } from "@habit/shared";

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

export function parseLocalDateParts(date: LocalDate): {
  readonly year: number;
  readonly weekday: string;
  readonly dayNum: string;
  readonly month: string;
} {
  const { year, month, day } = parseLocalDate(date);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return {
    year,
    weekday: WEEKDAYS[dt.getUTCDay()] ?? "",
    dayNum: String(day),
    month: MONTHS[month - 1] ?? "",
  };
}

export function formatReadableDate(
  date: LocalDate,
  includeYear = false,
): string {
  const { year, weekday, dayNum, month } = parseLocalDateParts(date);
  return includeYear
    ? `${weekday}, ${dayNum} ${month} ${year}`
    : `${weekday}, ${dayNum} ${month}`;
}
