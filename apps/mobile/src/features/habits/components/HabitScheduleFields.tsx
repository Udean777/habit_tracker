import { View } from "react-native";
import type { ScheduleType } from "@habit/shared";
import { SelectableChip } from "@/components/SelectableChip";
import { Text } from "@/components/Text";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const TIMES_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

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
  return (
    <>
      <Text variant="heading" className="mb-2">
        Schedule
      </Text>
      <View className="mb-3 flex-row gap-2">
        {SCHEDULE_OPTIONS.map(({ value: st, label }) => (
          <SelectableChip
            key={st}
            label={label}
            selected={scheduleType === st}
            accessibilityLabel={`Schedule ${label}`}
            onPress={() => onChangeScheduleType(st)}
            textClassName="text-xs font-semibold"
          />
        ))}
      </View>

      {scheduleType === "weekdays" ? (
        <View className="mb-4 flex-row gap-1">
          {WEEKDAY_LABELS.map((label, idx) => (
            <SelectableChip
              key={idx}
              label={label}
              selected={(scheduleDays & (1 << idx)) !== 0}
              accessibilityLabel={`Toggle day ${idx + 1}`}
              onPress={() => onToggleWeekday(idx)}
              className="flex-1"
            />
          ))}
        </View>
      ) : null}

      {scheduleType === "times_per_week" ? (
        <View className="mb-4 flex-row gap-1">
          {TIMES_PER_WEEK_OPTIONS.map((n) => (
            <SelectableChip
              key={n}
              label={String(n)}
              selected={scheduleTimes === n}
              accessibilityLabel={`${n} times per week`}
              onPress={() => onChangeScheduleTimes(n)}
              className="flex-1"
            />
          ))}
        </View>
      ) : null}
    </>
  );
}
