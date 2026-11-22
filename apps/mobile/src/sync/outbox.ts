import type { OutboxEntity, OutboxOpType } from "@habit/shared";
import type { AppDb } from "@/db/client";
import { outbox } from "@/db/schema";
import { createId } from "@/lib/id";

type DbOrTx = Pick<AppDb, "insert">;

export async function enqueueOutbox(
  tx: DbOrTx,
  input: {
    readonly entity: OutboxEntity;
    readonly entityId: string;
    readonly op: OutboxOpType;
    readonly payload: unknown;
    readonly nowIso?: string;
  },
): Promise<void> {
  await tx.insert(outbox).values({
    opId: createId(),
    entity: input.entity,
    entityId: input.entityId,
    op: input.op,
    payload: JSON.stringify(input.payload),
    createdAt: input.nowIso ?? new Date().toISOString(),
    attempts: 0,
    lastError: null,
  });
}
