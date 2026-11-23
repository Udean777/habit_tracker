import { z } from "zod";
import {
  avatarClassSchema,
  habitColorKeySchema,
  habitIconKeySchema,
  habitTypeSchema,
  localDateSchema,
  outboxEntitySchema,
  outboxOpTypeSchema,
  qualityTierModeSchema,
  reduceMotionModeSchema,
  scheduleTypeSchema,
  shopItemCategorySchema,
  themeModeSchema,
} from "./schemas";

export const errorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const registerInputSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  deviceId: z.string().min(1).max(128),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = registerInputSchema;
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().min(1).max(128),
});
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export const oauthProviderSchema = z.enum(["google", "github"]);
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

export const oauthExchangeInputSchema = z.object({
  ticket: z.string().min(1),
  deviceId: z.string().min(1).max(128),
});
export type OAuthExchangeInput = z.infer<typeof oauthExchangeInputSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
  }),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const syncOpSchema = z.object({
  opId: z.string().min(1),
  entity: outboxEntitySchema,
  entityId: z.string().min(1),
  op: outboxOpTypeSchema,
  updatedAt: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});
export type SyncOp = z.infer<typeof syncOpSchema>;

export const syncPushRequestSchema = z.object({
  deviceId: z.string().min(1),
  ops: z.array(syncOpSchema).max(200),
});
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;

export const syncRejectedOpSchema = z.object({
  opId: z.string(),
  code: errorCodeSchema,
  message: z.string(),
});
export type SyncRejectedOp = z.infer<typeof syncRejectedOpSchema>;

export const syncPushResponseSchema = z.object({
  acked: z.array(z.string()),
  rejected: z.array(syncRejectedOpSchema),
  serverTime: z.string(),
});
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;

export const syncPullChangeSchema = z.object({
  entity: outboxEntitySchema,
  entityId: z.string(),
  op: outboxOpTypeSchema,
  data: z.record(z.string(), z.unknown()),
  serverSeq: z.number().int(),
});
export type SyncPullChange = z.infer<typeof syncPullChangeSchema>;

export const syncPullResponseSchema = z.object({
  changes: z.array(syncPullChangeSchema),
  nextCursor: z.number().int(),
  hasMore: z.boolean(),
});
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;

export const syncBatchRequestSchema = z.object({
  deviceId: z.string().min(1),
  ops: z.array(syncOpSchema).max(200).default([]),
  cursor: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(500).default(500),
});
export type SyncBatchRequest = z.infer<typeof syncBatchRequestSchema>;

export const syncBatchResponseSchema = z.object({
  acked: z.array(z.string()),
  rejected: z.array(syncRejectedOpSchema),
  serverTime: z.string(),
  changes: z.array(syncPullChangeSchema),
  nextCursor: z.number().int(),
  hasMore: z.boolean(),
});
export type SyncBatchResponse = z.infer<typeof syncBatchResponseSchema>;

export const syncHabitPayloadSchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: habitIconKeySchema.default("check"),
  color: habitColorKeySchema.default("primary"),
  type: habitTypeSchema.default("boolean"),
  targetValue: z.number().int().positive().nullable().optional(),
  scheduleType: scheduleTypeSchema.default("daily"),
  scheduleDays: z.number().int().min(0).max(127).nullable().optional(),
  scheduleTimes: z.number().int().min(1).max(7).nullable().optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).default(0),
  archivedAt: z.string().nullable().optional(),
  startDate: localDateSchema,
  createdAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export const syncHabitLogPayloadSchema = z.object({
  habitId: z.string().min(1),
  logDate: localDateSchema,
  value: z.number().int().min(0),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export const syncStreakFreezePayloadSchema = z.object({
  habitId: z.string().min(1),
  freezeDate: localDateSchema,
  source: z.enum(["earned", "manual"]).default("manual"),
  createdAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export const syncSettingsPayloadSchema = z.object({
  theme: themeModeSchema.default("system"),
  hapticsEnabled: z.union([z.boolean(), z.number().int().min(0).max(1)]).default(1),
  reduceMotion: reduceMotionModeSchema.default("system"),
  qualityTier: qualityTierModeSchema.default("auto"),
  dayStartOffsetMin: z.number().int().min(0).max(720).default(0),
  backfillWindowDays: z.number().int().min(1).max(90).default(14),
});

export const syncHeroProfilePayloadSchema = z.object({
  avatarClass: avatarClassSchema.default("knight"),
  equippedPaletteId: z.string().nullable().optional(),
  equippedAuraId: z.string().nullable().optional(),
  equippedFrameId: z.string().nullable().optional(),
});

export const syncUserInventoryPayloadSchema = z.object({
  itemId: z.string().min(1).max(64),
  category: shopItemCategorySchema,
  costGold: z.number().int().min(0),
  purchasedAt: z.string().optional(),
  createdAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});
