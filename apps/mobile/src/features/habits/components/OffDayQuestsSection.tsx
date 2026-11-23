import { useState, type ReactNode } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { HabitRecord } from "../repository";

type OffDayQuestsSectionProps = {
  readonly habits: readonly HabitRecord[];
  readonly reduceMotion: boolean;
  readonly renderRow: (habit: HabitRecord) => ReactNode;
};

export function OffDayQuestsSection({
  habits,
  reduceMotion,
  renderRow,
}: OffDayQuestsSectionProps) {
  const { colors } = useTheme();
  const [showOffDays, setShowOffDays] = useState(false);

  if (habits.length === 0) return null;

  return (
    <Animated.View
      layout={
        reduceMotion
          ? undefined
          : LinearTransition.duration(180).easing(Easing.out(Easing.cubic))
      }
      className="mt-2 pb-6"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          showOffDays ? "Hide off-day habits" : "Show off-day habits"
        }
        onPress={() => setShowOffDays((prev) => !prev)}
        style={{
          borderRadius: radii.button,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceMuted,
        }}
        className="mb-2 min-h-[44px] flex-row items-center justify-between px-3"
      >
        <Text variant="caption" className="font-semibold">
          Off-day habits ({habits.length})
        </Text>
        <Text variant="caption" className="font-semibold">
          {showOffDays ? "Hide" : "Show"}
        </Text>
      </Pressable>
      {showOffDays ? (
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeIn.duration(160).easing(Easing.out(Easing.cubic))
          }
          className="gap-3"
        >
          {habits.map((habit) => (
            <Animated.View key={habit.id}>{renderRow(habit)}</Animated.View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
