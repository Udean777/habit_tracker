import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { CreateHabitInput } from "@habit/shared";
import { Button } from "@/components/Button";
import { HabitIcon } from "@/components/HabitIcon";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";

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
    <Screen className="justify-between px-4 py-6">
      <View>
        <Text variant="title">Welcome to Your Garden</Text>
        <Text variant="caption" className="mt-1 mb-6">
          Pick a few starter habits. Each one grows a living organism.
        </Text>

        <View className="gap-3">
          {PRESETS.map((preset) => {
            const active = selected.includes(preset.name);
            return (
              <Pressable
                key={preset.name}
                accessibilityRole="button"
                accessibilityLabel={`Select ${preset.name}`}
                onPress={() => togglePreset(preset.name)}
                className={`min-h-[56px] flex-row items-center gap-3 rounded-xl border p-4 ${
                  active
                    ? "border-blue-600 bg-blue-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <HabitIcon
                  icon={preset.icon}
                  size={20}
                  color={active ? "#2563EB" : "#525252"}
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
