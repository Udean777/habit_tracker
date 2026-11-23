import { useEffect, useMemo } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { BlurMask, Canvas, Circle, Group } from "@shopify/react-native-skia";
import { GestureDetector } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  mapTimeOfDayPalette,
  type QualityTier,
  type WorldOrganism,
} from "@/features/world/mappers";
import { worldColors } from "@/theme/tokens";
import { useWorldGestures } from "../hooks/useWorldGestures";
import { AmbientParticle, createParticleSeeds } from "./AmbientParticle";

const CANVAS_HEIGHT = 230;

type LivingWorldCanvasProps = {
  readonly organisms: readonly WorldOrganism[];
  readonly tier: QualityTier;
  readonly reduceMotion: boolean;
  readonly particleBudget: number;
  readonly hapticsEnabled: boolean;
  readonly onCompleteOrganism: (habitId: string) => void;
  readonly onPressOrganism: (habitId: string) => void;
};

export function LivingWorldCanvas({
  organisms,
  tier,
  reduceMotion,
  particleBudget,
  hapticsEnabled,
  onCompleteOrganism,
  onPressOrganism,
}: LivingWorldCanvasProps) {
  const { width } = useWindowDimensions();
  const canvasWidth = Math.max(280, width - 32);
  const palette = mapTimeOfDayPalette(new Date().getHours());
  const clock = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || particleBudget === 0) {
      cancelAnimation(clock);
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(clock);
  }, [clock, reduceMotion, particleBudget]);

  const seeds = useMemo(
    () => createParticleSeeds(particleBudget),
    [particleBudget],
  );

  const {
    gesture,
    holdX,
    holdY,
    holdRingRadius,
    burstRadius,
    burstOpacity,
  } = useWorldGestures({
    organisms,
    canvasWidth,
    canvasHeight: CANVAS_HEIGHT,
    reduceMotion,
    hapticsEnabled,
    onCompleteOrganism,
    onPressOrganism,
  });

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl"
      style={{ backgroundColor: palette.background }}
    >
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width: canvasWidth, height: CANVAS_HEIGHT }}>
          {seeds.map((seed, idx) => (
            <AmbientParticle
              key={idx}
              seed={seed}
              clock={clock}
              width={canvasWidth}
              height={CANVAS_HEIGHT}
              reduceMotion={reduceMotion}
            />
          ))}

          {organisms.map((org) => {
            const cx = org.xRatio * canvasWidth;
            const cy = org.yRatio * CANVAS_HEIGHT;
            return (
              <Group key={org.habitId} opacity={org.opacity}>
                {tier !== "low" && (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={org.glowRadius}
                    color={org.color}
                    opacity={org.completedToday ? 0.28 : 0.16}
                  >
                    <BlurMask blur={16} style="normal" />
                  </Circle>
                )}
                <Circle cx={cx} cy={cy} r={org.baseRadius} color={org.color} />
                {org.completedToday && (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={org.baseRadius + 5}
                    color={org.color}
                    style="stroke"
                    strokeWidth={1.5}
                    opacity={0.75}
                  />
                )}
              </Group>
            );
          })}

          <Circle
            cx={holdX}
            cy={holdY}
            r={holdRingRadius}
            color={palette.accent}
            style="stroke"
            strokeWidth={3}
            opacity={0.9}
          />

          <Circle
            cx={holdX}
            cy={holdY}
            r={burstRadius}
            color={worldColors.glowEmerald}
            style="stroke"
            strokeWidth={2}
            opacity={burstOpacity}
          />
        </Canvas>
      </GestureDetector>

      <View className="flex-row items-center justify-between px-3 py-2">
        <Text className="text-xs text-slate-300">
          {organisms.length === 0
            ? "Your garden is waiting for its first habit"
            : "Hold an organism to complete or undo; tap to inspect"}
        </Text>
        <Text className="text-xs font-medium capitalize text-slate-400">
          {tier}
        </Text>
      </View>
    </View>
  );
}
