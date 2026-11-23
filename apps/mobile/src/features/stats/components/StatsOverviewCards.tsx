import { View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { Text } from "@/components/Text";
import { elevation, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type StatsOverviewCardsProps = {
  readonly completedTodayCount: number;
  readonly totalHabitsCount: number;
  readonly avg30d: number;
  readonly pendingOutbox: number;
  readonly reduceMotion: boolean;
};

export function StatsOverviewCards({
  completedTodayCount,
  totalHabitsCount,
  avg30d,
  pendingOutbox,
  reduceMotion,
}: StatsOverviewCardsProps) {
  const { colors } = useTheme();

  return (
    <>
      <Animated.View
        entering={
          reduceMotion
            ? undefined
            : FadeIn.delay(35).duration(180).easing(Easing.out(Easing.cubic))
        }
        className="mb-4 flex-row gap-3"
      >
        <View
          style={[
            {
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.primaryPressed,
              backgroundColor: colors.primary,
            },
            elevation.card,
          ]}
          className="flex-1 p-4"
        >
          <Text className="text-sm text-white/90">Completed Today</Text>
          <Text className="mt-1 text-2xl font-bold text-white" tabularNums>
            {completedTodayCount} / {totalHabitsCount}
          </Text>
        </View>
        <View
          style={[
            {
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.accent,
              backgroundColor: colors.accentBg,
            },
            elevation.card,
          ]}
          className="flex-1 p-4"
        >
          <Text className="text-sm font-medium text-[#2A2140]">30d Avg Rate</Text>
          <Text className="mt-1 text-2xl font-bold text-[#2A2140]" tabularNums>
            {avg30d}%
          </Text>
        </View>
      </Animated.View>

      <View
        style={{
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceMuted,
        }}
        className="mb-4 p-3"
      >
        <Text variant="caption" tabularNums>
          {pendingOutbox > 0
            ? `Sync status: ${pendingOutbox} updates waiting to upload`
            : "Sync status: All updates saved"}
        </Text>
      </View>
    </>
  );
}
