import { Pressable, Switch, View } from "react-native";
import { router } from "expo-router";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import {
  qualityTierModeSchema,
  reduceMotionModeSchema,
  themeModeSchema,
  type QualityTierMode,
  type ReduceMotionMode,
  type Settings,
  type ThemeMode,
} from "@habit/shared";
import { Text } from "@/components/Text";
import { useUiStore } from "@/stores/uiStore";
import { useTheme } from "@/theme/useTheme";
import { Section, SettingRow } from "./SettingsPrimitives";

const THEME_MODES = themeModeSchema.options;
const MOTION_MODES = reduceMotionModeSchema.options;
const QUALITY_MODES = qualityTierModeSchema.options;

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
          <Text variant="body" className="font-semibold">
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
        onSelect={(qualityTier) => void onUpdateSettings({ qualityTier })}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Replay app onboarding tour"
        onPress={() => router.push("/onboarding")}
        className="min-h-[56px] flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1 pr-3">
          <Text variant="body" className="font-semibold">
            App Onboarding Tour
          </Text>
          <Text variant="caption" className="mt-0.5">
            Replay hero setup & gamification walkthrough
          </Text>
        </View>
        <ChevronRight size={16} color={colors.textSecondary} />
      </Pressable>
    </Section>
  );
}
