import { and, eq } from "drizzle-orm";
import type { OutboxEntity, OutboxOpType } from "@habit/shared";
import type { AppDb } from "@/db/client";
import { outbox } from "@/db/schema";
import { createId } from "@/lib/id";

type DbOrTx = Pick<AppDb, "select" | "insert" | "update">;

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
  const serializedPayload = JSON.stringify(input.payload);
  const timestamp = input.nowIso ?? new Date().toISOString();

  // Coalesce repeated edits to the same unsent (entity, entityId) row
  // so rapid local updates only send one op to the server.
  const existing = await tx
    .select({ opId: outbox.opId })
    .from(outbox)
    .where(
      and(
        eq(outbox.entity, input.entity),
        eq(outbox.entityId, input.entityId),
        eq(outbox.attempts, 0),
      ),
    )
    .limit(1);

  const pending = existing[0];
  if (pending) {
    await tx
      .update(outbox)
      .set({
        op: input.op,
        payload: serializedPayload,
        createdAt: timestamp,
      })
      .where(eq(outbox.opId, pending.opId));
    return;
  }

  await tx.insert(outbox).values({
    opId: createId(),
    entity: input.entity,
    entityId: input.entityId,
    op: input.op,
    payload: serializedPayload,
    createdAt: timestamp,
    attempts: 0,
    lastError: null,
  });
}
