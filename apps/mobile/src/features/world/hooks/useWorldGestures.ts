import * as Haptics from "expo-haptics";
import { Gesture } from "react-native-gesture-handler";
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { WorldOrganism } from "@/features/world/mappers";

const HOLD_DURATION_MS = 700;

function findNearestOrganismIndex(
  organisms: readonly WorldOrganism[],
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  maxDistance: number,
): number {
  "worklet";
  let nearest = -1;
  let minDist = maxDistance;
  for (let i = 0; i < organisms.length; i++) {
    const org = organisms[i];
    if (!org) continue;
    const ox = org.xRatio * canvasWidth;
    const oy = org.yRatio * canvasHeight;
    const d = Math.hypot(x - ox, y - oy);
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  }
  return nearest;
}

type UseWorldGesturesParams = {
  readonly organisms: readonly WorldOrganism[];
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly reduceMotion: boolean;
  readonly hapticsEnabled: boolean;
  readonly onCompleteOrganism: (habitId: string) => void;
  readonly onPressOrganism: (habitId: string) => void;
};

export function useWorldGestures({
  organisms,
  canvasWidth,
  canvasHeight,
  reduceMotion,
  hapticsEnabled,
  onCompleteOrganism,
  onPressOrganism,
}: UseWorldGesturesParams) {
  const holdX = useSharedValue(-100);
  const holdY = useSharedValue(-100);
  const holdProgress = useSharedValue(0);
  const burstRadius = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  const activeIndex = useSharedValue(-1);

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
    if (org) onCompleteOrganism(org.habitId);
  }

  function handleTap(index: number) {
    const org = organisms[index];
    if (org) onPressOrganism(org.habitId);
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
      const nearest = findNearestOrganismIndex(
        organisms,
        e.x,
        e.y,
        canvasWidth,
        canvasHeight,
        60,
      );
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
    const nearest = findNearestOrganismIndex(
      organisms,
      e.x,
      e.y,
      canvasWidth,
      canvasHeight,
      52,
    );
    if (nearest !== -1) {
      runOnJS(handleTap)(nearest);
    }
  });

  const holdRingRadius = useDerivedValue(() =>
    holdProgress.value > 0.02 ? 18 + holdProgress.value * 22 : 0,
  );

  return {
    gesture: Gesture.Exclusive(holdGesture, tapGesture),
    holdX,
    holdY,
    holdRingRadius,
    burstRadius,
    burstOpacity,
  };
}
