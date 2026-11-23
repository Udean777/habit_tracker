import { useEffect, useRef } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./Text";

type StreakTickerProps = {
  readonly streak: number;
  readonly reduceMotion: boolean;
};

export function StreakTicker({ streak, reduceMotion }: StreakTickerProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevStreakRef = useRef(streak);

  useEffect(() => {
    if (prevStreakRef.current === streak) return;
    prevStreakRef.current = streak;
    if (reduceMotion) {
      translateY.set(0);
      opacity.set(1);
      return;
    }
    translateY.set(
      withSequence(
        withTiming(-6, { duration: 90 }),
        withTiming(0, { duration: 160 }),
      ),
    );
    opacity.set(
      withSequence(
        withTiming(0.4, { duration: 90 }),
        withTiming(1, { duration: 160 }),
      ),
    );
  }, [streak, reduceMotion, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text variant="caption" tabularNums>
        Streak: {streak}d
      </Text>
    </Animated.View>
  );
}
