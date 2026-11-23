import { resolveApiUrl } from "./apiClient";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("hono/client", () => ({
  hc: jest.fn(() => ({})),
}));

describe("resolveApiUrl", () => {
  it("trims whitespace and strips trailing slashes from configured URL", () => {
    expect(
      resolveApiUrl("  https://glimkin-api.hono-backend.workers.dev///  ", false, "android"),
    ).toBe("https://glimkin-api.hono-backend.workers.dev");
  });

  it("falls back to Android emulator loopback in dev when unset", () => {
    expect(resolveApiUrl(undefined, true, "android")).toBe("http://10.0.2.2:3000");
  });

  it("falls back to localhost on non-Android platforms in dev when unset", () => {
    expect(resolveApiUrl("", true, "ios")).toBe("http://localhost:3000");
  });

  it("throws in release builds when EXPO_PUBLIC_API_URL is missing or blank", () => {
    expect(() => resolveApiUrl(undefined, false, "android")).toThrow(
      "EXPO_PUBLIC_API_URL is required in release builds",
    );
    expect(() => resolveApiUrl("   ", false, "ios")).toThrow(
      "EXPO_PUBLIC_API_URL is required in release builds",
    );
  });
});
