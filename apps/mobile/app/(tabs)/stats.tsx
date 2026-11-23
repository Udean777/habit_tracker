import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { computeStreak, isDayCompleted, type LocalDate } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import {
  QuestHud,
  computeQuestProgress,
  useHabitsData,
} from "@/features/habits";
import { FluidHeatmap } from "@/features/stats/components/FluidHeatmap";
import { mapAggregateLogsToHeatmapCells } from "@/features/world/mappers";
import { useMotionPreferences } from "@/features/world/qualityTier";
import { colors, elevation, radii } from "@/theme/tokens";

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
  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );
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
    <Screen edges={["top", "left", "right"]} className="pt-2">
      <Text variant="title" className="pb-3">
        Stats
      </Text>

      <Animated.View
        entering={
          motionPrefs.reduceMotion
            ? undefined
            : FadeIn.duration(180).easing(Easing.out(Easing.cubic))
        }
      >
        <QuestHud
          progress={questProgress}
          reduceMotion={motionPrefs.reduceMotion}
        />
      </Animated.View>

      <Animated.View
        entering={
          motionPrefs.reduceMotion
            ? undefined
            : FadeIn.delay(35).duration(180).easing(Easing.out(Easing.cubic))
        }
        className="mb-4 flex-row gap-3"
      >
        <View
          style={[
            {
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.primaryPressed,
              backgroundColor: colors.primary,
            },
            elevation.card,
          ]}
          className="flex-1 p-4"
        >
          <Text className="text-sm text-white/90">Completed Today</Text>
          <Text className="mt-1 text-2xl font-bold text-white" tabularNums>
            {completedTodayCount} / {activeHabits.length}
          </Text>
        </View>
        <View
          style={[
            {
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.accent,
              backgroundColor: colors.accentBg,
            },
            elevation.card,
          ]}
          className="flex-1 p-4"
        >
          <Text className="text-sm font-medium text-[#2A2140]">30d Avg Rate</Text>
          <Text className="mt-1 text-2xl font-bold text-[#2A2140]" tabularNums>
            {avg30d}%
          </Text>
        </View>
      </Animated.View>

      <View
        style={{
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceMuted,
        }}
        className="mb-4 p-3"
      >
        <Text variant="caption" tabularNums>
          {pendingOutbox > 0
            ? `Sync status: ${pendingOutbox} updates waiting to upload`
            : "Sync status: All updates saved"}
        </Text>
      </View>

      {habitStats.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text variant="caption">No active habits to analyze yet.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 104 }}
        >
          <Text variant="heading" className="mb-2">
            This Month Consistency
          </Text>
          <FluidHeatmap
            cells={aggregateCells}
            tier={motionPrefs.tier}
            hapticsEnabled={settings.hapticsEnabled}
          />
          {habitStats.map(({ habit, stats }, idx) => (
            <Animated.View
              key={habit.id}
              entering={
                motionPrefs.reduceMotion
                  ? undefined
                  : FadeIn.delay(Math.min(70 + idx * 30, 220))
                      .duration(180)
                      .easing(Easing.out(Easing.cubic))
              }
              style={[
                {
                  borderRadius: radii.card,
                  borderWidth: 2,
                  borderBottomWidth: 4,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
                elevation.card,
              ]}
              className="mb-3 p-4"
            >
              <Text variant="heading">{habit.name}</Text>
              <Text variant="caption" tabularNums className="mt-1">
                Current streak: {stats.currentStreak}d | Best:{" "}
                {stats.bestStreak}d
              </Text>
              <Text variant="caption" tabularNums className="mt-1">
                7d: {Math.round(stats.rate7d * 100)}% | 30d:{" "}
                {Math.round(stats.rate30d * 100)}% | 90d:{" "}
                {Math.round(stats.rate90d * 100)}%
              </Text>
            </Animated.View>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  );
}
