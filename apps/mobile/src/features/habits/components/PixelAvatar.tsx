import { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { Canvas, Group, Rect } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radii } from "@/theme/tokens";
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
        x: col * pixelSize,
        y: row * pixelSize,
        color,
      });
    }
  }
  return rects;
}

const SPARKLE_OFFSETS = [
  { x: 1, y: 2 },
  { x: 14, y: 1 },
  { x: 1, y: 12 },
  { x: 14, y: 11 },
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
  triggerKey = 0,
  size = 64,
}: PixelAvatarProps) {
  const [useAlt, setUseAlt] = useState(false);
  const jumpY = useSharedValue(0);

  const pixelSize = size / GRID_SIZE;

  const primaryRects = useMemo(
    () => parseFrameToRects(state.primaryFrame, state.palette, pixelSize),
    [state.primaryFrame, state.palette, pixelSize],
  );

  const altRects = useMemo(
    () => parseFrameToRects(state.altFrame, state.palette, pixelSize),
    [state.altFrame, state.palette, pixelSize],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setUseAlt((prev) => !prev);
    }, 550);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || triggerKey === 0) return;
    jumpY.set(
      withSequence(
        withTiming(-6, { duration: 110, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 140, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
  }, [triggerKey, reduceMotion, jumpY]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: jumpY.value }],
  }));

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!reduceMotion) {
      jumpY.set(
        withSequence(
          withTiming(-6, { duration: 110, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 140, easing: Easing.inOut(Easing.cubic) }),
        ),
      );
    }
    setUseAlt((prev) => !prev);
  }

  const showAlt = !reduceMotion && useAlt;
  const activeRects = showAlt ? altRects : primaryRects;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${state.classTitle} pixel avatar. Tap to animate`}
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
          overflow: "hidden",
        }}
      >
        <Animated.View style={containerAnimatedStyle}>
          <Canvas style={{ width: size, height: size }}>
            <Group>
              {activeRects.map((r) => (
                <Rect
                  key={r.key}
                  x={r.x}
                  y={r.y}
                  width={pixelSize + 0.3}
                  height={pixelSize + 0.3}
                  color={r.color}
                />
              ))}
              {SPARKLE_OFFSETS.slice(0, state.sparkleCount).map((sp, idx) => {
                const shift = showAlt && idx % 2 === 0 ? -1 : 0;
                return (
                  <Rect
                    key={`sp-${idx}`}
                    x={sp.x * pixelSize}
                    y={(sp.y + shift) * pixelSize}
                    width={pixelSize}
                    height={pixelSize}
                    color={colors.accent}
                  />
                );
              })}
            </Group>
          </Canvas>
        </Animated.View>
      </View>
    </Pressable>
  );
}
