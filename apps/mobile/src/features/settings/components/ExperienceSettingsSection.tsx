import { Switch, View } from "react-native";
import type {
  QualityTierMode,
  ReduceMotionMode,
  Settings,
  ThemeMode,
} from "@habit/shared";
import { Text } from "@/components/Text";
import { useUiStore } from "@/stores/uiStore";
import { useTheme } from "@/theme/useTheme";
import { Section, SettingRow } from "./SettingsPrimitives";

const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"];
const MOTION_MODES: readonly ReduceMotionMode[] = ["system", "on", "off"];
const QUALITY_MODES: readonly QualityTierMode[] = ["auto", "high", "medium", "low"];

type ExperienceSettingsSectionProps = {
  readonly settings: Settings;
  readonly expandedRow: string | null;
  readonly onToggleRow: (key: string) => void;
  readonly onUpdateSettings: (patch: Partial<Settings>) => Promise<void>;
};

export function ExperienceSettingsSection({
  settings,
  expandedRow,
  onToggleRow,
  onUpdateSettings,
}: ExperienceSettingsSectionProps) {
  const { colors } = useTheme();

  return (
    <Section title="Experience">
      <SettingRow<ThemeMode>
        title="Theme"
        subtitle="Choose appearance"
        valueLabel={settings.theme}
        selectedValue={settings.theme}
        options={THEME_MODES.map((m) => ({ label: m, value: m }))}
        expanded={expandedRow === "theme"}
        onToggleExpand={() => onToggleRow("theme")}
        onSelect={(theme) => {
          useUiStore.getState().setThemeMode(theme);
          void onUpdateSettings({ theme });
        }}
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
        onToggleExpand={() => onToggleRow("motion")}
        onSelect={(reduceMotion) => void onUpdateSettings({ reduceMotion })}
      />
      <SettingRow<QualityTierMode>
        title="Visual Quality"
        subtitle="Effects and animation detail"
        valueLabel={settings.qualityTier}
        selectedValue={settings.qualityTier}
        options={QUALITY_MODES.map((m) => ({ label: m, value: m }))}
        expanded={expandedRow === "quality"}
        onToggleExpand={() => onToggleRow("quality")}
        isLast
        onSelect={(qualityTier) => void onUpdateSettings({ qualityTier })}
      />
    </Section>
  );
}
