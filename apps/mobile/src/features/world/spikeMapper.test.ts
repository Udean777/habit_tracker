import type { HabitRecord } from "../habits/repository";
import { createId } from "../../lib/id";
import {
  mapHabitsToWorldOrganisms,
  mapLogsToHeatmapCells,
  mapTimeOfDayPalette,
} from "./mappers";

jest.mock("expo-crypto", () => ({
  getRandomBytes: (size: number) => {
    const out = new Uint8Array(size);
    for (let i = 0; i < size; i++) out[i] = (i * 37 + 11) % 256;
    return out;
  },
}));

describe("world visual mappers", () => {
  it("generates valid UUIDv7-formatted client IDs", () => {
    const id = createId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("maps real habits and logs to world organisms", () => {
    const habits: HabitRecord[] = [
      {
        id: "h1",
        name: "Walk",
        icon: "run",
        color: "emerald",
        type: "boolean",
        targetValue: null,
        scheduleType: "daily",
        scheduleDays: null,
        scheduleTimes: null,
        reminderTime: null,
        sortOrder: 0,
        archivedAt: null,
        startDate: "2026-11-20",
        createdAt: "2026-11-20T00:00:00Z",
        updatedAt: "2026-11-20T00:00:00Z",
        deletedAt: null,
      },
    ];

    const organisms = mapHabitsToWorldOrganisms(
      habits,
      [
        {
          id: "l1",
          habitId: "h1",
          logDate: "2026-11-23",
          value: 1,
          completedAt: "2026-11-23T08:00:00Z",
          createdAt: "2026-11-23T08:00:00Z",
          updatedAt: "2026-11-23T08:00:00Z",
          deletedAt: null,
        },
      ],
      "2026-11-23",
    );

    expect(organisms).toHaveLength(1);
    expect(organisms[0]?.completedToday).toBe(true);
    expect(organisms[0]?.currentStreak).toBe(1);
    expect(organisms[0]?.glowRadius).toBeGreaterThan(
      organisms[0]?.baseRadius ?? 0,
    );
  });

  it("maps time of day to distinct palettes", () => {
    expect(mapTimeOfDayPalette(6).background).not.toBe(
      mapTimeOfDayPalette(23).background,
    );
  });

  it("maps logs to 56-day heatmap cells", () => {
    const cells = mapLogsToHeatmapCells(
      [{ logDate: "2026-11-23", value: 4 }],
      "count",
      8,
      "2026-11-23",
      56,
    );
    expect(cells).toHaveLength(56);
    expect(cells[55]?.completion).toBe(0.5);
  });
});
