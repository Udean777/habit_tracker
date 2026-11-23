import { Pressable, View } from "react-native";
import { isDayCompleted, type LocalDate } from "@habit/shared";
import { Text } from "@/components/Text";
import { formatReadableDate } from "@/lib/dateFormat";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { HabitRecord } from "../repository";

type HabitBackfillListProps = {
  readonly habit: HabitRecord;
  readonly days: readonly LocalDate[];
  readonly logMap: ReadonlyMap<LocalDate, number>;
  readonly onLogValue: (habitId: string, date: LocalDate, value: number) => Promise<void>;
};

export function HabitBackfillList({
  habit,
  days,
  logMap,
  onLogValue,
}: HabitBackfillListProps) {
  const { colors } = useTheme();
  const step = habit.type === "duration" ? 5 : 1;

  return (
    <View className="gap-2 pb-6">
      {days.map((date) => {
        const val = logMap.get(date) ?? 0;
        const done = isDayCompleted(val, habit.type, habit.targetValue);
        return (
          <View
            key={date}
            style={{
              borderRadius: radii.button,
              borderWidth: 1,
              borderColor: done ? colors.primary : colors.border,
              backgroundColor: done ? colors.surfaceMuted : colors.surface,
            }}
            className="flex-row items-center justify-between p-3"
          >
            <View>
              <Text variant="body" className="font-semibold">
                {formatReadableDate(date, true)}
              </Text>
              <Text variant="caption" tabularNums>
                {habit.type === "boolean"
                  ? done
                    ? "Completed"
                    : "Not completed"
                  : `${val}${habit.targetValue ? ` / ${habit.targetValue}` : ""}`}
              </Text>
            </View>

            {habit.type === "boolean" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${date}`}
                onPress={() => void onLogValue(habit.id, date, done ? 0 : 1)}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderBottomWidth: 3,
                  borderColor: done
                    ? colors.primaryPressed
                    : colors.borderStrong,
                  backgroundColor: done ? colors.primary : colors.surface,
                }}
                className="min-h-[44px] min-w-[76px] items-center justify-center px-3"
              >
                <Text
                  className={`font-semibold ${
                    done ? "text-white" : "text-[#2A2140]"
                  }`}
                >
                  {done ? "Done" : "Mark"}
                </Text>
              </Pressable>
            ) : (
              <View className="flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${date}`}
                  onPress={() =>
                    void onLogValue(habit.id, date, Math.max(0, val - step))
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
                  accessibilityLabel={`Increase ${date}`}
                  onPress={() => void onLogValue(habit.id, date, val + step)}
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
        );
      })}
    </View>
  );
}
