import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useAuthActions } from "@/features/auth";
import {
  computeQuestProgress,
  mapQuestProgressToAvatar,
  useHabitsData,
} from "@/features/habits";
import { ArchivedQuestsSection } from "@/features/settings/components/ArchivedQuestsSection";
import { BackupSection } from "@/features/settings/components/BackupSection";
import { ExperienceSettingsSection } from "@/features/settings/components/ExperienceSettingsSection";
import { HeroProfileCard } from "@/features/settings/components/HeroProfileCard";
import { ScheduleSettingsSection } from "@/features/settings/components/ScheduleSettingsSection";
import { useMotionPreferences } from "@/features/world/qualityTier";
import { useUiStore } from "@/stores/uiStore";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export default function SettingsScreen() {
  const { colors } = useTheme();
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
  const avatarClass = useUiStore((s) => s.avatarClass);
  const setAvatarClass = useUiStore((s) => s.setAvatarClass);
  const motionPrefs = useMotionPreferences(settings);

  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );
  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(questProgress, avatarClass),
    [questProgress, avatarClass],
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    void loadAccountEmail();
  }, [loadAccountEmail]);

  function toggleRow(key: string) {
    setExpandedRow((prev) => (prev === key ? null : key));
  }

  async function handleSyncNow() {
    setSyncMessage("Syncing...");
    const result = await syncNow();
    if (result.kind === "synced") {
      setSyncMessage(`Synced (${result.pushed} pushed, ${result.pulled} pulled)`);
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
        <View
          style={{
            borderRadius: radii.pill,
            backgroundColor:
              pendingOutbox > 0 ? colors.accentBg : colors.surfaceMuted,
          }}
          className="px-3 py-1"
        >
          <Text
            className="text-xs font-bold"
            style={{
              color: pendingOutbox > 0 ? colors.accentText : colors.primary,
            }}
          >
            {pendingOutbox > 0 ? `${pendingOutbox} Pending` : "All Synced"}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 104 }}
      >
        <HeroProfileCard
          avatarState={avatarState}
          questProgress={questProgress}
          avatarClass={avatarClass}
          reduceMotion={motionPrefs.reduceMotion}
          accountEmail={accountEmail}
          syncMessage={syncMessage}
          onSelectAvatarClass={setAvatarClass}
          onSyncNow={() => void handleSyncNow()}
          onSignOut={() => void handleSignOut()}
        />

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
