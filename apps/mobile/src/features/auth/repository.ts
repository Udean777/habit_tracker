import { eq } from "drizzle-orm";
import { appDb, type AppDb } from "@/db/client";
import { syncState } from "@/db/schema";

export async function getLocalDeviceId(db: AppDb = appDb): Promise<string> {
  const rows = await db
    .select({ deviceId: syncState.deviceId })
    .from(syncState)
    .where(eq(syncState.id, "singleton"));
  return rows[0]?.deviceId ?? "mobile-device";
}
