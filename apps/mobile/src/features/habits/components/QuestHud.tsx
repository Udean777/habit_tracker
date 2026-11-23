import { useEffect, useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Coins from "lucide-react-native/icons/coins";
import Flame from "lucide-react-native/icons/flame";
import Shield from "lucide-react-native/icons/shield";
import Trophy from "lucide-react-native/icons/trophy";
import type { HeroLoadout } from "@habit/shared";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
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
  readonly loadout?: HeroLoadout;
  readonly goldBalance?: number;
  readonly availableShields?: number;
  readonly onPressShop?: () => void;
};

export function QuestHud({
  progress,
  reduceMotion,
  loadout,
  goldBalance,
  availableShields,
  onPressShop,
}: QuestHudProps) {
  const { colors } = useTheme();
  const avatarClass = useUiStore((s) => s.avatarClass);
  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(progress, avatarClass, loadout),
    [progress, avatarClass, loadout],
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
    <Card variant="primary" elevated className="mb-4 p-4">
      <View className="flex-row items-center gap-3.5">
        <PixelAvatar
          state={avatarState}
          reduceMotion={reduceMotion}
          triggerKey={progress.completedToday + progress.level * 10}
          size={64}
        />

        <View className="flex-1 gap-1.5">
          <View className="flex-row flex-wrap items-center gap-2">
            <Animated.View style={badgeStyle}>
              <Badge
                label={`LVL ${progress.level}`}
                variant="accent"
                pill
                tabularNums
                className="px-2.5 py-0.5"
                textClassName="text-xs font-extrabold"
                icon={
                  <Trophy
                    size={12}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />
            </Animated.View>

            {progress.comboMultiplier >= 2 ? (
              <Animated.View style={badgeStyle}>
                <Badge
                  label={`${progress.comboMultiplier}x COMBO`}
                  variant="accent"
                  pill
                  tabularNums
                  className="px-2.5 py-0.5"
                  textClassName="text-xs font-extrabold"
                  icon={
                    <Flame
                      size={12}
                      color={colors.accentText}
                      strokeWidth={2.5}
                    />
                  }
                />
              </Animated.View>
            ) : null}
          </View>

          <Text tone="onPrimary" className="text-lg font-extrabold leading-6">
            {avatarState.classTitle}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text tabularNums tone="onPrimary" className="text-xs font-bold">
              {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
            </Text>
            <Text tabularNums tone="onPrimary" className="text-xs font-bold">
              {progress.completedToday}/{progress.scheduledToday} Quests
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3.5">
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

        <Text tone="onPrimary" className="mt-2 text-xs font-semibold">
          {allDone
            ? "All daily quests complete! +25 XP · +15G bonus earned."
            : `${progress.scheduledToday - progress.completedToday} quests left today (+25 XP · +10G each)`}
        </Text>
      </View>

      {onPressShop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Hero Shop"
          onPress={onPressShop}
          style={{
            backgroundColor: colors.primaryPressed,
            borderRadius: radii.button,
          }}
          className="mt-3 min-h-[44px] flex-row items-center justify-between px-3 py-2"
        >
          <View className="flex-row flex-wrap items-center gap-2">
            {goldBalance !== undefined ? (
              <Badge
                label={`${goldBalance} G`}
                variant="accent"
                pill
                tabularNums
                className="px-2.5 py-0.5"
                textClassName="text-xs font-extrabold"
                icon={
                  <Coins
                    size={12}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />
            ) : null}
            {availableShields !== undefined && availableShields > 0 ? (
              <Badge
                label={`${availableShields} Shields`}
                variant="accent"
                pill
                tabularNums
                className="px-2.5 py-0.5"
                textClassName="text-xs font-extrabold"
                icon={
                  <Shield
                    size={12}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />
            ) : null}
          </View>

          <View className="flex-row items-center gap-0.5">
            <Text tone="onPrimary" className="text-xs font-extrabold">
              Hero Shop
            </Text>
            <ChevronRight
              size={15}
              color={colors.primaryText}
              strokeWidth={2.5}
            />
          </View>
        </Pressable>
      ) : null}
    </Card>
  );
}
