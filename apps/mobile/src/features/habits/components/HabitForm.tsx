import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  type HabitType,
  type LocalDate,
} from "@habit/shared";
import { Button } from "@/components/Button";
import { SelectableChip } from "@/components/SelectableChip";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { HabitAppearanceFields } from "./HabitAppearanceFields";
import { HabitScheduleFields } from "./HabitScheduleFields";

const HABIT_TYPE_OPTIONS: readonly {
  readonly value: HabitType;
  readonly label: string;
}[] = [
  { value: "boolean", label: "Check-off" },
  { value: "count", label: "Counter" },
  { value: "duration", label: "Timer" },
];

type HabitFormProps = {
  readonly effectiveToday: LocalDate;
  readonly onSubmitHabit: (data: CreateHabitInput) => Promise<void>;
};

export function HabitForm({ effectiveToday, onSubmitHabit }: HabitFormProps) {
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
    const next =
      (scheduleDays & bit) !== 0 ? scheduleDays & ~bit : scheduleDays | bit;
    setValue("scheduleDays", next === 0 ? bit : next);
  }

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
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Quest Name"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Morning Walk"
              error={errors.name?.message}
            />
          )}
        />

        <Text variant="heading" className="mb-2">
          Type
        </Text>
        <View className="mb-4 flex-row gap-2">
          {HABIT_TYPE_OPTIONS.map(({ value: t, label }) => (
            <SelectableChip
              key={t}
              label={label}
              selected={habitType === t}
              accessibilityLabel={`Quest type ${label}`}
              onPress={() => {
                setValue("type", t);
                setValue("targetValue", t === "boolean" ? null : 10);
              }}
            />
          ))}
        </View>

        {habitType !== "boolean" ? (
          <Animated.View
            entering={FadeIn.duration(160).easing(Easing.out(Easing.cubic))}
          >
            <Controller
              control={control}
              name="targetValue"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label={`Target (${habitType === "duration" ? "minutes" : "count"})`}
                  value={value ? String(value) : ""}
                  keyboardType="number-pad"
                  onChangeText={(txt) => {
                    const num = Number.parseInt(txt, 10);
                    onChange(Number.isFinite(num) && num > 0 ? num : null);
                  }}
                  placeholder="10"
                />
              )}
            />
          </Animated.View>
        ) : null}

        <Animated.View
          layout={LinearTransition.duration(180).easing(
            Easing.out(Easing.cubic),
          )}
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
            <Text variant="caption" tone="danger" className="mb-3">
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
