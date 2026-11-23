import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import type { Settings } from "@habit/shared";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Section, SettingRow } from "./SettingsPrimitives";

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

type ScheduleSettingsSectionProps = {
  readonly settings: Settings;
  readonly expandedRow: string | null;
  readonly onToggleRow: (key: string) => void;
  readonly onCollapse: () => void;
  readonly onUpdateSettings: (patch: Partial<Settings>) => Promise<void>;
};

export function ScheduleSettingsSection({
  settings,
  expandedRow,
  onToggleRow,
  onCollapse,
  onUpdateSettings,
}: ScheduleSettingsSectionProps) {
  const { colors } = useTheme();
  const dayStartLabel = formatMinutes(settings.dayStartOffsetMin);

  return (
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
          onPress={() => onToggleRow("dayStart")}
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
              <Text tabularNums className="text-xs font-bold text-[#2A2140]">
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
                if (Platform.OS !== "ios") onCollapse();
              }}
              onValueChange={(_, selectedDate) => {
                if (Platform.OS !== "ios") onCollapse();
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
        onToggleExpand={() => onToggleRow("backfill")}
        isLast
        onSelect={(backfillWindowDays) =>
          void onUpdateSettings({ backfillWindowDays })
        }
      />
    </Section>
  );
}
