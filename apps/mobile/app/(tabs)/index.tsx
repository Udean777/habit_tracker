import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import {
  DateStrip,
  DraggableQuestList,
  HabitQuestRow,
  QuestHud,
  computeQuestProgress,
  useHabitsData,
  type HabitRecord,
} from "@/features/habits";
import { parseLocalDateParts } from "@/features/habits/components/DateStrip";
import { OffDayQuestsSection } from "@/features/habits/components/OffDayQuestsSection";
import { useTodayQuests } from "@/features/habits/hooks/useTodayQuests";
import { useMotionPreferences } from "@/features/world/qualityTier";
import { useUiStore } from "@/stores/uiStore";

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
    onReorderHabit,
    refresh,
  } = useHabitsData();

  const motionPrefs = useMotionPreferences(settings);
  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, selectedDate),
    [activeHabits, logs, selectedDate],
  );

  const {
    dateStrip,
    logsByHabitId,
    allLogsByHabitId,
    scheduledHabits,
    offDayHabits,
    isDateFullyCompleted,
  } = useTodayQuests(
    activeHabits,
    logs,
    selectedDate,
    effectiveToday,
    settings.backfillWindowDays,
  );

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

  function renderHabitRow(habit: HabitRecord) {
    return (
      <HabitQuestRow
        habit={habit}
        currentValue={logsByHabitId.get(habit.id) ?? 0}
        habitLogs={allLogsByHabitId.get(habit.id) ?? []}
        selectedDate={selectedDate}
        effectiveToday={effectiveToday}
        hapticsEnabled={settings.hapticsEnabled}
        reduceMotion={motionPrefs.reduceMotion}
        onLogValue={onLogValue}
      />
    );
  }

  const { weekday, dayNum, month } = parseLocalDateParts(selectedDate);
  const datePrefix = selectedDate === effectiveToday ? "Today" : "Past day";

  return (
    <Screen edges={["top", "left", "right"]} className="pt-2">
      <View className="flex-row items-center justify-between pb-3">
        <View>
          <Text variant="title">Today</Text>
          <Text variant="caption" tabularNums>
            {`${datePrefix} · ${weekday}, ${dayNum} ${month}`}
          </Text>
        </View>
        <Button
          label="+ New Habit"
          onPress={() => router.push("/habit/new")}
        />
      </View>

      <DateStrip
        dates={dateStrip}
        selectedDate={selectedDate}
        effectiveToday={effectiveToday}
        isDateFullyCompleted={isDateFullyCompleted}
        onSelectDate={setSelectedDate}
      />

      {activeHabits.length === 0 ? (
        <View className="flex-1">
          <QuestHud
            progress={questProgress}
            reduceMotion={motionPrefs.reduceMotion}
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 104 }}
        >
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
                : FadeIn.delay(40).duration(180).easing(Easing.out(Easing.cubic))
            }
          >
            <DraggableQuestList
              items={scheduledHabits}
              reduceMotion={motionPrefs.reduceMotion}
              onReorder={(id, targetSlot) => {
                const targetHabit = scheduledHabits[targetSlot];
                if (!targetHabit) return;
                const targetIdx = activeHabits.findIndex(
                  (h) => h.id === targetHabit.id,
                );
                if (targetIdx >= 0) {
                  void onReorderHabit(id, targetIdx);
                }
              }}
              renderItem={(item) => renderHabitRow(item)}
            />
          </Animated.View>
          <OffDayQuestsSection
            habits={offDayHabits}
            reduceMotion={motionPrefs.reduceMotion}
            renderRow={renderHabitRow}
          />
        </ScrollView>
      )}
    </Screen>
  );
}
