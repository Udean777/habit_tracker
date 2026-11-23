import {
  computeBackoffMs,
  isTokenExpiringSoon,
  shouldSkipAutoPull,
} from "./syncEngine";

jest.mock("expo-crypto", () => ({
  getRandomBytes: (size: number) => new Uint8Array(size),
}));

jest.mock("@/db/client", () => ({
  appDb: {},
}));

jest.mock("@/lib/apiClient", () => ({
  apiClient: {},
  clearAuthTokens: jest.fn(),
  getAuthTokens: jest.fn(),
  saveAuthTokens: jest.fn(),
}));

function makeUnsignedJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.sig`;
}

describe("syncEngine quota helpers", () => {
  it("detects tokens expiring within the proactive refresh buffer", () => {
    const nowMs = 1_700_000_000_000;
    const nowSec = Math.floor(nowMs / 1000);

    const fresh = makeUnsignedJwt({ sub: "u1", exp: nowSec + 300 });
    const expiringSoon = makeUnsignedJwt({ sub: "u1", exp: nowSec + 30 });
    const expired = makeUnsignedJwt({ sub: "u1", exp: nowSec - 10 });

    expect(isTokenExpiringSoon(fresh, nowMs, 60)).toBe(false);
    expect(isTokenExpiringSoon(expiringSoon, nowMs, 60)).toBe(true);
    expect(isTokenExpiringSoon(expired, nowMs, 60)).toBe(true);
    expect(isTokenExpiringSoon("not-a-jwt", nowMs, 60)).toBe(false);
  });

  it("applies exponential backoff capped at 5 minutes", () => {
    expect(computeBackoffMs(0)).toBe(0);
    expect(computeBackoffMs(1, 0)).toBe(30_000);
    expect(computeBackoffMs(2, 0)).toBe(60_000);
    expect(computeBackoffMs(3, 0)).toBe(120_000);
    expect(computeBackoffMs(4, 0)).toBe(240_000);
    expect(computeBackoffMs(5, 0)).toBe(300_000);
    expect(computeBackoffMs(10, 0)).toBe(300_000);
  });

  it("skips automatic pulls inside the 5-minute cooldown window", () => {
    const nowMs = 1_700_000_500_000;
    expect(shouldSkipAutoPull(null, nowMs)).toBe(false);
    expect(shouldSkipAutoPull(nowMs - 60_000, nowMs)).toBe(true);
    expect(shouldSkipAutoPull(nowMs - 5 * 60_000, nowMs)).toBe(false);
  });
});
