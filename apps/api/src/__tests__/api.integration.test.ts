import { describe, expect, it } from "bun:test";
import app from "../index";

describe("API routes (auth, sync, account)", () => {
  it("rejects unauthenticated requests to protected sync & account routes", async () => {
    const syncPull = await app.request("/sync/pull");
    expect(syncPull.status).toBe(401);

    const exportRes = await app.request("/account/export");
    expect(exportRes.status).toBe(401);

    const notFound = await app.request("/does-not-exist");
    expect(notFound.status).toBe(404);
    const body = (await notFound.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("runs full auth + idempotent sync + unique-key merge + account lifecycle when PostgreSQL is reachable", async () => {
    const healthDb = await app.request("/health?db=1");
    if (healthDb.status !== 200) {
      // Local PostgreSQL is not running in this environment; skip DB-backed integration assertions.
      return;
    }

    const email = `test-${crypto.randomUUID()}@glimkin.dev`;
    const password = "strong-password-123";

    const regRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceId: "dev-a" }),
    });
    expect(regRes.status).toBe(201);
    const regData = (await regRes.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    // Duplicate email returns 409
    const dupRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceId: "dev-a" }),
    });
    expect(dupRes.status).toBe(409);

    // Refresh rotation
    const refreshRes = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: regData.refreshToken,
        deviceId: "dev-a",
      }),
    });
    expect(refreshRes.status).toBe(200);
    const rotated = (await refreshRes.json()) as { accessToken: string };

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${rotated.accessToken}`,
    };

    const habitId = crypto.randomUUID();
    const logOpId = crypto.randomUUID();
    const t1 = new Date(Date.now() - 5000).toISOString();
    const t2 = new Date(Date.now() - 1000).toISOString();

    // Push habit + log + hero_profile + inventory
    const pushRes = await app.request("/sync/push", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        deviceId: "dev-a",
        ops: [
          {
            opId: crypto.randomUUID(),
            entity: "habit",
            entityId: habitId,
            op: "upsert",
            updatedAt: t1,
            data: {
              name: "Read 20m",
              icon: "book",
              color: "violet",
              type: "duration",
              targetValue: 20,
              scheduleType: "daily",
              sortOrder: 0,
              startDate: "2026-11-23",
            },
          },
          {
            opId: logOpId,
            entity: "habit_log",
            entityId: crypto.randomUUID(),
            op: "upsert",
            updatedAt: t1,
            data: { habitId, logDate: "2026-11-23", value: 10 },
          },
          {
            opId: crypto.randomUUID(),
            entity: "hero_profile",
            entityId: "singleton",
            op: "upsert",
            updatedAt: t1,
            data: {
              avatarClass: "mage",
              equippedPaletteId: "palette_crimson",
            },
          },
          {
            opId: crypto.randomUUID(),
            entity: "user_inventory",
            entityId: crypto.randomUUID(),
            op: "upsert",
            updatedAt: t1,
            data: {
              itemId: "palette_crimson",
              category: "palette",
              costGold: 120,
            },
          },
        ],
      }),
    });
    expect(pushRes.status).toBe(200);
    const pushBody = (await pushRes.json()) as {
      acked: string[];
      rejected: unknown[];
    };
    expect(pushBody.acked).toHaveLength(4);
    expect(pushBody.rejected).toHaveLength(0);

    // Concurrent device logs same (habitId, logDate) with a DIFFERENT entityId -> unique-key merge
    const mergeRes = await app.request("/sync/push", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        deviceId: "dev-b",
        ops: [
          {
            opId: logOpId, // duplicate opId -> idempotent ack
            entity: "habit_log",
            entityId: crypto.randomUUID(),
            op: "upsert",
            updatedAt: t1,
            data: { habitId, logDate: "2026-11-23", value: 10 },
          },
          {
            opId: crypto.randomUUID(),
            entity: "habit_log",
            entityId: crypto.randomUUID(),
            op: "upsert",
            updatedAt: t2,
            data: { habitId, logDate: "2026-11-23", value: 20 },
          },
        ],
      }),
    });
    expect(mergeRes.status).toBe(200);
    const mergeBody = (await mergeRes.json()) as {
      acked: string[];
      rejected: unknown[];
    };
    expect(mergeBody.acked).toHaveLength(2);
    expect(mergeBody.rejected).toHaveLength(0);

    // Pull changes & verify merged value === 20
    const pullRes = await app.request("/sync/pull?cursor=0&limit=500", {
      headers: { Authorization: `Bearer ${rotated.accessToken}` },
    });
    expect(pullRes.status).toBe(200);
    const pullBody = (await pullRes.json()) as {
      changes: { entity: string; data: Record<string, unknown> }[];
      nextCursor: number;
    };
    expect(pullBody.nextCursor).toBeGreaterThan(0);
    const pulledLog = pullBody.changes.find((c) => c.entity === "habit_log");
    expect(pulledLog?.data.value).toBe(20);

    // Export & cleanup delete account
    const expRes = await app.request("/account/export", {
      headers: { Authorization: `Bearer ${rotated.accessToken}` },
    });
    expect(expRes.status).toBe(200);
    const expBody = (await expRes.json()) as {
      habits: unknown[];
      heroProfile: unknown[];
      userInventory: unknown[];
    };
    expect(expBody.habits).toHaveLength(1);
    expect(expBody.heroProfile).toHaveLength(1);
    expect(expBody.userInventory).toHaveLength(1);

    const delRes = await app.request("/account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${rotated.accessToken}` },
    });
    expect(delRes.status).toBe(200);
  });
});
