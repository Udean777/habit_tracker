import { View } from "react-native";
import type { StreakStats } from "@habit/shared";
import { Text } from "@/components/Text";
import { elevation, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export function HabitStreakCards({ stats }: { readonly stats: StreakStats }) {
  const { colors } = useTheme();

  return (
    <>
      <View className="mb-4 flex-row gap-3">
        <View
          style={[
            {
              borderRadius: radii.card,
              borderWidth: 2,
              borderBottomWidth: 4,
              borderColor: colors.primaryPressed,
              backgroundColor: colors.primary,
            },
            elevation.card,
          ]}
          className="flex-1 p-4"
        >
          <Text className="text-xs font-semibold text-white/90">
            Current Streak
          </Text>
          <Text className="mt-1 text-2xl font-bold text-white" tabularNums>
            {stats.currentStreak}d
          </Text>
        </View>
        <View
          style={[
            {
              borderRadius: radii.card,
              borderWidth: 2,
              borderBottomWidth: 4,
              borderColor: colors.accent,
              backgroundColor: colors.accentBg,
            },
            elevation.card,
          ]}
          className="flex-1 p-4"
        >
          <Text className="text-xs font-semibold text-[#2A2140]">
            Best Streak
          </Text>
          <Text className="mt-1 text-2xl font-bold text-[#2A2140]" tabularNums>
            {stats.bestStreak}d
          </Text>
        </View>
      </View>

      <View
        style={{
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
        className="mb-4 p-3"
      >
        <Text variant="caption" tabularNums>
          Completion Rate: 7d {Math.round(stats.rate7d * 100)}% | 30d{" "}
          {Math.round(stats.rate30d * 100)}% | 90d{" "}
          {Math.round(stats.rate90d * 100)}%
        </Text>
      </View>
    </>
  );
}
