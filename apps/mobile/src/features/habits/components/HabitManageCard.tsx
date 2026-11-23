import { View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

type HabitManageCardProps = {
  readonly onArchive: () => void;
  readonly onDelete: () => void;
};

export function HabitManageCard({
  onArchive,
  onDelete,
}: HabitManageCardProps) {
  return (
    <Card tactile={false} className="mb-4 p-4">
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
    </Card>
  );
}
