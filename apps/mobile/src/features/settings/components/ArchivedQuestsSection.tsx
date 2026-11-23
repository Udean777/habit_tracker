import { View } from "react-native";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import type { HabitRecord } from "@/features/habits";
import { useTheme } from "@/theme/useTheme";
import { Section } from "./SettingsPrimitives";

type ArchivedQuestsSectionProps = {
  readonly archivedHabits: readonly HabitRecord[];
  readonly onUnarchive: (id: string) => Promise<void>;
};

export function ArchivedQuestsSection({
  archivedHabits,
  onUnarchive,
}: ArchivedQuestsSectionProps) {
  const { colors } = useTheme();

  return (
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
              onPress={() => void onUnarchive(habit.id)}
            />
          </View>
        ))
      )}
    </Section>
  );
}
