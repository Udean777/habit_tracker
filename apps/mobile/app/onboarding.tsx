import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router } from "expo-router";
import type { CreateHabitInput } from "@habit/shared";
import { Button } from "@/components/Button";
import { HabitIcon } from "@/components/HabitIcon";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type Preset = Omit<CreateHabitInput, "startDate">;

const PRESETS: readonly Preset[] = [
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

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { effectiveToday, onCreateHabit } = useHabitsData();
  const [selected, setSelected] = useState<readonly string[]>([
    "Morning Walk",
  ]);
  const [saving, setSaving] = useState(false);

  function togglePreset(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  async function handleStart() {
    setSaving(true);
    try {
      for (const preset of PRESETS) {
        if (selected.includes(preset.name)) {
          await onCreateHabit({ ...preset, startDate: effectiveToday });
        }
      }
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen className="justify-between py-6">
      <View>
        <View className="mb-4 items-center">
          <Image
            source={require("../assets/images/splash-icon.png")}
            style={{ width: 68, height: 68 }}
            resizeMode="contain"
            accessibilityLabel="Glimkin logo"
          />
        </View>
        <Text variant="title">Welcome to Glimkin</Text>
        <Text variant="caption" className="mt-1 mb-6">
          Pick a few starter quests. Every completion earns XP and levels up
          your hero.
        </Text>

        <View className="gap-3">
          {PRESETS.map((preset) => {
            const active = selected.includes(preset.name);
            return (
              <Pressable
                key={preset.name}
                accessibilityRole="button"
                accessibilityLabel={`Select ${preset.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => togglePreset(preset.name)}
                style={{
                  borderRadius: radii.card,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.primary : colors.borderStrong,
                  backgroundColor: active
                    ? colors.surfaceMuted
                    : colors.surface,
                }}
                className="min-h-[56px] flex-row items-center gap-3 p-4"
              >
                <HabitIcon
                  icon={preset.icon}
                  size={20}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text variant="heading" className="flex-1">
                  {preset.name}
                </Text>
                <Text variant="caption">{active ? "Selected" : "Add"}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Button
          label={saving ? "Creating..." : "Start Tracking"}
          disabled={saving}
          onPress={() => void handleStart()}
        />
        <Button
          label="Skip for now"
          variant="secondary"
          onPress={() => router.replace("/(tabs)")}
        />
      </View>
    </Screen>
  );
}
