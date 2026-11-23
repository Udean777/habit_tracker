import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHabitInputSchema,
  type CreateHabitInput,
  type HabitColorKey,
  type HabitIconKey,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { HabitIcon } from "@/components/HabitIcon";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

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
  const { colors } = useTheme();
  const { effectiveToday, onCreateHabit } = useHabitsData();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
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

  const habitType = useWatch({ control, name: "type" });
  const scheduleType = useWatch({ control, name: "scheduleType" });
  const scheduleDays = useWatch({ control, name: "scheduleDays" }) ?? 127;
  const scheduleTimes = useWatch({ control, name: "scheduleTimes" }) ?? 3;
  const selectedColor = useWatch({ control, name: "color" });
  const selectedIcon = useWatch({ control, name: "icon" });

  async function onSubmit(data: CreateHabitInput) {
    try {
      setSubmitError(null);
      await onCreateHabit(data);
      router.back();
    } catch {
      setSubmitError(
        "Could not save your quest. Please check your inputs and try again.",
      );
    }
  }

  function toggleWeekday(isoIndex: number) {
    const bit = 1 << isoIndex;
    const next = (scheduleDays & bit) !== 0 ? scheduleDays & ~bit : scheduleDays | bit;
    setValue("scheduleDays", next === 0 ? bit : next);
  }

  return (
    <Screen className="pt-3">
      <View className="flex-row items-center justify-between pb-4">
        <Text variant="title">New Quest</Text>
        <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text variant="heading" className="mb-1.5">
            Quest Name
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Morning Walk"
                placeholderTextColor={colors.textSecondary}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                }}
                className="mb-1 min-h-[44px] px-3 text-base"
              />
            )}
          />
          {errors.name ? (
            <Text variant="caption" className="mb-3" style={{ color: colors.danger }}>
              {errors.name.message}
            </Text>
          ) : (
            <View className="mb-3" />
          )}

          <Text variant="heading" className="mb-2">
            Type
          </Text>
          <View className="mb-4 flex-row gap-2">
            {(
              [
                { value: "boolean", label: "Check-off" },
                { value: "count", label: "Counter" },
                { value: "duration", label: "Timer" },
              ] as const
            ).map(({ value: t, label }) => {
              const active = habitType === t;
              return (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  accessibilityLabel={`Quest type ${label}`}
                  onPress={() => {
                    setValue("type", t);
                    setValue("targetValue", t === "boolean" ? null : 10);
                  }}
                  style={{
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderBottomWidth: active ? 3 : 1,
                    borderColor: active
                      ? colors.primaryPressed
                      : colors.borderStrong,
                    backgroundColor: active ? colors.primary : colors.surface,
                  }}
                  className="min-h-[44px] flex-1 items-center justify-center"
                >
                  <Text
                    className={`font-semibold ${
                      active ? "text-white" : "text-[#2A2140]"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {habitType !== "boolean" ? (
            <Animated.View
              entering={FadeIn.duration(160).easing(Easing.out(Easing.cubic))}
              className="mb-4"
            >
              <Text variant="heading" className="mb-1.5">
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
                    placeholderTextColor={colors.textSecondary}
                    style={{
                      borderRadius: radii.button,
                      borderWidth: 1,
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                    }}
                    className="min-h-[44px] px-3 text-base"
                  />
                )}
              />
            </Animated.View>
          ) : null}

          <Animated.View
            layout={LinearTransition.duration(180).easing(Easing.out(Easing.cubic))}
          >
            <Text variant="heading" className="mb-2">
              Schedule
            </Text>
          <View className="mb-3 flex-row gap-2">
            {(
              [
                { value: "daily", label: "Every day" },
                { value: "weekdays", label: "Specific days" },
                { value: "times_per_week", label: "Times / week" },
              ] as const
            ).map(({ value: st, label }) => {
              const active = scheduleType === st;
              return (
                <Pressable
                  key={st}
                  accessibilityRole="button"
                  accessibilityLabel={`Schedule ${label}`}
                  onPress={() => setValue("scheduleType", st)}
                  style={{
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderBottomWidth: active ? 3 : 1,
                    borderColor: active
                      ? colors.primaryPressed
                      : colors.borderStrong,
                    backgroundColor: active ? colors.primary : colors.surface,
                  }}
                  className="min-h-[44px] flex-1 items-center justify-center px-2"
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-[#2A2140]"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
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
                  style={{
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderBottomWidth: active ? 3 : 1,
                    borderColor: active
                      ? colors.primaryPressed
                      : colors.borderStrong,
                    backgroundColor: active ? colors.primary : colors.surface,
                  }}
                  className="min-h-[44px] flex-1 items-center justify-center"
                >
                  <Text
                    className={`font-semibold ${
                      active ? "text-white" : "text-[#2A2140]"
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
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderBottomWidth: scheduleTimes === n ? 3 : 1,
                  borderColor:
                    scheduleTimes === n
                      ? colors.primaryPressed
                      : colors.borderStrong,
                  backgroundColor:
                    scheduleTimes === n ? colors.primary : colors.surface,
                }}
                className="min-h-[44px] flex-1 items-center justify-center"
              >
                <Text
                  className={`font-semibold ${
                    scheduleTimes === n ? "text-white" : "text-[#2A2140]"
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
            const activeBg = habitAccents[selectedColor];
            return (
              <Pressable
                key={iconKey}
                accessibilityRole="button"
                accessibilityLabel={`Icon ${iconKey}`}
                onPress={() => setValue("icon", iconKey)}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderBottomWidth: active ? 3 : 1,
                  borderColor: active ? colors.textPrimary : colors.borderStrong,
                  backgroundColor: active ? activeBg : colors.surface,
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center px-3"
              >
                <HabitIcon
                  icon={iconKey}
                  size={20}
                  color={active ? "#FFFFFF" : colors.textPrimary}
                />
              </Pressable>
            );
          })}
        </View>

        <Text variant="heading" className="mb-2">
          Color
        </Text>
        <View className="mb-6 flex-row gap-3">
          {COLOR_KEYS.map((colorKey) => {
            const active = selectedColor === colorKey;
            return (
              <Pressable
                key={colorKey}
                accessibilityRole="button"
                accessibilityLabel={`Color ${colorKey}`}
                accessibilityState={{ selected: active }}
                onPress={() => setValue("color", colorKey)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.pill,
                  backgroundColor: habitAccents[colorKey],
                  borderWidth: active ? 3 : 1,
                  borderColor: active ? colors.textPrimary : colors.border,
                }}
                className="items-center justify-center"
              />
            );
          })}
        </View>

        {submitError ? (
          <Text variant="caption" className="mb-3 text-red-600">
            {submitError}
          </Text>
        ) : null}

        <Button
          label={isSubmitting ? "Saving..." : "Create Quest"}
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <View className="h-8" />
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
