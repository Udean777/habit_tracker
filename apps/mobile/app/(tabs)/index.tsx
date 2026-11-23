import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import type { LocalDate } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import {
  LevelUpModal,
  StreakShieldBanner,
  useGamification,
} from "@/features/gamification";
import {
  DateStrip,
  DraggableQuestList,
  HabitQuestRow,
  OffDayQuestsSection,
  QuestHud,
  computeQuestProgress,
  mapQuestProgressToAvatar,
  useHabitsData,
  useTodayQuests,
  type HabitRecord,
} from "@/features/habits";
import { formatReadableDate } from "@/lib/dateFormat";
import { useMotionPreferences } from "@/lib/motion";
import { useUiStore } from "@/stores/uiStore";

const EMPTY_HABIT_LOGS: readonly { logDate: LocalDate; value: number }[] = [];

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
  const {
    heroProfile,
    freezesByHabitId,
    goldEconomy,
    shieldStats,
    shieldableMisses,
    activateShieldOnMiss,
  } = useGamification(
    activeHabits,
    logs,
    effectiveToday,
    settings.hapticsEnabled,
  );
  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, selectedDate),
    [activeHabits, logs, selectedDate],
  );
  const avatarState = useMemo(
    () =>
      mapQuestProgressToAvatar(
        questProgress,
        heroProfile.avatarClass,
        heroProfile,
      ),
    [questProgress, heroProfile],
  );

  const prevLevelRef = useRef<number | null>(null);
  const [levelUpVisible, setLevelUpVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (
      prevLevelRef.current !== null &&
      questProgress.level > prevLevelRef.current
    ) {
      setLevelUpVisible(true);
    }
    prevLevelRef.current = questProgress.level;
  }, [loading, questProgress.level]);

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
        <Text variant="body" tone="danger">
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
        habitLogs={allLogsByHabitId.get(habit.id) ?? EMPTY_HABIT_LOGS}
        freezeDates={freezesByHabitId.get(habit.id)}
        selectedDate={selectedDate}
        effectiveToday={effectiveToday}
        hapticsEnabled={settings.hapticsEnabled}
        reduceMotion={motionPrefs.reduceMotion}
        onLogValue={onLogValue}
      />
    );
  }

  const topMiss = shieldableMisses[0];
  const topMissHabit = topMiss
    ? activeHabits.find((h) => h.id === topMiss.habitId)
    : undefined;

  const datePrefix = selectedDate === effectiveToday ? "Today" : "Past day";

  return (
    <Screen edges={["top", "left", "right"]} className="pt-2">
      <View className="flex-row items-center justify-between pb-3">
        <View>
          <Text variant="title">Today</Text>
          <Text variant="caption" tabularNums>
            {`${datePrefix} · ${formatReadableDate(selectedDate)}`}
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
            loadout={heroProfile}
            goldBalance={goldEconomy.availableGold}
            availableShields={shieldStats.availableShields}
            onPressShop={() => router.push("/shop")}
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
              loadout={heroProfile}
              goldBalance={goldEconomy.availableGold}
              availableShields={shieldStats.availableShields}
              onPressShop={() => router.push("/shop")}
            />
            {topMiss && topMissHabit ? (
              <StreakShieldBanner
                miss={topMiss}
                habitName={topMissHabit.name}
                availableShields={shieldStats.availableShields}
                onApplyShield={(habitId, missedDate) =>
                  void activateShieldOnMiss(habitId, missedDate)
                }
              />
            ) : null}
          </Animated.View>
          <Animated.View
            entering={
              motionPrefs.reduceMotion
                ? undefined
                : FadeIn.delay(40)
                    .duration(180)
                    .easing(Easing.out(Easing.cubic))
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

      <LevelUpModal
        visible={levelUpVisible}
        level={questProgress.level}
        avatarState={avatarState}
        reduceMotion={motionPrefs.reduceMotion}
        onClose={() => setLevelUpVisible(false)}
      />
    </Screen>
  );
}
