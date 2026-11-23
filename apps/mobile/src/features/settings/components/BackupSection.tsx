import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import {
  exportAllLocalData,
  seedTier2DemoData,
  seedTier3DemoData,
} from "@/features/settings";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Section } from "./SettingsPrimitives";

export function BackupSection({ onRefresh }: { readonly onRefresh: () => void }) {
  const { colors } = useTheme();
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  async function handleExport() {
    const json = await exportAllLocalData();
    setExportedJson(json);
  }

  async function handleSeedTier2() {
    await seedTier2DemoData();
    onRefresh();
  }

  async function handleSeedTier3() {
    await seedTier3DemoData();
    onRefresh();
  }

  return (
    <Section title="Backup">
      <View className="gap-3 p-4">
        <Text variant="caption">
          Export your local habits and logs as JSON.
        </Text>
        <Button
          label="Seed Tier 2 Demo (Level 3)"
          variant="secondary"
          onPress={() => void handleSeedTier2()}
        />
        <Button
          label="Seed Tier 3 Demo (Level 5)"
          variant="secondary"
          onPress={() => void handleSeedTier3()}
        />
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
  );
}
