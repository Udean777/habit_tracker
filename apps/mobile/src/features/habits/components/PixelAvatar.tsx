import { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { Canvas, Group, Rect, RoundedRect } from "@shopify/react-native-skia";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { AvatarVisualState } from "../avatarMapper";

const GRID_SIZE = 16;

type PixelRect = {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly color: string;
};

function parseFrameToRects(
  frame: readonly string[],
  palette: Readonly<Record<string, string>>,
  pixelSize: number,
  offsetX: number,
  offsetY: number,
): readonly PixelRect[] {
  const rects: PixelRect[] = [];
  for (let row = 0; row < frame.length; row++) {
    const line = frame[row] ?? "";
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (!ch || ch === ".") continue;
      const color = palette[ch];
      if (!color) continue;
      rects.push({
        key: `${row}-${col}`,
        x: offsetX + col * pixelSize,
        y: offsetY + row * pixelSize,
        color,
      });
    }
  }
  return rects;
}

const SPARKLE_OFFSETS = [
  { x: 2, y: 3 },
  { x: 13, y: 2 },
  { x: 2, y: 11 },
  { x: 13, y: 10 },
] as const;

type PixelAvatarProps = {
  readonly state: AvatarVisualState;
  readonly reduceMotion: boolean;
  readonly triggerKey?: number;
  readonly size?: number;
};

export function PixelAvatar({
  state,
  reduceMotion,
  size = 64,
}: PixelAvatarProps) {
  const { colors } = useTheme();
  const [frameIdx, setFrameIdx] = useState(0);

  const inset = 5;
  const spriteArea = size - inset * 2;
  const pixelSize = spriteArea / GRID_SIZE;

  const idleFrameRects = useMemo(
    () =>
      state.frames.map((f) =>
        parseFrameToRects(f, state.palette, pixelSize, inset, inset),
      ),
    [state.frames, state.palette, pixelSize],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % state.frames.length);
    }, 420);
    return () => clearInterval(timer);
  }, [reduceMotion, state.frames.length]);

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFrameIdx((prev) => (prev + 1) % state.frames.length);
  }

  const effectiveIdx = reduceMotion ? 0 : frameIdx % idleFrameRects.length;
  const activeRects = idleFrameRects[effectiveIdx] ?? idleFrameRects[0] ?? [];

  const shadowWidth = pixelSize * 7;
  const shadowX = (size - shadowWidth) / 2;
  const shadowY = size - inset - pixelSize * 0.7;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${state.classTitle} pixel avatar`}
      onPress={handlePress}
    >
      <View
        style={{
          width: size + 8,
          height: size + 8,
          borderRadius: radii.card,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor:
            state.mood === "victory" ? colors.accent : colors.border,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Canvas style={{ width: size, height: size }}>
          <Group>
            <RoundedRect
              x={shadowX}
              y={shadowY}
              width={shadowWidth}
              height={pixelSize * 0.9}
              r={pixelSize * 0.45}
              color="rgba(42, 33, 64, 0.16)"
            />

            {activeRects.map((r) => (
              <Rect
                key={r.key}
                x={r.x}
                y={r.y}
                width={pixelSize + 0.35}
                height={pixelSize + 0.35}
                color={r.color}
              />
            ))}

            {SPARKLE_OFFSETS.slice(0, state.sparkleCount).map((sp, idx) => {
              const shift =
                !reduceMotion && (effectiveIdx + idx) % 2 === 0 ? -0.5 : 0;
              return (
                <Rect
                  key={`sp-${idx}`}
                  x={inset + sp.x * pixelSize}
                  y={inset + (sp.y + shift) * pixelSize}
                  width={pixelSize * 0.85}
                  height={pixelSize * 0.85}
                  color={colors.accent}
                />
              );
            })}
          </Group>
        </Canvas>
      </View>
    </Pressable>
  );
}
