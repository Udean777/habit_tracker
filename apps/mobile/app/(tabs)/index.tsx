import { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { router } from "expo-router";
import Check from "lucide-react-native/icons/check";
import {
  addDays,
  computeStreak,
  isDayCompleted,
  isScheduledOnDay,
  type LocalDate,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { HabitIcon } from "@/components/HabitIcon";
import { Screen } from "@/components/Screen";
import { StreakTicker } from "@/components/StreakTicker";
import { Text } from "@/components/Text";
import {
  DraggableQuestList,
  QuestHud,
  computeQuestProgress,
  useHabitsData,
  type HabitRecord,
} from "@/features/habits";
import { useMotionPreferences } from "@/features/world/qualityTier";
import { useUiStore } from "@/stores/uiStore";
import { elevation, habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseLocalDateParts(date: LocalDate) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  return {
    weekday: WEEKDAYS[dt.getUTCDay()] ?? "",
    dayNum: String(d ?? 1),
    month: MONTHS[(m ?? 1) - 1] ?? "",
  };
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const selectedDate = useUiStore((s) => s.selectedDate);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);
  const [showOffDays, setShowOffDays] = useState(false);

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

  const dateStrip = useMemo(() => {
    const pastCount = Math.min(settings.backfillWindowDays, 3);
    const futureCount = 3;
    const total = pastCount + 1 + futureCount;
    return Array.from({ length: total }, (_, idx) =>
      addDays(effectiveToday, idx - pastCount),
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

  function renderHabitRow(habit: HabitRecord) {
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
        style={[
          {
            borderRadius: radii.card,
            borderWidth: 2,
            borderBottomWidth: 4,
            borderColor: isDone ? colors.primary : colors.border,
            backgroundColor: isDone ? colors.surfaceMuted : colors.surface,
            opacity: isDone ? 0.9 : 1,
          },
          !isDone && scheduled ? elevation.card : undefined,
        ]}
        className="mb-3 p-4"
      >
        <View className="flex-row items-center justify-between gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${habit.name}`}
            onPress={() => router.push(`/habit/${habit.id}`)}
            className="min-h-[44px] flex-1 justify-center"
          >
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radii.button,
                  backgroundColor: habitAccents[habit.color],
                }}
                className="items-center justify-center"
              >
                <HabitIcon icon={habit.icon} size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text variant="heading" numberOfLines={1}>
                  {habit.name}
                </Text>
                <View className="mt-0.5 flex-row items-center gap-1.5">
                  <View
                    style={{
                      borderRadius: radii.badge,
                      backgroundColor: isDone
                        ? colors.primary
                        : colors.accentBg,
                    }}
                    className="px-1.5 py-0.5"
                  >
                    <Text
                      className={`text-[10px] font-extrabold ${
                        isDone ? "text-white" : "text-[#2A2140]"
                      }`}
                    >
                      {isDone ? "CLAIMED" : "+25 XP"}
                    </Text>
                  </View>
                  <Text variant="caption" tabularNums numberOfLines={1} className="shrink">
                    {progressLabel}
                  </Text>
                  <StreakTicker
                    streak={streak.currentStreak}
                    reduceMotion={motionPrefs.reduceMotion}
                  />
                  {!scheduled ? <Text variant="caption">(off)</Text> : null}
                </View>
              </View>
            </View>
          </Pressable>

          <View className="flex-row items-center gap-1">
            {habit.type === "boolean" ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
                accessibilityLabel={
                  isDone ? `Uncheck ${habit.name}` : `Complete ${habit.name}`
                }
                onPress={() => {
                  if (!isDone && settings.hapticsEnabled) {
                    void Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Medium,
                    ).catch(() => {});
                  }
                  void onLogValue(habit.id, selectedDate, isDone ? 0 : 1);
                }}
                style={{
                  borderRadius: radii.button,
                  backgroundColor: isDone ? colors.primary : colors.surface,
                  borderWidth: 2,
                  borderBottomWidth: 4,
                  borderColor: isDone
                    ? colors.primaryPressed
                    : colors.borderStrong,
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
              >
                {isDone ? (
                  <Check size={22} color="#FFFFFF" strokeWidth={3} />
                ) : null}
              </Pressable>
            ) : isDone ? (
              <View
                style={{
                  borderRadius: radii.button,
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderBottomWidth: 4,
                  borderColor: colors.primaryPressed,
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
              >
                <Check size={22} color="#FFFFFF" strokeWidth={3} />
              </View>
            ) : (
              <View className="flex-row items-center gap-1.5">
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
                  style={{
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    backgroundColor: colors.surface,
                  }}
                  className="min-h-[44px] min-w-[44px] items-center justify-center"
                >
                  <Text className="text-lg font-bold text-[#2A2140]">-</Text>
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
        </View>
      </View>
    );
  }

  const scheduledHabits = activeHabits.filter((h) =>
    isScheduledOnDay(
      {
        type: h.scheduleType,
        daysBitmask: h.scheduleDays,
        timesPerWeek: h.scheduleTimes,
      },
      selectedDate,
    ),
  );
  const offDayHabits = activeHabits.filter(
    (h) =>
      !isScheduledOnDay(
        {
          type: h.scheduleType,
          daysBitmask: h.scheduleDays,
          timesPerWeek: h.scheduleTimes,
        },
        selectedDate,
      ),
  );

  function isDateFullyCompleted(date: LocalDate): boolean {
    if (activeHabits.length === 0) return false;
    let scheduledCount = 0;
    for (const h of activeHabits) {
      const scheduled = isScheduledOnDay(
        {
          type: h.scheduleType,
          daysBitmask: h.scheduleDays,
          timesPerWeek: h.scheduleTimes,
        },
        date,
      );
      if (!scheduled) continue;
      scheduledCount += 1;
      const val =
        logs.find((l) => l.habitId === h.id && l.logDate === date)?.value ?? 0;
      if (!isDayCompleted(val, h.type, h.targetValue)) return false;
    }
    return scheduledCount > 0;
  }

  return (
    <Screen edges={["top", "left", "right"]} className="pt-2">
      <View className="flex-row items-center justify-between pb-3">
        <View>
          <Text variant="title">Today</Text>
          <Text variant="caption" tabularNums>
            {(() => {
              const { weekday, dayNum, month } =
                parseLocalDateParts(selectedDate);
              const prefix =
                selectedDate === effectiveToday ? "Today" : "Past day";
              return `${prefix} · ${weekday}, ${dayNum} ${month}`;
            })()}
          </Text>
        </View>
        <Button
          label="+ New Habit"
          onPress={() => router.push("/habit/new")}
        />
      </View>

      <View className="mb-3 flex-row justify-between gap-1.5 py-1">
        {dateStrip.map((date) => {
          const isSelected = date === selectedDate;
          const isFuture = date > effectiveToday;
          const { weekday, dayNum } = parseLocalDateParts(date);
          const allDone = !isFuture && isDateFullyCompleted(date);
          return (
            <Pressable
              key={date}
              disabled={isFuture}
              accessibilityRole="button"
              accessibilityLabel={`Select date ${date}`}
              accessibilityState={{ disabled: isFuture, selected: isSelected }}
              onPress={() => {
                if (!isFuture) setSelectedDate(date);
              }}
              style={{
                borderRadius: radii.pill,
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: isSelected
                  ? colors.primaryPressed
                  : colors.border,
                borderBottomWidth: isSelected ? 3 : 1,
                opacity: isFuture ? 0.4 : 1,
              }}
              className="min-h-[52px] flex-1 items-center justify-center py-1"
            >
              <Text
                className={`text-[10px] font-semibold uppercase ${
                  isSelected ? "text-white/80" : "text-[#6B6285]"
                }`}
              >
                {weekday}
              </Text>
              <Text
                tabularNums
                className={`text-sm font-bold ${
                  isSelected ? "text-white" : "text-[#2A2140]"
                }`}
              >
                {dayNum}
              </Text>
              {allDone ? (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: radii.pill,
                    backgroundColor: isSelected ? "#FFFFFF" : colors.accent,
                    marginTop: 2,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

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
          {offDayHabits.length > 0 ? (
            <Animated.View
              layout={
                motionPrefs.reduceMotion
                  ? undefined
                  : LinearTransition.duration(180).easing(Easing.out(Easing.cubic))
              }
              className="mt-2 pb-6"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  showOffDays
                    ? "Hide off-day habits"
                    : "Show off-day habits"
                }
                onPress={() => setShowOffDays((prev) => !prev)}
                style={{
                  borderRadius: radii.button,
                  backgroundColor: colors.surfaceMuted,
                }}
                className="mb-2 min-h-[44px] flex-row items-center justify-between px-3"
              >
                <Text variant="caption" className="font-semibold">
                  Off-day habits ({offDayHabits.length})
                </Text>
                <Text variant="caption" className="font-semibold">
                  {showOffDays ? "Hide" : "Show"}
                </Text>
              </Pressable>
              {showOffDays
                ? offDayHabits.map((habit) => (
                    <Animated.View
                      key={habit.id}
                      entering={
                        motionPrefs.reduceMotion
                          ? undefined
                          : FadeIn.duration(160).easing(Easing.out(Easing.cubic))
                      }
                    >
                      {renderHabitRow(habit)}
                    </Animated.View>
                  ))
                : null}
            </Animated.View>
          ) : (
            <View className="h-6" />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
