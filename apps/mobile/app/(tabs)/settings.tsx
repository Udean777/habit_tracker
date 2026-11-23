import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Badge } from "@/components/Badge";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useAuthActions } from "@/features/auth";
import { useGamification } from "@/features/gamification";
import {
  computeQuestProgress,
  mapQuestProgressToAvatar,
  useHabitsData,
} from "@/features/habits";
import {
  ArchivedQuestsSection,
  BackupSection,
  ExperienceSettingsSection,
  HeroProfileCard,
  ScheduleSettingsSection,
} from "@/features/settings";
import {
  FEATURE_TOUR_STEPS,
  TourTarget,
  useTourStore,
} from "@/features/tour";
import { useMotionPreferences } from "@/lib/motion";

export default function SettingsScreen() {
  const {
    activeHabits,
    logs,
    effectiveToday,
    settings,
    archivedHabits,
    pendingOutbox,
    onUpdateSettings,
    onUnarchiveHabit,
    refresh,
  } = useHabitsData();
  const { accountEmail, loadAccountEmail, signOut, syncNow } = useAuthActions();
  const { heroProfile, selectAvatarClass } = useGamification(
    activeHabits,
    logs,
    effectiveToday,
    settings.hapticsEnabled,
  );
  const motionPrefs = useMotionPreferences(settings);

  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
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
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const tourOpen = useTourStore((s) => s.isOpen);
  const tourStepIndex = useTourStore((s) => s.stepIndex);

  useFocusEffect(
    useCallback(() => {
      void loadAccountEmail();
    }, [loadAccountEmail]),
  );

  useEffect(() => {
    if (
      tourOpen &&
      FEATURE_TOUR_STEPS[tourStepIndex]?.id === "settings_hero"
    ) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [tourOpen, tourStepIndex]);

  function toggleRow(key: string) {
    setExpandedRow((prev) => (prev === key ? null : key));
  }

  async function handleSyncNow() {
    setSyncMessage("Syncing...");
    const result = await syncNow();
    if (result.kind === "synced") {
      setSyncMessage(
        `Synced (${result.pushed} pushed, ${result.pulled} pulled)`,
      );
    } else if (result.kind === "signed_out") {
      setSyncMessage("Signed out");
    } else {
      setSyncMessage(result.message);
    }
  }

  async function handleSignOut() {
    await signOut();
    setSyncMessage("Signed out (local data kept)");
  }

  return (
    <Screen edges={["top", "left", "right"]} className="pt-2">
      <View className="flex-row items-center justify-between pb-4">
        <Text variant="title">Settings</Text>
        <Badge
          label={pendingOutbox > 0 ? `${pendingOutbox} Pending` : "All Synced"}
          variant={pendingOutbox > 0 ? "accent" : "muted"}
          pill
          className="px-3 py-1"
          textClassName="text-xs font-bold"
        />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 104 }}
      >
        <TourTarget id="settings_hero">
          <HeroProfileCard
            avatarState={avatarState}
            questProgress={questProgress}
            avatarClass={heroProfile.avatarClass}
            reduceMotion={motionPrefs.reduceMotion}
            accountEmail={accountEmail}
            syncMessage={syncMessage}
            onSelectAvatarClass={(cls) => void selectAvatarClass(cls)}
            onSyncNow={() => void handleSyncNow()}
            onSignOut={() => void handleSignOut()}
          />
        </TourTarget>

        <ExperienceSettingsSection
          settings={settings}
          expandedRow={expandedRow}
          onToggleRow={toggleRow}
          onUpdateSettings={onUpdateSettings}
        />

        <ScheduleSettingsSection
          settings={settings}
          expandedRow={expandedRow}
          onToggleRow={toggleRow}
          onCollapse={() => setExpandedRow(null)}
          onUpdateSettings={onUpdateSettings}
        />

        <ArchivedQuestsSection
          archivedHabits={archivedHabits}
          onUnarchive={onUnarchiveHabit}
        />

        <BackupSection onRefresh={refresh} />
      </ScrollView>
    </Screen>
  );
}
