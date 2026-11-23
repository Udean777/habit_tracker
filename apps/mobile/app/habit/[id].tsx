import { useMemo } from "react";
import { ScrollView } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { addDays, computeStreak, type LocalDate } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { HabitBackfillList } from "@/features/habits/components/HabitBackfillList";
import { HabitDetailHeader } from "@/features/habits/components/HabitDetailHeader";
import { HabitManageCard } from "@/features/habits/components/HabitManageCard";
import { HabitStreakCards } from "@/features/habits/components/HabitStreakCards";
import { FluidHeatmap, mapLogsToHeatmapCells } from "@/features/stats";
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
      <HabitDetailHeader
        name={habit.name}
        reduceMotion={motionPrefs.reduceMotion}
        onRename={(nextName) => onUpdateHabit(habit.id, { name: nextName })}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
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
          <HabitStreakCards stats={stats} />

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
          <HabitBackfillList
            habit={habit}
            days={backfillDays}
            logMap={logMap}
            onLogValue={onLogValue}
          />

          <HabitManageCard
            onArchive={() => void handleArchive()}
            onDelete={() => void handleDelete()}
          />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}
