import { describe, expect, it } from "bun:test";
import app from "../index";

describe("GET /health", () => {
  it("returns ok: true", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
