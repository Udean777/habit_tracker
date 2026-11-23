import { View } from "react-native";
import type { StreakStats } from "@habit/shared";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

export function HabitStreakCards({ stats }: { readonly stats: StreakStats }) {
  return (
    <>
      <View className="mb-4 flex-row gap-3">
        <Card variant="primary" elevated className="flex-1 p-4">
          <Text tone="onPrimary" className="text-xs font-semibold opacity-90">
            Current Streak
          </Text>
          <Text
            tone="onPrimary"
            className="mt-1 text-2xl font-bold"
            tabularNums
          >
            {stats.currentStreak}d
          </Text>
        </Card>
        <Card variant="accent" elevated className="flex-1 p-4">
          <Text tone="onAccent" className="text-xs font-semibold">
            Best Streak
          </Text>
          <Text tone="onAccent" className="mt-1 text-2xl font-bold" tabularNums>
            {stats.bestStreak}d
          </Text>
        </Card>
      </View>

      <Card tactile={false} className="mb-4 p-3">
        <Text variant="caption" tabularNums>
          Completion Rate: 7d {Math.round(stats.rate7d * 100)}% | 30d{" "}
          {Math.round(stats.rate30d * 100)}% | 90d{" "}
          {Math.round(stats.rate90d * 100)}%
        </Text>
      </Card>
    </>
  );
}
