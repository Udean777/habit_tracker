import { useEffect, useMemo } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import * as Haptics from "expo-haptics";
import { BlurMask, Canvas, Circle, Group } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  mapTimeOfDayPalette,
  type QualityTier,
  type WorldOrganism,
} from "@/features/world/mappers";
import { worldColors } from "@/theme/tokens";

const HOLD_DURATION_MS = 700;
const CANVAS_HEIGHT = 230;

type ParticleSeed = {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly speed: number;
  readonly phase: number;
};

function createParticleSeeds(count: number): readonly ParticleSeed[] {
  return Array.from({ length: count }, (_, i) => ({
    x: ((i * 73) % 100) / 100,
    y: ((i * 41) % 100) / 100,
    r: 1.4 + (i % 3) * 0.7,
    speed: 0.4 + (i % 5) * 0.15,
    phase: (i * 0.7) % (Math.PI * 2),
  }));
}

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
  const holdX = useSharedValue(-100);
  const holdY = useSharedValue(-100);
  const holdProgress = useSharedValue(0);
  const burstRadius = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  const activeIndex = useSharedValue(-1);

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

  function triggerHaptic(kind: "light" | "medium" | "heavy" | "success") {
    if (!hapticsEnabled) return;
    if (kind === "light") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (kind === "medium") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (kind === "heavy") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function handleComplete(index: number) {
    const org = organisms[index];
    if (!org) return;
    onCompleteOrganism(org.habitId);
  }

  function handleTap(index: number) {
    const org = organisms[index];
    if (!org) return;
    onPressOrganism(org.habitId);
  }

  // Emit escalating haptic ticks at 25%, 50%, and 75% charge thresholds.
  useAnimatedReaction(
    () => Math.floor(holdProgress.value * 4),
    (step, prevStep) => {
      if (step > (prevStep ?? 0) && activeIndex.value !== -1) {
        if (step === 1) runOnJS(triggerHaptic)("light");
        else if (step === 2) runOnJS(triggerHaptic)("medium");
        else if (step === 3) runOnJS(triggerHaptic)("heavy");
      }
    },
  );

  const holdGesture = Gesture.LongPress()
    .minDuration(reduceMotion ? 150 : HOLD_DURATION_MS)
    .onBegin((e) => {
      holdX.value = e.x;
      holdY.value = e.y;

      let nearest = -1;
      let minDist = 60;
      for (let i = 0; i < organisms.length; i++) {
        const org = organisms[i];
        if (!org) continue;
        const ox = org.xRatio * canvasWidth;
        const oy = org.yRatio * CANVAS_HEIGHT;
        const d = Math.hypot(e.x - ox, e.y - oy);
        if (d < minDist) {
          minDist = d;
          nearest = i;
        }
      }
      activeIndex.value = nearest;
      if (nearest === -1) return;

      runOnJS(triggerHaptic)("light");
      holdProgress.value = 0;
      holdProgress.value = withTiming(1, {
        duration: reduceMotion ? 150 : HOLD_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    })
    .onStart(() => {
      if (activeIndex.value === -1) return;
      runOnJS(triggerHaptic)("success");
      runOnJS(handleComplete)(activeIndex.value);

      if (!reduceMotion) {
        burstRadius.value = 14;
        burstOpacity.value = 0.85;
        burstRadius.value = withTiming(92, { duration: 380 });
        burstOpacity.value = withTiming(0, { duration: 380 });
      }
    })
    .onFinalize(() => {
      holdProgress.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    let nearest = -1;
    let minDist = 52;
    for (let i = 0; i < organisms.length; i++) {
      const org = organisms[i];
      if (!org) continue;
      const ox = org.xRatio * canvasWidth;
      const oy = org.yRatio * CANVAS_HEIGHT;
      const d = Math.hypot(e.x - ox, e.y - oy);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    if (nearest !== -1) {
      runOnJS(handleTap)(nearest);
    }
  });

  const composedGesture = Gesture.Exclusive(holdGesture, tapGesture);

  const holdRingRadius = useDerivedValue(() =>
    holdProgress.value > 0.02 ? 18 + holdProgress.value * 22 : 0,
  );

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl"
      style={{ backgroundColor: palette.background }}
    >
      <GestureDetector gesture={composedGesture}>
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

function AmbientParticle({
  seed,
  clock,
  width,
  height,
  reduceMotion,
}: {
  readonly seed: ParticleSeed;
  readonly clock: { value: number };
  readonly width: number;
  readonly height: number;
  readonly reduceMotion: boolean;
}) {
  const cx = useDerivedValue(() => {
    if (reduceMotion) return seed.x * width;
    return seed.x * width + Math.sin(clock.value * seed.speed + seed.phase) * 10;
  });
  const cy = useDerivedValue(() => {
    if (reduceMotion) return seed.y * height;
    return (
      seed.y * height + Math.cos(clock.value * seed.speed + seed.phase) * 10
    );
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={seed.r}
      color={worldColors.particle}
      opacity={0.32}
    />
  );
}
