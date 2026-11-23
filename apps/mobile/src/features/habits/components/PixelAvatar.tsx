import { useEffect, useMemo } from "react";
import { Pressable, View } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  Rect,
  RoundedRect,
} from "@shopify/react-native-skia";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { triggerHaptic } from "@/lib/haptics";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { AvatarVisualState } from "../avatarMapper";

const GRID_SIZE = 16;
const FRAME_DURATION_MS = 420;

type PixelRect = {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly color: string;
};

// Merge horizontal same-color runs to minimize Skia Rect nodes per frame.
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
    let col = 0;
    while (col < line.length) {
      const ch = line[col];
      const color = ch && ch !== "." ? palette[ch] : undefined;
      if (!color) {
        col += 1;
        continue;
      }
      let runEnd = col + 1;
      while (runEnd < line.length && line[runEnd] === ch) {
        runEnd += 1;
      }
      rects.push({
        key: `${row}-${col}`,
        x: offsetX + col * pixelSize,
        y: offsetY + row * pixelSize,
        width: (runEnd - col) * pixelSize + 0.35,
        color,
      });
      col = runEnd;
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

type SpriteFrameGroupProps = {
  readonly frameIndex: number;
  readonly frameCount: number;
  readonly rects: readonly PixelRect[];
  readonly pixelSize: number;
  readonly inset: number;
  readonly sparkleCount: number;
  readonly accentColor: string;
  readonly reduceMotion: boolean;
  readonly phase: SharedValue<number>;
};

function SpriteFrameGroup({
  frameIndex,
  frameCount,
  rects,
  pixelSize,
  inset,
  sparkleCount,
  accentColor,
  reduceMotion,
  phase,
}: SpriteFrameGroupProps) {
  const opacity = useDerivedValue(() => {
    if (reduceMotion) return frameIndex === 0 ? 1 : 0;
    const activeIdx = Math.floor(phase.value) % frameCount;
    return activeIdx === frameIndex ? 1 : 0;
  });

  return (
    <Group opacity={opacity}>
      {rects.map((r) => (
        <Rect
          key={r.key}
          x={r.x}
          y={r.y}
          width={r.width}
          height={pixelSize + 0.35}
          color={r.color}
        />
      ))}

      {SPARKLE_OFFSETS.slice(0, sparkleCount).map((sp, idx) => {
        const shift =
          !reduceMotion && (frameIndex + idx) % 2 === 0 ? -0.5 : 0;
        return (
          <Rect
            key={`sp-${idx}`}
            x={inset + sp.x * pixelSize}
            y={inset + (sp.y + shift) * pixelSize}
            width={pixelSize * 0.85}
            height={pixelSize * 0.85}
            color={accentColor}
          />
        );
      })}
    </Group>
  );
}

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
  const frameCount = Math.max(1, state.frames.length);
  const phase = useSharedValue(0);

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
    if (reduceMotion || frameCount <= 1) {
      cancelAnimation(phase);
      phase.set(0);
      return;
    }
    phase.set(0);
    phase.set(
      withRepeat(
        withTiming(frameCount, {
          duration: frameCount * FRAME_DURATION_MS,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(phase);
  }, [reduceMotion, frameCount, phase]);

  function handlePress() {
    triggerHaptic("light");
    if (reduceMotion || frameCount <= 1) return;
    const nextStart = (Math.floor(phase.get()) + 1) % frameCount;
    phase.set(nextStart);
    phase.set(
      withRepeat(
        withTiming(nextStart + frameCount, {
          duration: frameCount * FRAME_DURATION_MS,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }

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
            state.frameBorderColor ??
            (state.mood === "victory" ? colors.accentBorder : colors.border),
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Canvas style={{ width: size, height: size }}>
          <Group>
            {state.auraRingColor ? (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={size * 0.42}
                color={state.auraRingColor}
              />
            ) : null}

            <RoundedRect
              x={shadowX}
              y={shadowY}
              width={shadowWidth}
              height={pixelSize * 0.9}
              r={pixelSize * 0.45}
              color="rgba(42, 33, 64, 0.16)"
            />

            {idleFrameRects.map((rects, idx) => (
              <SpriteFrameGroup
                key={idx}
                frameIndex={idx}
                frameCount={frameCount}
                rects={rects}
                pixelSize={pixelSize}
                inset={inset}
                sparkleCount={state.sparkleCount}
                accentColor={state.auraSparkColor ?? colors.accent}
                reduceMotion={reduceMotion}
                phase={phase}
              />
            ))}
          </Group>
        </Canvas>
      </View>
    </Pressable>
  );
}
