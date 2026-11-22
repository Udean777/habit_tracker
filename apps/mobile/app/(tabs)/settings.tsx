import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import type { QualityTierMode, ReduceMotionMode, ThemeMode } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { exportAllLocalData } from "@/features/settings";
import { clearAuthTokens, getAuthTokens } from "@/lib/apiClient";
import { runSyncCycle } from "@/sync/syncEngine";

const DAY_START_OPTIONS = [
  { label: "00:00", minutes: 0 },
  { label: "02:00", minutes: 120 },
  { label: "04:00", minutes: 240 },
  { label: "06:00", minutes: 360 },
] as const;

const BACKFILL_OPTIONS = [7, 14, 30] as const;

export default function SettingsScreen() {
  const {
    settings,
    archivedHabits,
    pendingOutbox,
    onUpdateSettings,
    onUnarchiveHabit,
    refresh,
  } = useHabitsData();
  const [exportedJson, setExportedJson] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    void getAuthTokens().then((auth) => {
      setAccountEmail(auth?.email ?? null);
    });
  }, []);

  async function handleExport() {
    const json = await exportAllLocalData();
    setExportedJson(json);
  }

  async function handleSyncNow() {
    setSyncMessage("Syncing...");
    const result = await runSyncCycle();
    if (result.kind === "synced") {
      setSyncMessage(`Synced (${result.pushed} pushed, ${result.pulled} pulled)`);
      refresh();
    } else if (result.kind === "signed_out") {
      setAccountEmail(null);
      setSyncMessage("Signed out");
    } else {
      setSyncMessage(result.message);
    }
  }

  async function handleSignOut() {
    await clearAuthTokens();
    setAccountEmail(null);
    setSyncMessage("Signed out (local data kept)");
  }

  return (
    <Screen className="px-4 pt-3">
      <Text variant="title" className="pb-3">
        Settings
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text variant="heading" className="mb-2">
          Account & Sync
        </Text>
        <View className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <Text variant="body">
            {accountEmail
              ? `Signed in as ${accountEmail}`
              : "Guest mode (local only)"}
          </Text>
          <Text variant="caption" className="mt-1">
            Pending outbox: {pendingOutbox}
            {syncMessage ? ` | ${syncMessage}` : ""}
          </Text>
          <View className="mt-3 flex-row gap-2">
            {accountEmail ? (
              <>
                <Button
                  label="Sync Now"
                  className="flex-1"
                  onPress={() => void handleSyncNow()}
                />
                <Button
                  label="Sign Out"
                  variant="secondary"
                  className="flex-1"
                  onPress={() => void handleSignOut()}
                />
              </>
            ) : (
              <Button
                label="Sign In / Register"
                className="flex-1"
                onPress={() => router.push("/auth/login")}
              />
            )}
          </View>
        </View>

        <Text variant="heading" className="mb-2">
          Theme
        </Text>
        <View className="mb-4 flex-row gap-2">
          {(["system", "light", "dark"] as readonly ThemeMode[]).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityLabel={`Theme ${mode}`}
              onPress={() => void onUpdateSettings({ theme: mode })}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                settings.theme === mode ? "bg-blue-600" : "bg-neutral-200"
              }`}
            >
              <Text
                className={`capitalize font-medium ${
                  settings.theme === mode ? "text-white" : "text-neutral-900"
                }`}
              >
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="heading" className="mb-2">
          Haptics
        </Text>
        <View className="mb-4 flex-row gap-2">
          {[true, false].map((enabled) => (
            <Pressable
              key={String(enabled)}
              accessibilityRole="button"
              accessibilityLabel={`Haptics ${enabled ? "On" : "Off"}`}
              onPress={() => void onUpdateSettings({ hapticsEnabled: enabled })}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                settings.hapticsEnabled === enabled
                  ? "bg-blue-600"
                  : "bg-neutral-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  settings.hapticsEnabled === enabled
                    ? "text-white"
                    : "text-neutral-900"
                }`}
              >
                {enabled ? "On" : "Off"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="heading" className="mb-2">
          Reduce Motion
        </Text>
        <View className="mb-4 flex-row gap-2">
          {(["system", "on", "off"] as readonly ReduceMotionMode[]).map(
            (mode) => (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`Reduce motion ${mode}`}
                onPress={() => void onUpdateSettings({ reduceMotion: mode })}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                  settings.reduceMotion === mode
                    ? "bg-blue-600"
                    : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`capitalize font-medium ${
                    settings.reduceMotion === mode
                      ? "text-white"
                      : "text-neutral-900"
                  }`}
                >
                  {mode}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        <Text variant="heading" className="mb-2">
          Visual Quality Tier
        </Text>
        <View className="mb-4 flex-row gap-2">
          {(["auto", "high", "medium", "low"] as readonly QualityTierMode[]).map(
            (tier) => (
              <Pressable
                key={tier}
                accessibilityRole="button"
                accessibilityLabel={`Quality tier ${tier}`}
                onPress={() => void onUpdateSettings({ qualityTier: tier })}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                  settings.qualityTier === tier
                    ? "bg-blue-600"
                    : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`capitalize font-medium ${
                    settings.qualityTier === tier
                      ? "text-white"
                      : "text-neutral-900"
                  }`}
                >
                  {tier}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        <Text variant="heading" className="mb-2">
          Day Starts At
        </Text>
        <View className="mb-4 flex-row gap-2">
          {DAY_START_OPTIONS.map((opt) => (
            <Pressable
              key={opt.minutes}
              accessibilityRole="button"
              accessibilityLabel={`Day starts at ${opt.label}`}
              onPress={() =>
                void onUpdateSettings({ dayStartOffsetMin: opt.minutes })
              }
              className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                settings.dayStartOffsetMin === opt.minutes
                  ? "bg-blue-600"
                  : "bg-neutral-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  settings.dayStartOffsetMin === opt.minutes
                    ? "text-white"
                    : "text-neutral-900"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="heading" className="mb-2">
          Backfill Window (Days)
        </Text>
        <View className="mb-4 flex-row gap-2">
          {BACKFILL_OPTIONS.map((days) => (
            <Pressable
              key={days}
              accessibilityRole="button"
              accessibilityLabel={`Backfill window ${days} days`}
              onPress={() =>
                void onUpdateSettings({ backfillWindowDays: days })
              }
              className={`min-h-[44px] flex-1 items-center justify-center rounded-lg ${
                settings.backfillWindowDays === days
                  ? "bg-blue-600"
                  : "bg-neutral-200"
              }`}
            >
              <Text
                className={`font-medium ${
                  settings.backfillWindowDays === days
                    ? "text-white"
                    : "text-neutral-900"
                }`}
              >
                {days}d
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="heading" className="mb-2">
          Archived Habits ({archivedHabits.length})
        </Text>
        {archivedHabits.length === 0 ? (
          <Text variant="caption" className="mb-4">
            No archived habits.
          </Text>
        ) : (
          <View className="mb-4 gap-2">
            {archivedHabits.map((habit) => (
              <View
                key={habit.id}
                className="flex-row items-center justify-between rounded-lg border border-neutral-200 p-3"
              >
                <Text variant="body">{habit.name}</Text>
                <Button
                  label="Unarchive"
                  variant="secondary"
                  onPress={() => void onUnarchiveHabit(habit.id)}
                />
              </View>
            ))}
          </View>
        )}

        <Text variant="heading" className="mb-2">
          Data Export
        </Text>
        <Button label="Export Local Data (JSON)" onPress={handleExport} />
        {exportedJson ? (
          <View className="mt-3 rounded-lg bg-neutral-100 p-3">
            <Text variant="caption" numberOfLines={8}>
              {exportedJson}
            </Text>
          </View>
        ) : null}
        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
