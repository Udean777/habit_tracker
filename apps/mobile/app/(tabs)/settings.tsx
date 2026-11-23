import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, Switch, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import Check from "lucide-react-native/icons/check";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import type { QualityTierMode, ReduceMotionMode, ThemeMode } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useHabitsData } from "@/features/habits";
import { exportAllLocalData } from "@/features/settings";
import { clearAuthTokens, getAuthTokens } from "@/lib/apiClient";
import { runSyncCycle } from "@/sync/syncEngine";
import { colors, radii } from "@/theme/tokens";

const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"];
const MOTION_MODES: readonly ReduceMotionMode[] = ["system", "on", "off"];
const QUALITY_MODES: readonly QualityTierMode[] = ["auto", "high", "medium", "low"];
const BACKFILL_OPTIONS = [7, 14, 30] as const;

function minutesToDate(minutes: number): Date {
  const d = new Date();
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

function formatMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#6B6285]">
        {title}
      </Text>
      <View
        style={{
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingRow<T extends string | number>({
  title,
  subtitle,
  valueLabel,
  options,
  selectedValue,
  expanded,
  onToggleExpand,
  onSelect,
  isLast = false,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly valueLabel: string;
  readonly options: readonly { readonly label: string; readonly value: T }[];
  readonly selectedValue: T;
  readonly expanded: boolean;
  readonly onToggleExpand: () => void;
  readonly onSelect: (value: T) => void;
  readonly isLast?: boolean;
}) {
  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, current value ${valueLabel}`}
        accessibilityState={{ expanded }}
        onPress={onToggleExpand}
        className="min-h-[56px] flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-[#2A2140]">{title}</Text>
          {subtitle ? (
            <Text variant="caption" className="mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              borderRadius: radii.badge,
              backgroundColor: colors.surfaceMuted,
            }}
            className="px-2.5 py-1"
          >
            <Text className="text-xs font-bold capitalize text-[#2A2140]">
              {valueLabel}
            </Text>
          </View>
          {expanded ? (
            <ChevronDown size={16} color={colors.primary} />
          ) : (
            <ChevronRight size={16} color={colors.textSecondary} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View
          style={{ backgroundColor: colors.background }}
          className="gap-1.5 px-4 pb-3 pt-1"
        >
          {options.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <Pressable
                key={String(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(opt.value);
                  onToggleExpand();
                }}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? colors.surfaceMuted
                    : colors.surface,
                }}
                className="min-h-[44px] flex-row items-center justify-between px-3 py-2"
              >
                <Text
                  className={`text-sm capitalize ${
                    isSelected
                      ? "font-bold text-[#2A2140]"
                      : "font-medium text-[#6B6285]"
                  }`}
                >
                  {opt.label}
                </Text>
                {isSelected ? (
                  <Check size={16} color={colors.primary} strokeWidth={2.5} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  function toggleRow(key: string) {
    setExpandedRow((prev) => (prev === key ? null : key));
  }

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

  const dayStartLabel = formatMinutes(settings.dayStartOffsetMin);

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
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Section title="Account & Sync">
          <View className="p-4">
            <Text variant="body" className="font-semibold">
              {accountEmail
                ? accountEmail
                : "Guest Mode (Local Only)"}
            </Text>
            <Text variant="caption" className="mt-0.5">
              {syncMessage ??
                (accountEmail
                  ? "Your quests sync automatically."
                  : "Sign in to back up and sync across devices.")}
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
        </Section>

        <Section title="Experience">
          <SettingRow<ThemeMode>
            title="Theme"
            subtitle="Choose appearance"
            valueLabel={settings.theme}
            selectedValue={settings.theme}
            options={THEME_MODES.map((m) => ({ label: m, value: m }))}
            expanded={expandedRow === "theme"}
            onToggleExpand={() => toggleRow("theme")}
            onSelect={(theme) => void onUpdateSettings({ theme })}
          />
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
            className="min-h-[56px] flex-row items-center justify-between px-4 py-3"
          >
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-[#2A2140]">
                Haptic Feedback
              </Text>
              <Text variant="caption" className="mt-0.5">
                Vibrate when completing quests
              </Text>
            </View>
            <Switch
              accessibilityLabel="Haptic Feedback"
              value={settings.hapticsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              onValueChange={(hapticsEnabled) =>
                void onUpdateSettings({ hapticsEnabled })
              }
            />
          </View>
          <SettingRow<ReduceMotionMode>
            title="Reduce Motion"
            subtitle="Calmer transitions"
            valueLabel={settings.reduceMotion}
            selectedValue={settings.reduceMotion}
            options={MOTION_MODES.map((m) => ({ label: m, value: m }))}
            expanded={expandedRow === "motion"}
            onToggleExpand={() => toggleRow("motion")}
            onSelect={(reduceMotion) => void onUpdateSettings({ reduceMotion })}
          />
          <SettingRow<QualityTierMode>
            title="Visual Quality"
            subtitle="Effects and animation detail"
            valueLabel={settings.qualityTier}
            selectedValue={settings.qualityTier}
            options={QUALITY_MODES.map((m) => ({ label: m, value: m }))}
            expanded={expandedRow === "quality"}
            onToggleExpand={() => toggleRow("quality")}
            isLast
            onSelect={(qualityTier) => void onUpdateSettings({ qualityTier })}
          />
        </Section>

        <Section title="Schedule">
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Day Starts At, current value ${dayStartLabel}`}
              accessibilityState={{ expanded: expandedRow === "dayStart" }}
              onPress={() => toggleRow("dayStart")}
              className="min-h-[56px] flex-row items-center justify-between px-4 py-3"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-[#2A2140]">
                  Day Starts At
                </Text>
                <Text variant="caption" className="mt-0.5">
                  When your daily quest clock resets
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View
                  style={{
                    borderRadius: radii.badge,
                    backgroundColor: colors.surfaceMuted,
                  }}
                  className="px-2.5 py-1"
                >
                  <Text
                    tabularNums
                    className="text-xs font-bold text-[#2A2140]"
                  >
                    {dayStartLabel}
                  </Text>
                </View>
                {expandedRow === "dayStart" ? (
                  <ChevronDown size={16} color={colors.primary} />
                ) : (
                  <ChevronRight size={16} color={colors.textSecondary} />
                )}
              </View>
            </Pressable>

            {expandedRow === "dayStart" ? (
              <View
                style={{ backgroundColor: colors.background }}
                className="px-4 pb-3 pt-1"
              >
                <DateTimePicker
                  value={minutesToDate(settings.dayStartOffsetMin)}
                  mode="time"
                  is24Hour
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onDismiss={() => {
                    if (Platform.OS !== "ios") {
                      setExpandedRow(null);
                    }
                  }}
                  onValueChange={(_, selectedDate) => {
                    if (Platform.OS !== "ios") {
                      setExpandedRow(null);
                    }
                    const rawMins =
                      selectedDate.getHours() * 60 + selectedDate.getMinutes();
                    const mins = Math.min(720, Math.max(0, rawMins));
                    void onUpdateSettings({ dayStartOffsetMin: mins });
                  }}
                />
              </View>
            ) : null}
          </View>
          <SettingRow<number>
            title="Backfill Window"
            subtitle="Past days you can still log"
            valueLabel={`${settings.backfillWindowDays} days`}
            selectedValue={settings.backfillWindowDays}
            options={BACKFILL_OPTIONS.map((d) => ({
              label: `${d} days`,
              value: d,
            }))}
            expanded={expandedRow === "backfill"}
            onToggleExpand={() => toggleRow("backfill")}
            isLast
            onSelect={(backfillWindowDays) =>
              void onUpdateSettings({ backfillWindowDays })
            }
          />
        </Section>

        <Section title={`Archived Quests (${archivedHabits.length})`}>
          {archivedHabits.length === 0 ? (
            <View className="p-4">
              <Text variant="caption">
                No archived habits. Archived quests can be restored here.
              </Text>
            </View>
          ) : (
            archivedHabits.map((habit, idx) => (
              <View
                key={habit.id}
                style={{
                  borderBottomWidth:
                    idx === archivedHabits.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
                className="flex-row items-center justify-between px-4 py-3"
              >
                <Text variant="body" className="font-semibold">
                  {habit.name}
                </Text>
                <Button
                  label="Restore"
                  variant="secondary"
                  onPress={() => void onUnarchiveHabit(habit.id)}
                />
              </View>
            ))
          )}
        </Section>

        <Section title="Backup">
          <View className="gap-3 p-4">
            <Text variant="caption">
              Export your local habits and logs as JSON.
            </Text>
            <Button
              label="Export Local Data (JSON)"
              variant="secondary"
              onPress={() => void handleExport()}
            />
            {exportedJson ? (
              <View
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                }}
                className="p-3"
              >
                <Text variant="caption" numberOfLines={6}>
                  {exportedJson}
                </Text>
              </View>
            ) : null}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  );
}
