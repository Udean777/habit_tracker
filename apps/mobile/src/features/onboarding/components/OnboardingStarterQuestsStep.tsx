import { Pressable, View } from "react-native";
import Check from "lucide-react-native/icons/check";
import type { CreateHabitInput } from "@habit/shared";
import { Badge } from "@/components/Badge";
import { HabitIcon } from "@/components/HabitIcon";
import { Text } from "@/components/Text";
import { habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export type StarterQuestPreset = Omit<CreateHabitInput, "startDate">;

export const STARTER_QUEST_PRESETS: readonly StarterQuestPreset[] = [
  {
    name: "Morning Walk",
    icon: "run",
    color: "emerald",
    type: "boolean",
    targetValue: null,
    scheduleType: "daily",
    scheduleDays: 127,
    scheduleTimes: null,
    reminderTime: "08:00",
  },
  {
    name: "Read 20m",
    icon: "book",
    color: "violet",
    type: "duration",
    targetValue: 20,
    scheduleType: "daily",
    scheduleDays: 127,
    scheduleTimes: null,
    reminderTime: "21:00",
  },
  {
    name: "Drink Water",
    icon: "water",
    color: "cyan",
    type: "count",
    targetValue: 8,
    scheduleType: "daily",
    scheduleDays: 127,
    scheduleTimes: null,
    reminderTime: null,
  },
  {
    name: "Meditate",
    icon: "leaf",
    color: "amber",
    type: "boolean",
    targetValue: null,
    scheduleType: "daily",
    scheduleDays: 127,
    scheduleTimes: null,
    reminderTime: null,
  },
];

type OnboardingStarterQuestsStepProps = {
  readonly selectedNames: readonly string[];
  readonly onTogglePreset: (name: string) => void;
};

export function OnboardingStarterQuestsStep({
  selectedNames,
  onTogglePreset,
}: OnboardingStarterQuestsStepProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1">
      <Text variant="title">Pick your starter quests</Text>
      <Text variant="body" tone="secondary" className="mt-1.5">
        Choose a few habits to begin with. You can edit, reorder, or add custom
        quests anytime.
      </Text>

      <View className="mt-5 gap-3">
        {STARTER_QUEST_PRESETS.map((preset) => {
          const active = selectedNames.includes(preset.name);
          const typeLabel =
            preset.type === "boolean"
              ? "Check-off"
              : preset.type === "duration"
                ? `${preset.targetValue} min`
                : `${preset.targetValue}x daily`;

          return (
            <Pressable
              key={preset.name}
              accessibilityRole="checkbox"
              accessibilityLabel={`Select starter quest ${preset.name}`}
              accessibilityState={{ checked: active }}
              onPress={() => onTogglePreset(preset.name)}
              style={{
                borderRadius: radii.card,
                borderWidth: active ? 2 : 1,
                borderBottomWidth: active ? 4 : 2,
                borderColor: active ? colors.primaryTextAccent : colors.border,
                backgroundColor: active ? colors.surfaceMuted : colors.surface,
              }}
              className="min-h-[60px] flex-row items-center gap-3 p-3.5"
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radii.button,
                  backgroundColor: habitAccents[preset.color],
                }}
                className="items-center justify-center"
              >
                <HabitIcon
                  icon={preset.icon}
                  size={20}
                  color={colors.primaryText}
                />
              </View>

              <View className="flex-1 gap-1">
                <Text variant="heading">{preset.name}</Text>
                <View className="flex-row items-center gap-2">
                  <Badge
                    label={typeLabel}
                    variant="muted"
                    pill
                    className="px-2 py-0.5"
                    textClassName="text-[10px] font-bold"
                  />
                  <Text variant="caption" className="text-xs">
                    +25 XP · +10G
                  </Text>
                </View>
              </View>

              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.badge,
                  borderWidth: 2,
                  borderColor: active
                    ? colors.primaryPressed
                    : colors.borderStrong,
                  backgroundColor: active ? colors.primary : colors.background,
                }}
                className="items-center justify-center"
              >
                {active ? (
                  <Check size={16} color={colors.primaryText} strokeWidth={3} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
