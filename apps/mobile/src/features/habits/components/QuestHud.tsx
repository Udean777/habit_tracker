import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Flame from "lucide-react-native/icons/flame";
import Trophy from "lucide-react-native/icons/trophy";
import { Text } from "@/components/Text";
import { useUiStore } from "@/stores/uiStore";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { mapQuestProgressToAvatar } from "../avatarMapper";
import type { QuestProgress } from "../questStats";
import { PixelAvatar } from "./PixelAvatar";

type QuestHudProps = {
  readonly progress: QuestProgress;
  readonly reduceMotion: boolean;
};

export function QuestHud({ progress, reduceMotion }: QuestHudProps) {
  const { colors } = useTheme();
  const avatarClass = useUiStore((s) => s.avatarClass);
  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(progress, avatarClass),
    [progress, avatarClass],
  );

  const ratio =
    progress.xpForNextLevel > 0
      ? Math.min(1, progress.xpIntoLevel / progress.xpForNextLevel)
      : 0;

  const barWidth = useSharedValue(ratio);
  const trackWidth = useSharedValue(0);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    barWidth.set(
      reduceMotion
        ? ratio
        : withTiming(ratio, {
            duration: 240,
            easing: Easing.out(Easing.cubic),
          }),
    );
  }, [ratio, reduceMotion, barWidth]);

  useEffect(() => {
    if (reduceMotion || progress.completedToday === 0) return;
    badgeScale.set(
      withSequence(
        withTiming(1.08, { duration: 110, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 130, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
  }, [progress.completedToday, progress.level, reduceMotion, badgeScale]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (barWidth.value - 1) * trackWidth.value }],
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
      <View className="flex-row items-center gap-3.5">
        <PixelAvatar
          state={avatarState}
          reduceMotion={reduceMotion}
          triggerKey={progress.completedToday + progress.level * 10}
          size={60}
        />

        <View className="flex-1">
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
                className="flex-row items-center gap-1 px-2 py-0.5"
              >
                <Trophy size={13} color={colors.textPrimary} strokeWidth={2.5} />
                <Text
                  tabularNums
                  className="text-xs font-extrabold text-[#2A2140]"
                >
                  LVL {progress.level}
                </Text>
              </Animated.View>
              <Text
                numberOfLines={1}
                className="text-sm font-extrabold text-white"
              >
                {avatarState.classTitle}
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
                className="flex-row items-center gap-1 px-2 py-0.5"
              >
                <Flame size={13} color={colors.textPrimary} strokeWidth={2.5} />
                <Text
                  tabularNums
                  className="text-[11px] font-extrabold text-[#2A2140]"
                >
                  {progress.comboMultiplier}x
                </Text>
              </Animated.View>
            ) : null}
          </View>

          <View className="mt-1.5 flex-row items-center justify-between">
            <Text tabularNums className="text-xs font-bold text-white/95">
              {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
            </Text>
            <Text tabularNums className="text-xs font-semibold text-white/85">
              {progress.completedToday}/{progress.scheduledToday} Quests
            </Text>
          </View>

          <View
            onLayout={(e) => {
              trackWidth.set(e.nativeEvent.layout.width);
            }}
            style={{
              height: 10,
              borderRadius: radii.pill,
              backgroundColor: colors.primaryPressed,
              overflow: "hidden",
            }}
            className="mt-1.5"
          >
            <Animated.View
              style={[
                {
                  width: "100%",
                  height: "100%",
                  borderRadius: radii.pill,
                  backgroundColor: colors.accent,
                },
                fillStyle,
              ]}
            />
          </View>

          <Text className="mt-1.5 text-[11px] font-medium text-white/90">
            {allDone
              ? "All daily quests complete! +25 XP bonus earned."
              : `${progress.scheduledToday - progress.completedToday} quests left today (+25 XP each)`}
          </Text>
        </View>
      </View>
    </View>
  );
}
