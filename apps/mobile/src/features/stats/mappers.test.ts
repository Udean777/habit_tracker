import { mapLogsToHeatmapCells } from "./mappers";

describe("stats heatmap mappers", () => {
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
