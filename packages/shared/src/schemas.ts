import { z } from "zod";

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type LocalDate = z.infer<typeof localDateSchema>;

export const habitTypeSchema = z.enum(["boolean", "count", "duration"]);
export type HabitType = z.infer<typeof habitTypeSchema>;

export const scheduleTypeSchema = z.enum([
  "daily",
  "weekdays",
  "times_per_week",
]);
export type ScheduleType = z.infer<typeof scheduleTypeSchema>;

export const habitColorKeySchema = z.enum([
  "primary",
  "emerald",
  "violet",
  "amber",
  "cyan",
]);
export type HabitColorKey = z.infer<typeof habitColorKeySchema>;

export const habitIconKeySchema = z.enum([
  "check",
  "book",
  "water",
  "run",
  "code",
  "moon",
  "leaf",
  "flame",
]);
export type HabitIconKey = z.infer<typeof habitIconKeySchema>;

export const scheduleSchema = z.object({
  type: scheduleTypeSchema,
  daysBitmask: z.number().int().min(0).max(127).nullable(),
  timesPerWeek: z.number().int().min(1).max(7).nullable(),
});
export type Schedule = z.infer<typeof scheduleSchema>;

export const createHabitInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  icon: habitIconKeySchema,
  color: habitColorKeySchema,
  type: habitTypeSchema,
  targetValue: z.number().int().positive().nullable(),
  scheduleType: scheduleTypeSchema,
  scheduleDays: z.number().int().min(1).max(127).nullable(),
  scheduleTimes: z.number().int().min(1).max(7).nullable(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  startDate: localDateSchema,
});
export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

export const updateHabitInputSchema = createHabitInputSchema.partial();
export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

export const themeModeSchema = z.enum(["system", "light", "dark"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const reduceMotionModeSchema = z.enum(["system", "on", "off"]);
export type ReduceMotionMode = z.infer<typeof reduceMotionModeSchema>;

export const qualityTierModeSchema = z.enum(["auto", "high", "medium", "low"]);
export type QualityTierMode = z.infer<typeof qualityTierModeSchema>;

export const settingsSchema = z.object({
  theme: themeModeSchema,
  hapticsEnabled: z.boolean(),
  reduceMotion: reduceMotionModeSchema,
  qualityTier: qualityTierModeSchema,
  dayStartOffsetMin: z.number().int().min(0).max(720),
  backfillWindowDays: z.number().int().min(1).max(90),
});
export type Settings = z.infer<typeof settingsSchema>;

export const outboxEntitySchema = z.enum([
  "habit",
  "habit_log",
  "streak_freeze",
  "settings",
]);
export type OutboxEntity = z.infer<typeof outboxEntitySchema>;

export const outboxOpTypeSchema = z.enum(["upsert", "delete"]);
export type OutboxOpType = z.infer<typeof outboxOpTypeSchema>;
