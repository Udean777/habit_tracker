import { Pressable, View } from "react-native";
import type { ScheduleType } from "@habit/shared";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const SCHEDULE_OPTIONS: readonly {
  readonly value: ScheduleType;
  readonly label: string;
}[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Specific days" },
  { value: "times_per_week", label: "Times / week" },
];

type HabitScheduleFieldsProps = {
  readonly scheduleType: ScheduleType;
  readonly scheduleDays: number;
  readonly scheduleTimes: number;
  readonly onChangeScheduleType: (type: ScheduleType) => void;
  readonly onToggleWeekday: (isoIndex: number) => void;
  readonly onChangeScheduleTimes: (times: number) => void;
};

export function HabitScheduleFields({
  scheduleType,
  scheduleDays,
  scheduleTimes,
  onChangeScheduleType,
  onToggleWeekday,
  onChangeScheduleTimes,
}: HabitScheduleFieldsProps) {
  const { colors } = useTheme();

  return (
    <>
      <Text variant="heading" className="mb-2">
        Schedule
      </Text>
      <View className="mb-3 flex-row gap-2">
        {SCHEDULE_OPTIONS.map(({ value: st, label }) => {
          const active = scheduleType === st;
          return (
            <Pressable
              key={st}
              accessibilityRole="button"
              accessibilityLabel={`Schedule ${label}`}
              onPress={() => onChangeScheduleType(st)}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderBottomWidth: active ? 3 : 1,
                borderColor: active
                  ? colors.primaryPressed
                  : colors.borderStrong,
                backgroundColor: active ? colors.primary : colors.surface,
              }}
              className="min-h-[44px] flex-1 items-center justify-center px-2"
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-[#2A2140]"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {scheduleType === "weekdays" ? (
        <View className="mb-4 flex-row gap-1">
          {WEEKDAY_LABELS.map((label, idx) => {
            const active = (scheduleDays & (1 << idx)) !== 0;
            return (
              <Pressable
                key={idx}
                accessibilityRole="button"
                accessibilityLabel={`Toggle day ${idx + 1}`}
                onPress={() => onToggleWeekday(idx)}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderBottomWidth: active ? 3 : 1,
                  borderColor: active
                    ? colors.primaryPressed
                    : colors.borderStrong,
                  backgroundColor: active ? colors.primary : colors.surface,
                }}
                className="min-h-[44px] flex-1 items-center justify-center"
              >
                <Text
                  className={`font-semibold ${
                    active ? "text-white" : "text-[#2A2140]"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {scheduleType === "times_per_week" ? (
        <View className="mb-4 flex-row gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${n} times per week`}
              onPress={() => onChangeScheduleTimes(n)}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderBottomWidth: scheduleTimes === n ? 3 : 1,
                borderColor:
                  scheduleTimes === n
                    ? colors.primaryPressed
                    : colors.borderStrong,
                backgroundColor:
                  scheduleTimes === n ? colors.primary : colors.surface,
              }}
              className="min-h-[44px] flex-1 items-center justify-center"
            >
              <Text
                className={`font-semibold ${
                  scheduleTimes === n ? "text-white" : "text-[#2A2140]"
                }`}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </>
  );
}
