import { describe, expect, it } from "bun:test";
import app from "../index";

describe("GET /health and edge guards", () => {
  it("returns ok: true with Cache-Control header without touching DB", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=30");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rejects unauthenticated POST /sync/batch with 401 without touching DB", async () => {
    const res = await app.request("/sync/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: "dev-1", ops: [], cursor: 0, limit: 100 }),
    });
    expect(res.status).toBe(401);
  });
});
