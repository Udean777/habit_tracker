import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { computeStreak, isDayCompleted, type LocalDate } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { FluidHeatmap } from "@/features/stats/components/FluidHeatmap";
import { mapAggregateLogsToHeatmapCells } from "@/features/world/mappers";
import { useMotionPreferences } from "@/features/world/qualityTier";

export default function StatsScreen() {
  const {
    loading,
    error,
    activeHabits,
    logs,
    settings,
    pendingOutbox,
    effectiveToday,
    refresh,
  } = useHabitsData();

  const motionPrefs = useMotionPreferences(settings);
  const aggregateCells = useMemo(
    () => mapAggregateLogsToHeatmapCells(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );

  const habitStats = useMemo(() => {
    const logsByHabit = new Map<
      string,
      { logDate: LocalDate; value: number }[]
    >();
    const todayValueByHabit = new Map<string, number>();

    for (const log of logs) {
      const list = logsByHabit.get(log.habitId) ?? [];
      list.push({ logDate: log.logDate, value: log.value });
      logsByHabit.set(log.habitId, list);
      if (log.logDate === effectiveToday) {
        todayValueByHabit.set(log.habitId, log.value);
      }
    }

    return activeHabits.map((habit) => {
      const stats = computeStreak({
        logs: logsByHabit.get(habit.id) ?? [],
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
      const completedToday = isDayCompleted(
        todayValueByHabit.get(habit.id) ?? 0,
        habit.type,
        habit.targetValue,
      );
      return { habit, stats, completedToday };
    });
  }, [activeHabits, logs, effectiveToday]);

  if (loading) {
    return (
      <Screen className="items-center justify-center p-6">
        <Text variant="body">Loading stats...</Text>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen className="items-center justify-center gap-4 p-6">
        <Text variant="body" className="text-red-600">
          {error}
        </Text>
        <Button label="Retry" onPress={refresh} />
      </Screen>
    );
  }

  const completedTodayCount = habitStats.filter((s) => s.completedToday).length;
  const avg30d =
    habitStats.length === 0
      ? 0
      : Math.round(
          (habitStats.reduce((sum, s) => sum + s.stats.rate30d, 0) /
            habitStats.length) *
            100,
        );

  return (
    <Screen className="px-4 pt-3">
      <Text variant="title" className="pb-3">
        Stats
      </Text>

      <View className="mb-4 flex-row gap-3">
        <View className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <Text variant="caption">Completed Today</Text>
          <Text variant="title">
            {completedTodayCount} / {activeHabits.length}
          </Text>
        </View>
        <View className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <Text variant="caption">30d Avg Rate</Text>
          <Text variant="title">{avg30d}%</Text>
        </View>
      </View>

      <View className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <Text variant="caption">
          Offline Outbox Queue: {pendingOutbox} pending operations
        </Text>
      </View>

      {habitStats.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text variant="caption">No active habits to analyze yet.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="heading" className="mb-2">
            8-Week Consistency Field
          </Text>
          <FluidHeatmap
            cells={aggregateCells}
            tier={motionPrefs.tier}
            hapticsEnabled={settings.hapticsEnabled}
          />
          {habitStats.map(({ habit, stats }) => (
            <View
              key={habit.id}
              className="mb-3 rounded-xl border border-neutral-200 bg-white p-4"
            >
              <Text variant="heading">{habit.name}</Text>
              <Text variant="caption" className="mt-1">
                Current streak: {stats.currentStreak}d | Best:{" "}
                {stats.bestStreak}d
              </Text>
              <Text variant="caption" className="mt-1">
                7d: {Math.round(stats.rate7d * 100)}% | 30d:{" "}
                {Math.round(stats.rate30d * 100)}% | 90d:{" "}
                {Math.round(stats.rate90d * 100)}%
              </Text>
            </View>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  );
}
