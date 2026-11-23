import { describe, expect, it } from "bun:test";
import { hashPassword, verifyPassword } from "../lib/password";

describe("PBKDF2-SHA256 password hashing (Workers-portable)", () => {
  it("hashes with random salt and verifies matching passwords", async () => {
    const hashA = await hashPassword("secret-pass-123");
    const hashB = await hashPassword("secret-pass-123");

    expect(hashA).toStartWith("pbkdf2_sha256$");
    expect(hashA).not.toBe(hashB);
    expect(await verifyPassword("secret-pass-123", hashA)).toBe(true);
    expect(await verifyPassword("wrong-password", hashA)).toBe(false);
    expect(await verifyPassword("secret-pass-123", "malformed")).toBe(false);
  });
});
