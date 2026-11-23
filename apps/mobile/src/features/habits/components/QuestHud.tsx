import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import Flame from "lucide-react-native/icons/flame";
import Trophy from "lucide-react-native/icons/trophy";
import { Text } from "@/components/Text";
import { colors, motion, radii } from "@/theme/tokens";
import type { QuestProgress } from "../questStats";

type QuestHudProps = {
  readonly progress: QuestProgress;
  readonly reduceMotion: boolean;
};

export function QuestHud({ progress, reduceMotion }: QuestHudProps) {
  const ratio =
    progress.xpForNextLevel > 0
      ? Math.min(1, progress.xpIntoLevel / progress.xpForNextLevel)
      : 0;

  const barWidth = useSharedValue(ratio);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    barWidth.value = reduceMotion
      ? ratio
      : withSpring(ratio, motion.springs.snappy);
  }, [ratio, reduceMotion, barWidth]);

  useEffect(() => {
    if (reduceMotion || progress.completedToday === 0) return;
    badgeScale.value = withSequence(
      withSpring(1.12, motion.springs.bouncy),
      withSpring(1, motion.springs.snappy),
    );
  }, [progress.completedToday, progress.level, reduceMotion, badgeScale]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(barWidth.value * 100)}%`,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const allDone =
    progress.scheduledToday > 0 &&
    progress.completedToday === progress.scheduledToday;

  return (
    <View
      style={{
        borderRadius: radii.card,
        borderWidth: 2,
        borderBottomWidth: 4,
        borderColor: colors.primaryPressed,
        backgroundColor: colors.primary,
      }}
      className="mb-4 p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Animated.View
            style={[
              {
                borderRadius: radii.badge,
                backgroundColor: colors.accent,
              },
              badgeStyle,
            ]}
            className="flex-row items-center gap-1 px-2.5 py-1"
          >
            <Trophy size={14} color={colors.textPrimary} strokeWidth={2.5} />
            <Text
              tabularNums
              className="text-xs font-extrabold text-[#2A2140]"
            >
              LVL {progress.level}
            </Text>
          </Animated.View>
          <Text tabularNums className="text-sm font-bold text-white">
            {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
          </Text>
        </View>

        {progress.comboMultiplier >= 2 ? (
          <Animated.View
            style={[
              {
                borderRadius: radii.pill,
                backgroundColor: colors.accent,
              },
              badgeStyle,
            ]}
            className="flex-row items-center gap-1 px-2.5 py-1"
          >
            <Flame size={14} color={colors.textPrimary} strokeWidth={2.5} />
            <Text
              tabularNums
              className="text-xs font-extrabold text-[#2A2140]"
            >
              {progress.comboMultiplier}x COMBO
            </Text>
          </Animated.View>
        ) : (
          <Text tabularNums className="text-xs font-semibold text-white/90">
            {progress.completedToday}/{progress.scheduledToday} Quests
          </Text>
        )}
      </View>

      <View
        style={{
          height: 10,
          borderRadius: radii.pill,
          backgroundColor: colors.primaryPressed,
          overflow: "hidden",
        }}
        className="mt-3"
      >
        <Animated.View
          style={[
            {
              height: "100%",
              borderRadius: radii.pill,
              backgroundColor: colors.accent,
            },
            fillStyle,
          ]}
        />
      </View>

      <Text className="mt-2 text-xs font-medium text-white/90">
        {allDone
          ? "All daily quests complete! +25 XP bonus earned."
          : `${progress.scheduledToday - progress.completedToday} quests remaining today (+25 XP each)`}
      </Text>
    </View>
  );
}
