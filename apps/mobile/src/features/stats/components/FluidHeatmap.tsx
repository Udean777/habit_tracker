import { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  RoundedRect,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import type { HeatmapCell, QualityTier } from "@/features/world/mappers";
import { worldColors } from "@/theme/tokens";

const COLS = 8;
const ROWS = 7;
const CANVAS_HEIGHT = 220;

type FluidHeatmapProps = {
  readonly cells: readonly HeatmapCell[];
  readonly tier: QualityTier;
  readonly hapticsEnabled: boolean;
};

export function FluidHeatmap({
  cells,
  tier,
  hapticsEnabled,
}: FluidHeatmapProps) {
  const { width } = useWindowDimensions();
  const canvasWidth = Math.max(260, width - 32);
  const cellW = canvasWidth / COLS;
  const cellH = CANVAS_HEIGHT / ROWS;

  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  const lensX = useSharedValue(-100);
  const lensY = useSharedValue(-100);
  const lastIndex = useSharedValue(-1);

  function selectCell(index: number) {
    const cell = cells[index];
    if (!cell) return;
    setSelectedCell(cell);
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  }

  const scrubGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      lensX.value = e.x;
      lensY.value = e.y;
    })
    .onUpdate((e) => {
      lensX.value = Math.max(0, Math.min(canvasWidth, e.x));
      lensY.value = Math.max(0, Math.min(CANVAS_HEIGHT, e.y));

      const col = Math.min(COLS - 1, Math.max(0, Math.floor(e.x / cellW)));
      const row = Math.min(ROWS - 1, Math.max(0, Math.floor(e.y / cellH)));
      const idx = row * COLS + col;
      if (idx !== lastIndex.value) {
        lastIndex.value = idx;
        runOnJS(selectCell)(idx);
      }
    })
    .onFinalize(() => {
      lastIndex.value = -1;
    });

  const lensOpacity = useDerivedValue(() => (lensX.value >= 0 ? 0.9 : 0));

  return (
    <View className="mb-4">
      <GestureDetector gesture={scrubGesture}>
        <Canvas
          style={{
            width: canvasWidth,
            height: CANVAS_HEIGHT,
            backgroundColor: worldColors.nightSurface,
            borderRadius: 16,
          }}
        >
          <Group>
            {cells.map((cell, idx) => {
              const col = idx % COLS;
              const row = Math.floor(idx / COLS);
              const cx = col * cellW + cellW / 2;
              const cy = row * cellH + cellH / 2;

              if (tier === "low") {
                return (
                  <RoundedRect
                    key={cell.date}
                    x={col * cellW + 4}
                    y={row * cellH + 4}
                    width={cellW - 8}
                    height={cellH - 8}
                    r={6}
                    color={worldColors.glowEmerald}
                    opacity={0.12 + cell.completion * 0.88}
                  />
                );
              }

              const r = 8 + cell.completion * 14;
              return (
                <Circle
                  key={cell.date}
                  cx={cx}
                  cy={cy}
                  r={r}
                  color={
                    cell.completion >= 0.75
                      ? worldColors.glowEmerald
                      : cell.completion > 0
                        ? worldColors.glowCyan
                        : worldColors.dimmed
                  }
                  opacity={cell.completion > 0 ? 0.3 + cell.completion * 0.65 : 0.14}
                >
                  <BlurMask blur={tier === "high" ? 13 : 8} style="normal" />
                </Circle>
              );
            })}
          </Group>

          <Circle
            cx={lensX}
            cy={lensY}
            r={18}
            color={worldColors.glowAmber}
            style="stroke"
            strokeWidth={2}
            opacity={lensOpacity}
          />
        </Canvas>
      </GestureDetector>

      <View className="mt-2 rounded-lg bg-neutral-100 px-3 py-2">
        <Text className="text-xs font-medium text-neutral-700">
          {selectedCell
            ? `${selectedCell.date}: ${Math.round(selectedCell.completion * 100)}% completed`
            : "Scrub across the field to inspect any of the last 56 days"}
        </Text>
      </View>
    </View>
  );
}
