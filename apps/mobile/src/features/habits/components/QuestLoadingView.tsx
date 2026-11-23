import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { triggerHaptic } from "@/lib/haptics";
import { useUiStore } from "@/stores/uiStore";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { mapQuestProgressToAvatar } from "../avatarMapper";
import type { QuestProgress } from "../questStats";
import { PixelAvatar } from "./PixelAvatar";

const LOADING_PROGRESS: QuestProgress = {
  level: 1,
  totalXp: 0,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  completedToday: 0,
  scheduledToday: 1,
  comboMultiplier: 1,
};

type QuestLoadingViewProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly reduceMotion: boolean;
  readonly hapticsEnabled: boolean;
};

export function QuestLoadingView({
  title,
  subtitle,
  reduceMotion,
  hapticsEnabled,
}: QuestLoadingViewProps) {
  const { colors } = useTheme();
  const avatarClass = useUiStore((s) => s.avatarClass);
  const [heroTrigger, setHeroTrigger] = useState(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      pulseOpacity.value = 1;
      return;
    }
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(LOADING_PROGRESS, avatarClass),
    [avatarClass],
  );

  function handleTapHero() {
    triggerHaptic("selection", hapticsEnabled);
    setHeroTrigger((n) => n + 1);
  }

  return (
    <Screen edges={["top", "left", "right"]} className="pt-4">
      <View className="flex-1 justify-center pb-16">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tap your pixel hero while quests load"
          onPress={handleTapHero}
        >
          <Card variant="primary" elevated className="items-center p-5">
            <Badge
              label="LOADING QUESTS"
              variant="accent"
              pill
              className="mb-3 px-2.5 py-0.5"
              textClassName="text-[10px] font-extrabold"
            />
            <PixelAvatar
              state={avatarState}
              reduceMotion={reduceMotion}
              triggerKey={heroTrigger}
              size={84}
            />
            <Text tone="onPrimary" className="mt-3 text-lg font-extrabold">
              {title}
            </Text>
            <Text tone="onPrimary" className="mt-1 text-center text-xs">
              {subtitle}
            </Text>
            <View className="mt-3 flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors.accent} />
              <Text tone="onPrimary" className="text-xs font-bold">
                Tap hero to celebrate while loading
              </Text>
            </View>
          </Card>
        </Pressable>

        {/* Tactile quest row placeholders matching card geometry */}
        <Animated.View style={pulseStyle} className="mt-4 gap-3">
          {[0, 1].map((idx) => (
            <Card key={idx} className="flex-row items-center gap-3 p-3.5">
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.button,
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <View className="flex-1 gap-2">
                <View
                  style={{
                    height: 12,
                    width: idx === 0 ? "62%" : "48%",
                    borderRadius: radii.pill,
                    backgroundColor: colors.surfaceMuted,
                  }}
                />
                <View
                  style={{
                    height: 9,
                    width: "35%",
                    borderRadius: radii.pill,
                    backgroundColor: colors.surfaceMuted,
                  }}
                />
              </View>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radii.button,
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </Card>
          ))}
        </Animated.View>
      </View>
    </Screen>
  );
}
