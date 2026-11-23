import { View } from "react-native";
import { router } from "expo-router";
import type { CreateHabitInput } from "@habit/shared";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { HabitForm, useHabitsData } from "@/features/habits";

export default function NewHabitScreen() {
  const { effectiveToday, onCreateHabit } = useHabitsData();

  async function handleCreate(data: CreateHabitInput) {
    await onCreateHabit(data);
    router.back();
  }

  return (
    <Screen className="pt-3">
      <View className="flex-row items-center justify-between pb-4">
        <Text variant="title">New Quest</Text>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>

      <HabitForm effectiveToday={effectiveToday} onSubmitHabit={handleCreate} />
    </Screen>
  );
}
