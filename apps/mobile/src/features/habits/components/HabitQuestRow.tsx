import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Check from "lucide-react-native/icons/check";
import {
  computeStreak,
  isDayCompleted,
  isScheduledOnDay,
  type LocalDate,
} from "@habit/shared";
import { HabitIcon } from "@/components/HabitIcon";
import { StreakTicker } from "@/components/StreakTicker";
import { Text } from "@/components/Text";
import { elevation, habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { HabitRecord } from "../repository";

type HabitQuestRowProps = {
  readonly habit: HabitRecord;
  readonly currentValue: number;
  readonly habitLogs: readonly { readonly logDate: LocalDate; readonly value: number }[];
  readonly selectedDate: LocalDate;
  readonly effectiveToday: LocalDate;
  readonly hapticsEnabled: boolean;
  readonly reduceMotion: boolean;
  readonly onLogValue: (habitId: string, logDate: LocalDate, value: number) => Promise<void>;
};

export function HabitQuestRow({
  habit,
  currentValue,
  habitLogs,
  selectedDate,
  effectiveToday,
  hapticsEnabled,
  reduceMotion,
  onLogValue,
}: HabitQuestRowProps) {
  const { colors } = useTheme();
  const isDone = isDayCompleted(currentValue, habit.type, habit.targetValue);
  const schedule = {
    type: habit.scheduleType,
    daysBitmask: habit.scheduleDays,
    timesPerWeek: habit.scheduleTimes,
  };
  const scheduled = isScheduledOnDay(schedule, selectedDate);
  const streak = computeStreak({
    logs: habitLogs,
    schedule,
    habitType: habit.type,
    targetValue: habit.targetValue,
    startDate: habit.startDate,
    today: effectiveToday,
  });

  const unitSuffix = habit.type === "duration" ? " min" : "";
  const progressLabel =
    habit.type === "boolean"
      ? isDone
        ? "Completed"
        : "Tap to complete"
      : `${currentValue} / ${habit.targetValue ?? 1}${unitSuffix}`;

  const step = habit.type === "duration" ? 5 : 1;

  return (
    <View
      style={[
        {
          borderRadius: radii.card,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: isDone ? colors.primary : colors.border,
          backgroundColor: isDone ? colors.surfaceMuted : colors.surface,
          opacity: isDone ? 0.9 : 1,
        },
        !isDone && scheduled ? elevation.card : undefined,
      ]}
      className="mb-3 p-4"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open details for ${habit.name}`}
          onPress={() => router.push(`/habit/${habit.id}`)}
          className="min-h-[44px] flex-1 justify-center"
        >
          <View className="flex-row items-center gap-3">
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.button,
                backgroundColor: habitAccents[habit.color],
              }}
              className="items-center justify-center"
            >
              <HabitIcon icon={habit.icon} size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text variant="heading" numberOfLines={1}>
                {habit.name}
              </Text>
              <View className="mt-0.5 flex-row items-center gap-1.5">
                <View
                  style={{
                    borderRadius: radii.badge,
                    backgroundColor: isDone ? colors.primary : colors.accentBg,
                  }}
                  className="px-1.5 py-0.5"
                >
                  <Text
                    className={`text-[10px] font-extrabold ${
                      isDone ? "text-white" : "text-[#2A2140]"
                    }`}
                  >
                    {isDone ? "CLAIMED" : "+25 XP"}
                  </Text>
                </View>
                <Text variant="caption" tabularNums numberOfLines={1} className="shrink">
                  {progressLabel}
                </Text>
                <StreakTicker
                  streak={streak.currentStreak}
                  reduceMotion={reduceMotion}
                />
                {!scheduled ? <Text variant="caption">(off)</Text> : null}
              </View>
            </View>
          </View>
        </Pressable>

        <View className="flex-row items-center gap-1">
          {habit.type === "boolean" ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone }}
              accessibilityLabel={
                isDone ? `Uncheck ${habit.name}` : `Complete ${habit.name}`
              }
              onPress={() => {
                if (!isDone && hapticsEnabled) {
                  void Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Medium,
                  ).catch(() => {});
                }
                void onLogValue(habit.id, selectedDate, isDone ? 0 : 1);
              }}
              style={{
                borderRadius: radii.button,
                backgroundColor: isDone ? colors.primary : colors.surface,
                borderWidth: 2,
                borderBottomWidth: 4,
                borderColor: isDone ? colors.primaryPressed : colors.borderStrong,
              }}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              {isDone ? (
                <Check size={22} color="#FFFFFF" strokeWidth={3} />
              ) : null}
            </Pressable>
          ) : isDone ? (
            <View
              style={{
                borderRadius: radii.button,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderBottomWidth: 4,
                borderColor: colors.primaryPressed,
              }}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <Check size={22} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Decrease ${habit.name}`}
                onPress={() =>
                  void onLogValue(
                    habit.id,
                    selectedDate,
                    Math.max(0, currentValue - step),
                  )
                }
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
              >
                <Text className="text-lg font-bold text-[#2A2140]">-</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Increase ${habit.name}`}
                onPress={() =>
                  void onLogValue(habit.id, selectedDate, currentValue + step)
                }
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderBottomWidth: 3,
                  borderColor: colors.primaryPressed,
                  backgroundColor: colors.primary,
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
              >
                <Text className="text-lg font-bold text-white">+</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
