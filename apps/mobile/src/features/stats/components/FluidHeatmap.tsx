import { useState } from "react";
import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/Text";
import type { HeatmapCell, QualityTier } from "@/features/world/mappers";
import { formatReadableDate } from "@/lib/dateFormat";
import { elevation, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type FluidHeatmapProps = {
  readonly cells: readonly HeatmapCell[];
  readonly tier: QualityTier;
  readonly hapticsEnabled: boolean;
};

export function FluidHeatmap({
  cells,
  hapticsEnabled,
}: FluidHeatmapProps) {
  const { colors } = useTheme();
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  const lastDate = cells[cells.length - 1]?.date ?? "2026-01-01";
  const [yearStr, monthStr] = lastDate.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthPrefix = `${yearStr}-${monthStr}-`;

  const cellByDate = new Map(cells.map((c) => [c.date, c]));
  const monthCells: HeatmapCell[] = Array.from(
    { length: daysInMonth },
    (_, idx) => {
      const day = String(idx + 1).padStart(2, "0");
      const date = `${monthPrefix}${day}` as HeatmapCell["date"];
      return cellByDate.get(date) ?? { index: idx, date, completion: 0 };
    },
  );

  function handleSelect(cell: HeatmapCell) {
    setSelectedCell(cell);
    if (hapticsEnabled) {
      void Haptics.selectionAsync().catch(() => {});
    }
  }

  return (
    <View
      style={[
        {
          borderRadius: radii.card,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        elevation.card,
      ]}
      className="mb-4 p-4"
    >
      <View className="flex-row flex-wrap gap-1.5">
        {monthCells.map((cell) => {
          const isSelected = selectedCell?.date === cell.date;
          const completion = Number.isFinite(cell.completion)
            ? cell.completion
            : 0;
          const cellBg =
            completion >= 1
              ? colors.primary
              : completion > 0
                ? colors.accent
                : colors.background;
          const cellBorder = isSelected
            ? colors.textPrimary
            : completion >= 1
              ? colors.primaryPressed
              : completion > 0
                ? colors.accent
                : colors.border;

          return (
            <Pressable
              key={cell.date}
              accessibilityRole="button"
              accessibilityLabel={`${cell.date}: ${Math.round(completion * 100)}% completed`}
              onPress={() => handleSelect(cell)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                backgroundColor: cellBg,
                borderWidth: isSelected ? 2 : 1,
                borderColor: cellBorder,
              }}
            />
          );
        })}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text variant="caption" tabularNums>
          {selectedCell
            ? `${formatReadableDate(selectedCell.date, true)}: ${Math.round((Number.isFinite(selectedCell.completion) ? selectedCell.completion : 0) * 100)}% completed`
            : "Tap any day to inspect"}
        </Text>
        <View className="flex-row items-center gap-2">
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: colors.accent,
            }}
          />
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </View>
    </View>
  );
}
