import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDays,
  computeStreak,
  isDayCompleted,
  type LocalDate,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { FluidHeatmap } from "@/features/stats/components/FluidHeatmap";
import { mapLogsToHeatmapCells } from "@/features/world/mappers";
import { useMotionPreferences } from "@/features/world/qualityTier";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeHabits,
    archivedHabits,
    logs,
    settings,
    effectiveToday,
    onLogValue,
    onUpdateHabit,
    onArchiveHabit,
    onDeleteHabit,
  } = useHabitsData();

  const motionPrefs = useMotionPreferences(settings);

  const habit = useMemo(
    () =>
      activeHabits.find((h) => h.id === id) ??
      archivedHabits.find((h) => h.id === id) ??
      null,
    [activeHabits, archivedHabits, id],
  );

  const [editingName, setEditingName] = useState<string | null>(null);

  const habitLogs = useMemo(
    () =>
      logs
        .filter((l) => l.habitId === id)
        .map((l) => ({ logDate: l.logDate, value: l.value })),
    [logs, id],
  );

  const logMap = useMemo(() => {
    const map = new Map<LocalDate, number>();
    for (const l of habitLogs) {
      map.set(l.logDate, l.value);
    }
    return map;
  }, [habitLogs]);

  const backfillDays = useMemo(() => {
    const count = Math.min(settings.backfillWindowDays + 1, 30);
    return Array.from({ length: count }, (_, idx) => addDays(effectiveToday, -idx));
  }, [effectiveToday, settings.backfillWindowDays]);

  if (!habit) {
    return (
      <Screen className="items-center justify-center gap-4 p-6">
        <Text variant="heading">Habit not found</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const stats = computeStreak({
    logs: habitLogs,
    schedule: {
      type: habit.scheduleType,
      daysBitmask: habit.scheduleDays,
      timesPerWeek: habit.scheduleTimes,
    },
    habitType: habit.type,
    targetValue: habit.targetValue,
    startDate: habit.startDate,
    today: effectiveToday,
  });

  async function saveNameEdit() {
    if (!habit || editingName === null) return;
    const trimmed = editingName.trim();
    if (trimmed.length > 0) {
      await onUpdateHabit(habit.id, { name: trimmed });
    }
    setEditingName(null);
  }

  async function handleArchive() {
    if (!habit) return;
    await onArchiveHabit(habit.id);
    router.back();
  }

  async function handleDelete() {
    if (!habit) return;
    await onDeleteHabit(habit.id);
    router.back();
  }

  return (
    <Screen className="px-4 pt-3">
      <View className="flex-row items-center justify-between pb-3">
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
        <View className="flex-row gap-2">
          <Button
            label="Archive"
            variant="secondary"
            onPress={() => void handleArchive()}
          />
          <Button
            label="Delete"
            variant="secondary"
            onPress={() => void handleDelete()}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {editingName !== null ? (
          <View className="mb-4 gap-2">
            <TextInput
              value={editingName}
              onChangeText={setEditingName}
              className="min-h-[44px] rounded-lg border border-neutral-300 px-3 text-base text-neutral-900"
            />
            <View className="flex-row gap-2">
              <Button label="Save Name" onPress={() => void saveNameEdit()} />
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setEditingName(null)}
              />
            </View>
          </View>
        ) : (
          <View className="mb-4 flex-row items-center justify-between">
            <Text variant="title" className="flex-1">
              {habit.name}
            </Text>
            <Button
              label="Rename"
              variant="secondary"
              onPress={() => setEditingName(habit.name)}
            />
          </View>
        )}

        <View className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <Text variant="heading">
            Current Streak: {stats.currentStreak}d (Best: {stats.bestStreak}d)
          </Text>
          <Text variant="caption" className="mt-1">
            Completion Rate | 7d: {Math.round(stats.rate7d * 100)}% | 30d:{" "}
            {Math.round(stats.rate30d * 100)}% | 90d:{" "}
            {Math.round(stats.rate90d * 100)}%
          </Text>
        </View>

        <Text variant="heading" className="mb-2">
          56-Day Fluid Heatmap
        </Text>
        <FluidHeatmap
          cells={mapLogsToHeatmapCells(
            habitLogs,
            habit.type,
            habit.targetValue,
            effectiveToday,
          )}
          tier={motionPrefs.tier}
          hapticsEnabled={settings.hapticsEnabled}
        />

        <Text variant="heading" className="mb-2">
          Backfill History ({settings.backfillWindowDays}d window)
        </Text>
        <View className="gap-2 pb-8">
          {backfillDays.map((date) => {
            const val = logMap.get(date) ?? 0;
            const done = isDayCompleted(val, habit.type, habit.targetValue);
            return (
              <View
                key={date}
                className="flex-row items-center justify-between rounded-lg border border-neutral-200 p-3"
              >
                <View>
                  <Text variant="body">{date}</Text>
                  <Text variant="caption">
                    Value: {val}
                    {habit.targetValue ? ` / ${habit.targetValue}` : ""}
                  </Text>
                </View>

                {habit.type === "boolean" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${date}`}
                    onPress={() =>
                      void onLogValue(habit.id, date, done ? 0 : 1)
                    }
                    className={`min-h-[44px] min-w-[72px] items-center justify-center rounded-lg px-3 ${
                      done ? "bg-emerald-600" : "bg-neutral-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        done ? "text-white" : "text-neutral-900"
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
                        void onLogValue(
                          habit.id,
                          date,
                          Math.max(0, val - (habit.type === "duration" ? 5 : 1)),
                        )
                      }
                      className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-neutral-200"
                    >
                      <Text className="text-lg font-bold text-neutral-900">
                        -
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Increase ${date}`}
                      onPress={() =>
                        void onLogValue(
                          habit.id,
                          date,
                          val + (habit.type === "duration" ? 5 : 1),
                        )
                      }
                      className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-blue-600"
                    >
                      <Text className="text-lg font-bold text-white">+</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
