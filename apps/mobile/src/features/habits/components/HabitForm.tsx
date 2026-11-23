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
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHabitInputSchema,
  type CreateHabitInput,
  type LocalDate,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { HabitAppearanceFields } from "./HabitAppearanceFields";
import { HabitScheduleFields } from "./HabitScheduleFields";

type HabitFormProps = {
  readonly effectiveToday: LocalDate;
  readonly onSubmitHabit: (data: CreateHabitInput) => Promise<void>;
};

export function HabitForm({ effectiveToday, onSubmitHabit }: HabitFormProps) {
  const { colors } = useTheme();
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
      await onSubmitHabit(data);
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

  const inputStyle = {
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  };

  return (
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
              style={inputStyle}
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
                  style={inputStyle}
                  className="min-h-[44px] px-3 text-base"
                />
              )}
            />
          </Animated.View>
        ) : null}

        <Animated.View
          layout={LinearTransition.duration(180).easing(Easing.out(Easing.cubic))}
        >
          <HabitScheduleFields
            scheduleType={scheduleType}
            scheduleDays={scheduleDays}
            scheduleTimes={scheduleTimes}
            onChangeScheduleType={(st) => setValue("scheduleType", st)}
            onToggleWeekday={toggleWeekday}
            onChangeScheduleTimes={(n) => setValue("scheduleTimes", n)}
          />

          <HabitAppearanceFields
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onSelectIcon={(iconKey) => setValue("icon", iconKey)}
            onSelectColor={(colorKey) => setValue("color", colorKey)}
          />

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
  );
}
