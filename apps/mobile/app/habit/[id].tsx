import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
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
import { formatReadableDate } from "@/lib/dateFormat";
import { colors, elevation, radii } from "@/theme/tokens";

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
    <Screen className="pt-2">
      <View className="flex-row items-center gap-3 pb-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{
            borderRadius: radii.button,
            borderWidth: 1,
            borderBottomWidth: 3,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
          }}
          className="min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.5} />
        </Pressable>
        <Text variant="title" className="flex-1" numberOfLines={1}>
          {habit.name}
        </Text>
        {editingName === null ? (
          <Button
            label="Rename"
            variant="secondary"
            onPress={() => setEditingName(habit.name)}
          />
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {editingName !== null ? (
          <Animated.View
            entering={
              motionPrefs.reduceMotion
                ? undefined
                : FadeIn.duration(160).easing(Easing.out(Easing.cubic))
            }
            className="mb-4 gap-2"
          >
            <TextInput
              value={editingName}
              onChangeText={setEditingName}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              }}
              className="min-h-[44px] px-3 text-base"
            />
            <View className="flex-row gap-2">
              <Button label="Save Name" onPress={() => void saveNameEdit()} />
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setEditingName(null)}
              />
            </View>
          </Animated.View>
        ) : null}

        <Animated.View
          layout={
            motionPrefs.reduceMotion
              ? undefined
              : LinearTransition.duration(180).easing(Easing.out(Easing.cubic))
          }
          entering={
            motionPrefs.reduceMotion
              ? undefined
              : FadeIn.duration(180).easing(Easing.out(Easing.cubic))
          }
        >

        <View className="mb-4 flex-row gap-3">
          <View
            style={[
              {
                borderRadius: radii.card,
                borderWidth: 2,
                borderBottomWidth: 4,
                borderColor: colors.primaryPressed,
                backgroundColor: colors.primary,
              },
              elevation.card,
            ]}
            className="flex-1 p-4"
          >
            <Text className="text-xs font-semibold text-white/90">
              Current Streak
            </Text>
            <Text className="mt-1 text-2xl font-bold text-white" tabularNums>
              {stats.currentStreak}d
            </Text>
          </View>
          <View
            style={[
              {
                borderRadius: radii.card,
                borderWidth: 2,
                borderBottomWidth: 4,
                borderColor: colors.accent,
                backgroundColor: colors.accentBg,
              },
              elevation.card,
            ]}
            className="flex-1 p-4"
          >
            <Text className="text-xs font-semibold text-[#2A2140]">
              Best Streak
            </Text>
            <Text className="mt-1 text-2xl font-bold text-[#2A2140]" tabularNums>
              {stats.bestStreak}d
            </Text>
          </View>
        </View>

        <View
          style={{
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
          className="mb-4 p-3"
        >
          <Text variant="caption" tabularNums>
            Completion Rate: 7d {Math.round(stats.rate7d * 100)}% | 30d{" "}
            {Math.round(stats.rate30d * 100)}% | 90d{" "}
            {Math.round(stats.rate90d * 100)}%
          </Text>
        </View>

        <Text variant="heading" className="mb-2">
          This Month Consistency
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
          Past {settings.backfillWindowDays} Days
        </Text>
        <View className="gap-2 pb-6">
          {backfillDays.map((date) => {
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
                    onPress={() =>
                      void onLogValue(habit.id, date, done ? 0 : 1)
                    }
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
                        void onLogValue(
                          habit.id,
                          date,
                          Math.max(0, val - (habit.type === "duration" ? 5 : 1)),
                        )
                      }
                      style={{
                        borderRadius: radii.button,
                        borderWidth: 1,
                        borderColor: colors.borderStrong,
                        backgroundColor: colors.surface,
                      }}
                      className="min-h-[44px] min-w-[44px] items-center justify-center"
                    >
                      <Text className="text-lg font-bold text-[#2A2140]">
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

        <View
          style={{
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
          className="mb-4 p-4"
        >
          <Text variant="heading" className="mb-1">
            Manage Quest
          </Text>
          <Text variant="caption" className="mb-3">
            Archive to pause without losing history, or delete permanently.
          </Text>
          <View className="flex-row gap-2">
            <Button
              label="Archive"
              variant="secondary"
              className="flex-1"
              onPress={() => void handleArchive()}
            />
            <Button
              label="Delete"
              variant="danger"
              className="flex-1"
              onPress={() => void handleDelete()}
            />
          </View>
        </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}
