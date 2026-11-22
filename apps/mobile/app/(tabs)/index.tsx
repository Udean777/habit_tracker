import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronUp from "lucide-react-native/icons/chevron-up";
import {
  addDays,
  computeStreak,
  isDayCompleted,
  isScheduledOnDay,
  type HabitColorKey,
  type LocalDate,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { HabitIcon } from "@/components/HabitIcon";
import { Screen } from "@/components/Screen";
import { StreakTicker } from "@/components/StreakTicker";
import { Text } from "@/components/Text";
import { useHabitsData, type HabitRecord } from "@/features/habits";
import { LivingWorldCanvas } from "@/features/world/components/LivingWorldCanvas";
import { mapHabitsToWorldOrganisms } from "@/features/world/mappers";
import { useMotionPreferences } from "@/features/world/qualityTier";
import { useUiStore } from "@/stores/uiStore";

const COLOR_HEX: Record<HabitColorKey, string> = {
  primary: "#2563EB",
  emerald: "#059669",
  violet: "#7C3AED",
  amber: "#D97706",
  cyan: "#0891B2",
};

export default function TodayScreen() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  const {
    loading,
    error,
    activeHabits,
    logs,
    settings,
    effectiveToday,
    onLogValue,
    onMoveHabit,
    refresh,
  } = useHabitsData();

  const motionPrefs = useMotionPreferences(settings);

  const organisms = useMemo(
    () => mapHabitsToWorldOrganisms(activeHabits, logs, selectedDate),
    [activeHabits, logs, selectedDate],
  );

  const dateStrip = useMemo(() => {
    const count = Math.min(settings.backfillWindowDays + 1, 15);
    return Array.from({ length: count }, (_, idx) =>
      addDays(effectiveToday, -(count - 1 - idx)),
    );
  }, [effectiveToday, settings.backfillWindowDays]);

  const logsByHabitId = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      if (log.logDate === selectedDate) {
        map.set(log.habitId, log.value);
      }
    }
    return map;
  }, [logs, selectedDate]);

  const allLogsByHabitId = useMemo(() => {
    const map = new Map<string, { logDate: LocalDate; value: number }[]>();
    for (const log of logs) {
      const list = map.get(log.habitId) ?? [];
      list.push({ logDate: log.logDate, value: log.value });
      map.set(log.habitId, list);
    }
    return map;
  }, [logs]);

  if (loading) {
    return (
      <Screen className="items-center justify-center p-6">
        <Text variant="body">Loading habits...</Text>
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

  function renderHabitRow(habit: HabitRecord, index: number) {
    const currentValue = logsByHabitId.get(habit.id) ?? 0;
    const isDone = isDayCompleted(currentValue, habit.type, habit.targetValue);
    const schedule = {
      type: habit.scheduleType,
      daysBitmask: habit.scheduleDays,
      timesPerWeek: habit.scheduleTimes,
    };
    const scheduled = isScheduledOnDay(schedule, selectedDate);
    const streak = computeStreak({
      logs: allLogsByHabitId.get(habit.id) ?? [],
      schedule,
      habitType: habit.type,
      targetValue: habit.targetValue,
      startDate: habit.startDate,
      today: effectiveToday,
    });

    const unitSuffix = habit.type === "duration" ? " min" : "";
    const progressLabel =
      habit.type === "boolean"
        ? isDone
          ? "Completed"
          : "Tap to complete"
        : `${currentValue} / ${habit.targetValue ?? 1}${unitSuffix}`;

    return (
      <View
        key={habit.id}
        className={`mb-3 rounded-xl border p-4 ${
          scheduled
            ? "border-neutral-200 bg-white"
            : "border-neutral-100 bg-neutral-50"
        }`}
      >
        <View className="flex-row items-center justify-between gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${habit.name}`}
            onPress={() => router.push(`/habit/${habit.id}`)}
            className="min-h-[44px] flex-1 justify-center"
          >
            <View className="flex-row items-center gap-2">
              <HabitIcon
                icon={habit.icon}
                size={18}
                color={COLOR_HEX[habit.color]}
              />
              <Text variant="heading" numberOfLines={1}>
                {habit.name}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1">
              <Text variant="caption">
                {progressLabel} |
              </Text>
              <StreakTicker
                streak={streak.currentStreak}
                reduceMotion={motionPrefs.reduceMotion}
              />
              {!scheduled ? <Text variant="caption">(off day)</Text> : null}
            </View>
          </Pressable>

          <View className="flex-row items-center gap-1">
            {habit.type === "boolean" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isDone ? `Undo ${habit.name}` : `Complete ${habit.name}`
                }
                onPress={() =>
                  void onLogValue(habit.id, selectedDate, isDone ? 0 : 1)
                }
                className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 ${
                  isDone ? "bg-emerald-600" : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isDone ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {isDone ? "Done" : "Check"}
                </Text>
              </Pressable>
            ) : (
              <View className="flex-row items-center gap-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${habit.name}`}
                  onPress={() =>
                    void onLogValue(
                      habit.id,
                      selectedDate,
                      Math.max(0, currentValue - (habit.type === "duration" ? 5 : 1)),
                    )
                  }
                  className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-neutral-200"
                >
                  <Text className="text-lg font-bold text-neutral-900">-</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${habit.name}`}
                  onPress={() =>
                    void onLogValue(
                      habit.id,
                      selectedDate,
                      currentValue + (habit.type === "duration" ? 5 : 1),
                    )
                  }
                  className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-lg ${
                    isDone ? "bg-emerald-600" : "bg-blue-600"
                  }`}
                >
                  <Text className="text-lg font-bold text-white">+</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View className="mt-2 flex-row justify-end gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${habit.name} up`}
            disabled={index === 0}
            onPress={() => void onMoveHabit(habit.id, "up")}
            className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 ${
              index === 0 ? "opacity-30" : "bg-neutral-100"
            }`}
          >
            <ChevronUp size={18} color="#525252" strokeWidth={2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${habit.name} down`}
            disabled={index === activeHabits.length - 1}
            onPress={() => void onMoveHabit(habit.id, "down")}
            className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 ${
              index === activeHabits.length - 1
                ? "opacity-30"
                : "bg-neutral-100"
            }`}
          >
            <ChevronDown size={18} color="#525252" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Screen className="px-4 pt-3">
      <View className="flex-row items-center justify-between pb-3">
        <View>
          <Text variant="title">Today</Text>
          <Text variant="caption">
            {selectedDate === effectiveToday
              ? `${selectedDate} (Today)`
              : `${selectedDate} (Backfill)`}
          </Text>
        </View>
        <Button
          label="+ New Habit"
          onPress={() => router.push("/habit/new")}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
      >
        <View className="mb-3 flex-row gap-2 py-1">
          {dateStrip.map((date) => {
            const isSelected = date === selectedDate;
            const dayNum = date.slice(8, 10);
            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={`Select date ${date}`}
                onPress={() => setSelectedDate(date)}
                className={`min-h-[44px] min-w-[48px] items-center justify-center rounded-lg px-2 ${
                  isSelected ? "bg-blue-600" : "bg-neutral-100"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? "text-white" : "text-neutral-800"
                  }`}
                >
                  {dayNum}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {activeHabits.length === 0 ? (
        <View className="flex-1">
          <LivingWorldCanvas
            organisms={organisms}
            tier={motionPrefs.tier}
            reduceMotion={motionPrefs.reduceMotion}
            particleBudget={motionPrefs.particleBudget}
            hapticsEnabled={settings.hapticsEnabled}
            onCompleteOrganism={() => {}}
            onPressOrganism={() => {}}
          />
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <Text variant="heading">No habits yet</Text>
            <Text variant="caption" className="text-center">
              Create your first habit to start tracking daily streaks offline.
            </Text>
            <Button
              label="Create First Habit"
              onPress={() => router.push("/habit/new")}
            />
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <LivingWorldCanvas
            organisms={organisms}
            tier={motionPrefs.tier}
            reduceMotion={motionPrefs.reduceMotion}
            particleBudget={motionPrefs.particleBudget}
            hapticsEnabled={settings.hapticsEnabled}
            onCompleteOrganism={(habitId) => {
              const targetHabit = activeHabits.find((h) => h.id === habitId);
              if (!targetHabit) return;
              const current = logsByHabitId.get(habitId) ?? 0;
              const done = isDayCompleted(
                current,
                targetHabit.type,
                targetHabit.targetValue,
              );
              const nextVal =
                targetHabit.type === "boolean"
                  ? done
                    ? 0
                    : 1
                  : done
                    ? 0
                    : (targetHabit.targetValue ?? 1);
              void onLogValue(habitId, selectedDate, nextVal);
            }}
            onPressOrganism={(habitId) => router.push(`/habit/${habitId}`)}
          />
          {activeHabits.map((habit, index) => renderHabitRow(habit, index))}
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  );
}
