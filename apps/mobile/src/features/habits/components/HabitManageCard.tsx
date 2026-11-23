import { View } from "react-native";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type HabitManageCardProps = {
  readonly onArchive: () => void;
  readonly onDelete: () => void;
};

export function HabitManageCard({
  onArchive,
  onDelete,
}: HabitManageCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
      className="mb-4 p-4"
    >
      <Text variant="heading" className="mb-1">
        Manage Quest
      </Text>
      <Text variant="caption" className="mb-3">
        Archive to pause without losing history, or delete permanently.
      </Text>
      <View className="flex-row gap-2">
        <Button
          label="Archive"
          variant="secondary"
          className="flex-1"
          onPress={onArchive}
        />
        <Button
          label="Delete"
          variant="danger"
          className="flex-1"
          onPress={onDelete}
        />
      </View>
    </View>
  );
}
