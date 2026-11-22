import * as Crypto from "expo-crypto";

function getRandomBytes10(): Uint8Array {
  try {
    return Crypto.getRandomBytes(10);
  } catch {
    // Fallback for Jest unit tests running without the native Expo module.
    const bytes = new Uint8Array(10);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
}

export function createId(): string {
  const ms = Date.now();
  const timeHex = ms.toString(16).padStart(12, "0");
  const rand = getRandomBytes10();

  const b6 = ((rand[0] ?? 0) & 0x0f) | 0x70;
  const b7 = rand[1] ?? 0;
  const b8 = ((rand[2] ?? 0) & 0x3f) | 0x80;

  const hex = (b: number) => b.toString(16).padStart(2, "0");
  const tail = Array.from(rand.slice(3), hex).join("");

  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-${hex(b6)}${hex(b7)}-${hex(b8)}${tail.slice(0, 2)}-${tail.slice(2)}`;
}
