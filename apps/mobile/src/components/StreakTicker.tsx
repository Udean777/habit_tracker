import { useEffect } from "react";
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

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    translateY.value = withSequence(
      withTiming(-6, { duration: 90 }),
      withTiming(0, { duration: 160 }),
    );
    opacity.value = withSequence(
      withTiming(0.4, { duration: 90 }),
      withTiming(1, { duration: 160 }),
    );
  }, [streak, reduceMotion, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text variant="caption">Streak: {streak}d</Text>
    </Animated.View>
  );
}
