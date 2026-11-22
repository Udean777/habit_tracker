import { z } from "zod";
import { outboxEntitySchema, outboxOpTypeSchema } from "./schemas";

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
