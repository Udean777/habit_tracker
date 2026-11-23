import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Check from "lucide-react-native/icons/check";
import {
  computeStreak,
  isDayCompleted,
  isScheduledOnDay,
  toHabitSchedule,
  type LocalDate,
} from "@habit/shared";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { HabitIcon } from "@/components/HabitIcon";
import { StreakTicker } from "@/components/StreakTicker";
import { Text } from "@/components/Text";
import { ValueStepper } from "@/components/ValueStepper";
import { triggerHaptic } from "@/lib/haptics";
import { habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { HabitRecord } from "../repository";
import { HabitTimerControl } from "./HabitTimerControl";

type HabitQuestRowProps = {
  readonly habit: HabitRecord;
  readonly currentValue: number;
  readonly habitLogs: readonly {
    readonly logDate: LocalDate;
    readonly value: number;
  }[];
  readonly freezeDates?: readonly LocalDate[];
  readonly selectedDate: LocalDate;
  readonly effectiveToday: LocalDate;
  readonly hapticsEnabled: boolean;
  readonly reduceMotion: boolean;
  readonly onLogValue: (
    habitId: string,
    logDate: LocalDate,
    value: number,
  ) => Promise<void>;
};

export function HabitQuestRow({
  habit,
  currentValue,
  habitLogs,
  freezeDates,
  selectedDate,
  effectiveToday,
  hapticsEnabled,
  reduceMotion,
  onLogValue,
}: HabitQuestRowProps) {
  const { colors } = useTheme();
  const isDone = isDayCompleted(currentValue, habit.type, habit.targetValue);
  const schedule = toHabitSchedule(habit);
  const scheduled = isScheduledOnDay(schedule, selectedDate);
  const streak = computeStreak({
    logs: habitLogs,
    freezeDates,
    schedule,
    habitType: habit.type,
    targetValue: habit.targetValue,
    startDate: habit.startDate,
    today: effectiveToday,
  });

  const accentColor = habitAccents[habit.color];
  const targetVal = habit.targetValue ?? 1;
  const progressPct =
    habit.type === "count"
      ? Math.min(100, Math.round((currentValue / Math.max(1, targetVal)) * 100))
      : isDone
        ? 100
        : 0;

  const progressLabel = `${currentValue} / ${targetVal}`;
  const step = 1;

  return (
    <Card
      variant={isDone ? "muted" : "surface"}
      elevated={!isDone && scheduled}
      style={{
        borderColor: isDone ? colors.primaryTextAccent : colors.border,
      }}
      className="p-3.5"
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open details for ${habit.name}`}
          onPress={() => router.push(`/habit/${habit.id}`)}
          className="min-h-[48px] flex-1 flex-row items-center gap-3"
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radii.button,
              backgroundColor: accentColor,
              borderWidth: 1,
              borderBottomWidth: 3,
              borderColor: colors.textPrimary,
            }}
            className="items-center justify-center"
          >
            <HabitIcon icon={habit.icon} size={22} color={colors.primaryText} />
          </View>

          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-1.5">
              <Text variant="heading" numberOfLines={1} className="shrink">
                {habit.name}
              </Text>
              {!scheduled ? (
                <Text variant="caption" className="text-xs">
                  (off)
                </Text>
              ) : null}
            </View>

            <View className="flex-row flex-wrap items-center gap-2">
              <Badge
                label={isDone ? "CLAIMED" : "+25 XP · +10G"}
                variant={isDone ? "primary" : "accent"}
                pill
                className="px-2 py-0.5"
                textClassName="text-[11px] font-extrabold"
              />
              <StreakTicker
                streak={streak.currentStreak}
                reduceMotion={reduceMotion}
              />
            </View>
          </View>
        </Pressable>

        {habit.type !== "duration" ? (
          <View className="items-end justify-center">
            {habit.type === "boolean" ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
                accessibilityLabel={
                  isDone ? `Uncheck ${habit.name}` : `Complete ${habit.name}`
                }
                onPress={() => {
                  if (!isDone) {
                    triggerHaptic("medium", hapticsEnabled);
                  }
                  void onLogValue(habit.id, selectedDate, isDone ? 0 : 1);
                }}
                style={{
                  borderRadius: radii.button,
                  backgroundColor: isDone ? colors.primary : colors.background,
                  borderWidth: 2,
                  borderBottomWidth: 4,
                  borderColor: isDone
                    ? colors.primaryPressed
                    : colors.borderStrong,
                }}
                className="min-h-[46px] min-w-[46px] items-center justify-center"
              >
                {isDone ? (
                  <Check size={22} color={colors.primaryText} strokeWidth={3} />
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
                className="min-h-[46px] min-w-[46px] items-center justify-center"
              >
                <Check size={22} color={colors.primaryText} strokeWidth={3} />
              </View>
            ) : (
              <ValueStepper
                targetLabel={habit.name}
                onDecrement={() =>
                  void onLogValue(
                    habit.id,
                    selectedDate,
                    Math.max(0, currentValue - step),
                  )
                }
                onIncrement={() =>
                  void onLogValue(habit.id, selectedDate, currentValue + step)
                }
              />
            )}
          </View>
        ) : null}
      </View>

      {habit.type === "duration" ? (
        <HabitTimerControl
          habitName={habit.name}
          targetMinutes={targetVal}
          loggedMinutes={currentValue}
          isDone={isDone}
          accentColor={accentColor}
          hapticsEnabled={hapticsEnabled}
          onCommitMinutes={(mins) =>
            void onLogValue(habit.id, selectedDate, mins)
          }
        />
      ) : habit.type === "count" ? (
        <View className="mt-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text variant="caption" tabularNums className="text-xs font-semibold">
              {progressLabel}
            </Text>
            <Text variant="caption" tabularNums className="text-xs font-bold">
              {progressPct}%
            </Text>
          </View>
          <View
            style={{
              height: 7,
              borderRadius: radii.pill,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progressPct}%`,
                height: "100%",
                borderRadius: radii.pill,
                backgroundColor: isDone ? colors.primary : accentColor,
              }}
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
