import { describe, expect, it } from "bun:test";
import {
  syncHabitLogPayloadSchema,
  syncHabitPayloadSchema,
  syncHeroProfilePayloadSchema,
  syncSettingsPayloadSchema,
  syncStreakFreezePayloadSchema,
  syncUserInventoryPayloadSchema,
} from "@habit/shared";

describe("sync payload Zod schemas", () => {
  it("validates all 6 entity sync payloads cleanly", () => {
    expect(
      syncHabitPayloadSchema.parse({
        name: "Morning Walk",
        icon: "run",
        color: "emerald",
        type: "boolean",
        scheduleType: "daily",
        startDate: "2026-11-23",
      }).name,
    ).toBe("Morning Walk");

    expect(
      syncHabitLogPayloadSchema.parse({
        habitId: "h1",
        logDate: "2026-11-23",
        value: 1,
      }).value,
    ).toBe(1);

    expect(
      syncStreakFreezePayloadSchema.parse({
        habitId: "h1",
        freezeDate: "2026-11-22",
        source: "manual",
      }).source,
    ).toBe("manual");

    expect(
      syncSettingsPayloadSchema.parse({
        theme: "dark",
        hapticsEnabled: 1,
        reduceMotion: "system",
        qualityTier: "auto",
        dayStartOffsetMin: 0,
        backfillWindowDays: 14,
      }).theme,
    ).toBe("dark");

    expect(
      syncHeroProfilePayloadSchema.parse({
        avatarClass: "mage",
        equippedPaletteId: "palette_crimson",
        equippedAuraId: null,
        equippedFrameId: "frame_gold",
      }).avatarClass,
    ).toBe("mage");

    expect(
      syncUserInventoryPayloadSchema.parse({
        itemId: "palette_crimson",
        category: "palette",
        costGold: 120,
      }).costGold,
    ).toBe(120);
  });

  it("rejects malformed payloads", () => {
    expect(() =>
      syncHabitLogPayloadSchema.parse({
        habitId: "h1",
        logDate: "not-a-date",
        value: -5,
      }),
    ).toThrow();

    expect(() =>
      syncUserInventoryPayloadSchema.parse({
        itemId: "",
        category: "unknown",
        costGold: -10,
      }),
    ).toThrow();
  });
});
