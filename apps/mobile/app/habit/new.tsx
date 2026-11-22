import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHabitInputSchema,
  type CreateHabitInput,
  type HabitColorKey,
  type HabitIconKey,
  type HabitType,
  type ScheduleType,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { HabitIcon } from "@/components/HabitIcon";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const ICON_KEYS: readonly HabitIconKey[] = [
  "check",
  "book",
  "water",
  "run",
  "code",
  "moon",
  "leaf",
  "flame",
];
const COLOR_KEYS: readonly HabitColorKey[] = [
  "primary",
  "emerald",
  "violet",
  "amber",
  "cyan",
];

export default function NewHabitScreen() {
  const { effectiveToday, onCreateHabit } = useHabitsData();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateHabitInput>({
    resolver: zodResolver(createHabitInputSchema),
    defaultValues: {
      name: "",
      icon: "check",
      color: "primary",
      type: "boolean",
      targetValue: null,
      scheduleType: "daily",
      scheduleDays: 127,
      scheduleTimes: 3,
      reminderTime: null,
      startDate: effectiveToday,
    },
  });

  const habitType = watch("type");
  const scheduleType = watch("scheduleType");
  const scheduleDays = watch("scheduleDays") ?? 127;
  const scheduleTimes = watch("scheduleTimes") ?? 3;
  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  async function onSubmit(data: CreateHabitInput) {
    try {
      setSubmitError(null);
      await onCreateHabit(data);
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save habit",
      );
    }
  }

  function toggleWeekday(isoIndex: number) {
    const bit = 1 << isoIndex;
    const next = (scheduleDays & bit) !== 0 ? scheduleDays & ~bit : scheduleDays | bit;
    setValue("scheduleDays", next === 0 ? bit : next);
  }

  return (
    <Screen className="px-4 pt-3">
      <View className="flex-row items-center justify-between pb-4">
        <Text variant="title">New Habit</Text>
        <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text variant="heading" className="mb-1">
          Name
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Morning Walk"
              className="mb-1 min-h-[44px] rounded-lg border border-neutral-300 px-3 text-base text-neutral-900"
            />
          )}
        />
        {errors.name ? (
          <Text variant="caption" className="mb-3 text-red-600">
            {errors.name.message}
          </Text>
        ) : (
          <View className="mb-3" />
        )}

        <Text variant="heading" className="mb-2">
          Type
        </Text>
        <View className="mb-4 flex-row gap-2">
          {(["boolean", "count", "duration"] as readonly HabitType[]).map(
            (t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`Habit type ${t}`}
                onPress={() => {
                  setValue("type", t);
                  setValue("targetValue", t === "boolean" ? null : 10);
                }}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                  habitType === t ? "bg-blue-600" : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`capitalize font-medium ${
                    habitType === t ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {t}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        {habitType !== "boolean" ? (
          <View className="mb-4">
            <Text variant="heading" className="mb-1">
              Target ({habitType === "duration" ? "minutes" : "count"})
            </Text>
            <Controller
              control={control}
              name="targetValue"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value ? String(value) : ""}
                  keyboardType="number-pad"
                  onChangeText={(txt) => {
                    const num = Number.parseInt(txt, 10);
                    onChange(Number.isFinite(num) && num > 0 ? num : null);
                  }}
                  placeholder="10"
                  className="min-h-[44px] rounded-lg border border-neutral-300 px-3 text-base text-neutral-900"
                />
              )}
            />
          </View>
        ) : null}

        <Text variant="heading" className="mb-2">
          Schedule
        </Text>
        <View className="mb-3 flex-row gap-2">
          {(["daily", "weekdays", "times_per_week"] as readonly ScheduleType[]).map(
            (st) => (
              <Pressable
                key={st}
                accessibilityRole="button"
                accessibilityLabel={`Schedule ${st}`}
                onPress={() => setValue("scheduleType", st)}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-lg px-2 ${
                  scheduleType === st ? "bg-blue-600" : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    scheduleType === st ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {st === "times_per_week" ? "N / week" : st}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        {scheduleType === "weekdays" ? (
          <View className="mb-4 flex-row gap-1">
            {WEEKDAY_LABELS.map((label, idx) => {
              const active = (scheduleDays & (1 << idx)) !== 0;
              return (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle day ${idx + 1}`}
                  onPress={() => toggleWeekday(idx)}
                  className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                    active ? "bg-blue-600" : "bg-neutral-200"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      active ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {scheduleType === "times_per_week" ? (
          <View className="mb-4 flex-row gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`${n} times per week`}
                onPress={() => setValue("scheduleTimes", n)}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                  scheduleTimes === n ? "bg-blue-600" : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    scheduleTimes === n ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text variant="heading" className="mb-2">
          Icon
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {ICON_KEYS.map((iconKey) => {
            const active = selectedIcon === iconKey;
            return (
              <Pressable
                key={iconKey}
                accessibilityRole="button"
                accessibilityLabel={`Icon ${iconKey}`}
                onPress={() => setValue("icon", iconKey)}
                className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 ${
                  active ? "bg-neutral-900" : "bg-neutral-200"
                }`}
              >
                <HabitIcon
                  icon={iconKey}
                  size={20}
                  color={active ? "#FFFFFF" : "#171717"}
                />
              </Pressable>
            );
          })}
        </View>

        <Text variant="heading" className="mb-2">
          Color
        </Text>
        <View className="mb-6 flex-row gap-2">
          {COLOR_KEYS.map((colorKey) => (
            <Pressable
              key={colorKey}
              accessibilityRole="button"
              accessibilityLabel={`Color ${colorKey}`}
              onPress={() => setValue("color", colorKey)}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                selectedColor === colorKey ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            >
              <Text
                className={`capitalize text-xs font-medium ${
                  selectedColor === colorKey ? "text-white" : "text-neutral-900"
                }`}
              >
                {colorKey}
              </Text>
            </Pressable>
          ))}
        </View>

        {submitError ? (
          <Text variant="caption" className="mb-3 text-red-600">
            {submitError}
          </Text>
        ) : null}

        <Button
          label={isSubmitting ? "Saving..." : "Create Habit"}
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
