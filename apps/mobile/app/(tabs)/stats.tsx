import { ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { QuestHud, useHabitsData } from "@/features/habits";
import { FluidHeatmap } from "@/features/stats";
import { StatsOverviewCards } from "@/features/stats/components/StatsOverviewCards";
import { useHabitsStats } from "@/features/stats/hooks/useHabitsStats";
import { useMotionPreferences } from "@/features/world/qualityTier";
import { elevation, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export default function StatsScreen() {
  const { colors } = useTheme();
  const {
    loading,
    error,
    activeHabits,
    logs,
    settings,
    pendingOutbox,
    effectiveToday,
    refresh,
  } = useHabitsData();

  const motionPrefs = useMotionPreferences(settings);
  const {
    questProgress,
    aggregateCells,
    habitStats,
    completedTodayCount,
    avg30d,
  } = useHabitsStats(activeHabits, logs, effectiveToday);

  if (loading) {
    return (
      <Screen className="items-center justify-center p-6">
        <Text variant="body">Loading stats...</Text>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen className="items-center justify-center gap-4 p-6">
        <Text variant="body" className="text-red-600">
          {error}
        </Text>
        <Button label="Retry" onPress={refresh} />
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "left", "right"]} className="pt-2">
      <Text variant="title" className="pb-3">
        Stats
      </Text>

      <Animated.View
        entering={
          motionPrefs.reduceMotion
            ? undefined
            : FadeIn.duration(180).easing(Easing.out(Easing.cubic))
        }
      >
        <QuestHud
          progress={questProgress}
          reduceMotion={motionPrefs.reduceMotion}
        />
      </Animated.View>

      <StatsOverviewCards
        completedTodayCount={completedTodayCount}
        totalHabitsCount={activeHabits.length}
        avg30d={avg30d}
        pendingOutbox={pendingOutbox}
        reduceMotion={motionPrefs.reduceMotion}
      />

      {habitStats.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text variant="caption">No active habits to analyze yet.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 104 }}
        >
          <Text variant="heading" className="mb-2">
            This Month Consistency
          </Text>
          <FluidHeatmap
            cells={aggregateCells}
            tier={motionPrefs.tier}
            hapticsEnabled={settings.hapticsEnabled}
          />
          {habitStats.map(({ habit, stats }, idx) => (
            <Animated.View
              key={habit.id}
              entering={
                motionPrefs.reduceMotion
                  ? undefined
                  : FadeIn.delay(Math.min(70 + idx * 30, 220))
                      .duration(180)
                      .easing(Easing.out(Easing.cubic))
              }
              style={[
                {
                  borderRadius: radii.card,
                  borderWidth: 2,
                  borderBottomWidth: 4,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
                elevation.card,
              ]}
              className="mb-3 p-4"
            >
              <Text variant="heading">{habit.name}</Text>
              <Text variant="caption" tabularNums className="mt-1">
                Current streak: {stats.currentStreak}d | Best:{" "}
                {stats.bestStreak}d
              </Text>
              <Text variant="caption" tabularNums className="mt-1">
                7d: {Math.round(stats.rate7d * 100)}% | 30d:{" "}
                {Math.round(stats.rate30d * 100)}% | 90d:{" "}
                {Math.round(stats.rate90d * 100)}%
              </Text>
            </Animated.View>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  );
}
