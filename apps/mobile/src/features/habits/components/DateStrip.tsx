import { Pressable, View } from "react-native";
import type { LocalDate } from "@habit/shared";
import { Text } from "@/components/Text";
import { parseLocalDateParts } from "@/lib/dateFormat";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type DateStripProps = {
  readonly dates: readonly LocalDate[];
  readonly selectedDate: LocalDate;
  readonly effectiveToday: LocalDate;
  readonly isDateFullyCompleted: (date: LocalDate) => boolean;
  readonly onSelectDate: (date: LocalDate) => void;
};

export function DateStrip({
  dates,
  selectedDate,
  effectiveToday,
  isDateFullyCompleted,
  onSelectDate,
}: DateStripProps) {
  const { colors } = useTheme();

  return (
    <View className="mb-3 flex-row justify-between gap-1.5 py-1">
      {dates.map((date) => {
        const isSelected = date === selectedDate;
        const isFuture = date > effectiveToday;
        const { weekday, dayNum } = parseLocalDateParts(date);
        const allDone = !isFuture && isDateFullyCompleted(date);

        return (
          <Pressable
            key={date}
            disabled={isFuture}
            accessibilityRole="button"
            accessibilityLabel={`Select date ${date}`}
            accessibilityState={{ disabled: isFuture, selected: isSelected }}
            onPress={() => {
              if (!isFuture) onSelectDate(date);
            }}
            style={{
              borderRadius: radii.pill,
              backgroundColor: isSelected ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: isSelected ? colors.primaryPressed : colors.border,
              borderBottomWidth: isSelected ? 3 : 1,
              opacity: isFuture ? 0.4 : 1,
            }}
            className="min-h-[52px] flex-1 items-center justify-center py-1"
          >
            <Text
              tone={isSelected ? "onPrimary" : "secondary"}
              className="text-[10px] font-semibold uppercase"
            >
              {weekday}
            </Text>
            <Text
              tabularNums
              tone={isSelected ? "onPrimary" : "primary"}
              className="text-sm font-bold"
            >
              {dayNum}
            </Text>
            {allDone ? (
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: radii.pill,
                  backgroundColor: isSelected
                    ? colors.primaryText
                    : colors.accent,
                  marginTop: 2,
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
