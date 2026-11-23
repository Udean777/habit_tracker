import { useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import type { AvatarClass } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { updateHeroProfile } from "@/features/gamification";
import { useHabitsData } from "@/features/habits";
import {
  markOnboardingCompleted,
  OnboardingHeroStep,
  OnboardingQuestDemoStep,
  OnboardingRewardsStep,
  OnboardingStarterQuestsStep,
  STARTER_QUEST_PRESETS,
} from "@/features/onboarding";
import { triggerHaptic } from "@/lib/haptics";
import { useMotionPreferences } from "@/lib/motion";
import { useUiStore } from "@/stores/uiStore";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { activeHabits, effectiveToday, settings, onCreateHabit } =
    useHabitsData();
  const motionPrefs = useMotionPreferences(settings);
  const initialClass = useUiStore((s) => s.avatarClass);
  const setAvatarClassUi = useUiStore((s) => s.setAvatarClass);
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);

  const [step, setStep] = useState(0);
  const [avatarClass, setAvatarClass] = useState<AvatarClass>(initialClass);
  const [heroTrigger, setHeroTrigger] = useState(0);
  const [demoDone, setDemoDone] = useState(false);
  const [selectedQuests, setSelectedQuests] = useState<readonly string[]>([
    "Morning Walk",
    "Read 20m",
  ]);
  const [saving, setSaving] = useState(false);

  const isLastStep = step === TOTAL_STEPS - 1;

  function handleSelectClass(cls: AvatarClass) {
    triggerHaptic("selection", settings.hapticsEnabled);
    setAvatarClass(cls);
    setHeroTrigger((n) => n + 1);
  }

  function handleToggleDemo() {
    triggerHaptic(demoDone ? "light" : "success", settings.hapticsEnabled);
    setDemoDone((prev) => !prev);
  }

  function handleToggleQuest(name: string) {
    triggerHaptic("selection", settings.hapticsEnabled);
    setSelectedQuests((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  async function finishOnboarding(createSelected: boolean) {
    setSaving(true);
    try {
      setAvatarClassUi(avatarClass);
      await updateHeroProfile({ avatarClass });

      if (createSelected && selectedQuests.length > 0) {
        const existingNames = new Set(
          activeHabits.map((h) => h.name.toLowerCase()),
        );
        for (const preset of STARTER_QUEST_PRESETS) {
          if (
            selectedQuests.includes(preset.name) &&
            !existingNames.has(preset.name.toLowerCase())
          ) {
            await onCreateHabit({ ...preset, startDate: effectiveToday });
          }
        }
      }

      await markOnboardingCompleted();
      bumpDataVersion();
      triggerHaptic("success", settings.hapticsEnabled);
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen className="pt-3 pb-4">
      <View className="mb-4 flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, idx) => {
            const active = idx <= step;
            return (
              <View
                key={idx}
                style={{
                  height: 6,
                  borderRadius: radii.pill,
                  backgroundColor: active
                    ? colors.primary
                    : colors.surfaceMuted,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.border,
                }}
                className="flex-1"
              />
            );
          })}
        </View>

        <Text variant="caption" tabularNums className="font-bold">
          {step + 1} / {TOTAL_STEPS}
        </Text>

        {!isLastStep ? (
          <Button
            label="Skip"
            variant="secondary"
            disabled={saving}
            onPress={() => void finishOnboarding(false)}
          />
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <Animated.View
          key={step}
          entering={
            motionPrefs.reduceMotion
              ? undefined
              : FadeIn.duration(180).easing(Easing.out(Easing.cubic))
          }
          className="flex-1"
        >
          {step === 0 ? (
            <OnboardingHeroStep
              avatarClass={avatarClass}
              triggerKey={heroTrigger}
              reduceMotion={motionPrefs.reduceMotion}
              onSelectClass={handleSelectClass}
            />
          ) : step === 1 ? (
            <OnboardingQuestDemoStep
              avatarClass={avatarClass}
              demoDone={demoDone}
              reduceMotion={motionPrefs.reduceMotion}
              onToggleDemo={handleToggleDemo}
            />
          ) : step === 2 ? (
            <OnboardingRewardsStep
              avatarClass={avatarClass}
              reduceMotion={motionPrefs.reduceMotion}
              onInteractionHaptic={() =>
                triggerHaptic("selection", settings.hapticsEnabled)
              }
            />
          ) : (
            <OnboardingStarterQuestsStep
              selectedNames={selectedQuests}
              onTogglePreset={handleToggleQuest}
            />
          )}
        </Animated.View>
      </ScrollView>

      <View className="flex-row gap-2.5 pt-2">
        {step > 0 ? (
          <Button
            label="Back"
            variant="secondary"
            className="w-28"
            disabled={saving}
            onPress={() => {
              triggerHaptic("light", settings.hapticsEnabled);
              setStep((s) => Math.max(0, s - 1));
            }}
          />
        ) : null}

        {isLastStep ? (
          <Button
            label={
              saving
                ? "Starting..."
                : selectedQuests.length > 0
                  ? `Start (${selectedQuests.length} Quests)`
                  : "Start Empty"
            }
            className="flex-1"
            disabled={saving}
            onPress={() => void finishOnboarding(true)}
          />
        ) : (
          <Button
            label="Next"
            className="flex-1"
            onPress={() => {
              triggerHaptic("light", settings.hapticsEnabled);
              setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
            }}
          />
        )}
      </View>
    </Screen>
  );
}
