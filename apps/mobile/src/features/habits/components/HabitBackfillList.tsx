import { View } from "react-native";
import { isDayCompleted, type LocalDate } from "@habit/shared";
import { SelectableChip } from "@/components/SelectableChip";
import { Text } from "@/components/Text";
import { ValueStepper } from "@/components/ValueStepper";
import { formatReadableDate } from "@/lib/dateFormat";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import type { HabitRecord } from "../repository";

type HabitBackfillListProps = {
  readonly habit: HabitRecord;
  readonly days: readonly LocalDate[];
  readonly logMap: ReadonlyMap<LocalDate, number>;
  readonly onLogValue: (
    habitId: string,
    date: LocalDate,
    value: number,
  ) => Promise<void>;
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
              <SelectableChip
                label={done ? "Done" : "Mark"}
                selected={done}
                accessibilityLabel={`Toggle ${date}`}
                onPress={() => void onLogValue(habit.id, date, done ? 0 : 1)}
                className="min-w-[76px] px-3"
              />
            ) : (
              <ValueStepper
                targetLabel={date}
                onDecrement={() =>
                  void onLogValue(habit.id, date, Math.max(0, val - step))
                }
                onIncrement={() => void onLogValue(habit.id, date, val + step)}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
