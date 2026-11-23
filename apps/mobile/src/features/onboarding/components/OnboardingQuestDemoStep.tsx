import { useEffect, useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Check from "lucide-react-native/icons/check";
import Coins from "lucide-react-native/icons/coins";
import type { AvatarClass } from "@habit/shared";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { HabitIcon } from "@/components/HabitIcon";
import { Text } from "@/components/Text";
import {
  mapQuestProgressToAvatar,
  PixelAvatar,
  type QuestProgress,
} from "@/features/habits";
import { habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type OnboardingQuestDemoStepProps = {
  readonly avatarClass: AvatarClass;
  readonly demoDone: boolean;
  readonly reduceMotion: boolean;
  readonly onToggleDemo: () => void;
};

export function OnboardingQuestDemoStep({
  avatarClass,
  demoDone,
  reduceMotion,
  onToggleDemo,
}: OnboardingQuestDemoStepProps) {
  const { colors } = useTheme();
  const trackWidth = useSharedValue(0);
  const ratio = demoDone ? 0.25 : 0;
  const barProgress = useSharedValue(ratio);

  useEffect(() => {
    barProgress.set(
      reduceMotion
        ? ratio
        : withTiming(ratio, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
          }),
    );
  }, [ratio, reduceMotion, barProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (barProgress.value - 1) * trackWidth.value }],
  }));

  const progress: QuestProgress = useMemo(
    () => ({
      level: 1,
      totalXp: demoDone ? 25 : 0,
      xpIntoLevel: demoDone ? 25 : 0,
      xpForNextLevel: 100,
      completedToday: demoDone ? 1 : 0,
      scheduledToday: 1,
      comboMultiplier: demoDone ? 2 : 1,
    }),
    [demoDone],
  );

  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(progress, avatarClass),
    [progress, avatarClass],
  );

  return (
    <View className="flex-1">
      <Text variant="title">Complete quests, earn XP & Gold</Text>
      <Text variant="body" tone="secondary" className="mt-1.5">
        Try tapping the quest check box below to see how your hero reacts in
        real time.
      </Text>

      <Card variant="primary" className="mt-5 p-4">
        <View className="flex-row items-center gap-3">
          <PixelAvatar
            state={avatarState}
            reduceMotion={reduceMotion}
            triggerKey={demoDone ? 1 : 0}
            size={60}
          />
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between">
              <Text tone="onPrimary" className="text-sm font-extrabold">
                {avatarState.classTitle}
              </Text>
              <Badge
                label={demoDone ? "10 G" : "0 G"}
                variant="accent"
                pill
                tabularNums
                className="px-2 py-0.5"
                textClassName="text-xs font-extrabold"
                icon={
                  <Coins
                    size={11}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />
            </View>
            <Text tone="onPrimary" tabularNums className="text-xs font-bold">
              {demoDone ? "25 / 100 XP (+25 XP)" : "0 / 100 XP"}
            </Text>
            <View
              onLayout={(e) => trackWidth.set(e.nativeEvent.layout.width)}
              style={{
                height: 8,
                borderRadius: radii.pill,
                backgroundColor: colors.primaryPressed,
                overflow: "hidden",
              }}
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
          </View>
        </View>
      </Card>

      <Card
        variant={demoDone ? "muted" : "surface"}
        elevated={!demoDone}
        style={{
          borderColor: demoDone ? colors.primaryTextAccent : colors.border,
        }}
        className="mt-3 p-3.5"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.button,
              backgroundColor: habitAccents.emerald,
              borderWidth: 1,
              borderBottomWidth: 3,
              borderColor: colors.textPrimary,
            }}
            className="items-center justify-center"
          >
            <HabitIcon icon="water" size={20} color={colors.primaryText} />
          </View>

          <View className="flex-1 gap-1">
            <Text variant="heading">Drink a glass of water</Text>
            <View className="flex-row items-center gap-2">
              <Badge
                label={demoDone ? "CLAIMED" : "+25 XP · +10G"}
                variant={demoDone ? "primary" : "accent"}
                pill
                className="px-2 py-0.5"
                textClassName="text-[11px] font-extrabold"
              />
              <Text variant="caption" tabularNums>
                {demoDone ? "Streak: 1d" : "Tap check to try"}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: demoDone }}
            accessibilityLabel="Try completing sample quest"
            onPress={onToggleDemo}
            style={{
              borderRadius: radii.button,
              backgroundColor: demoDone ? colors.primary : colors.background,
              borderWidth: 2,
              borderBottomWidth: 4,
              borderColor: demoDone
                ? colors.primaryPressed
                : colors.borderStrong,
            }}
            className="min-h-[46px] min-w-[46px] items-center justify-center"
          >
            {demoDone ? (
              <Check size={22} color={colors.primaryText} strokeWidth={3} />
            ) : null}
          </Pressable>
        </View>
      </Card>

      <View className="mt-4 gap-1.5">
        <Text variant="label">Three quest types supported</Text>
        <Text variant="caption">
          Check-off (yes/no), Counter (e.g. 8 glasses), and Timer (e.g. 20 min
          reading) — all tracked offline first.
        </Text>
      </View>
    </View>
  );
}
