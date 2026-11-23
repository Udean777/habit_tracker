import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { TrophyCaseSection, useGamification } from "@/features/gamification";
import { QuestHud, QuestLoadingView, useHabitsData } from "@/features/habits";
import {
  FEATURE_TOUR_STEPS,
  TourTarget,
  useTourStore,
} from "@/features/tour";
import {
  FluidHeatmap,
  StatsOverviewCards,
  useHabitsStats,
} from "@/features/stats";
import { useMotionPreferences } from "@/lib/motion";

export default function StatsScreen() {
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
  const scrollRef = useRef<ScrollView | null>(null);
  const tourOpen = useTourStore((s) => s.isOpen);
  const tourStepIndex = useTourStore((s) => s.stepIndex);

  useEffect(() => {
    if (
      tourOpen &&
      FEATURE_TOUR_STEPS[tourStepIndex]?.id === "stats_heatmap"
    ) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [tourOpen, tourStepIndex]);
  const { heroProfile, goldEconomy, shieldStats, achievements } =
    useGamification(
      activeHabits,
      logs,
      effectiveToday,
      settings.hapticsEnabled,
    );
  const {
    questProgress,
    aggregateCells,
    habitStats,
    completedTodayCount,
    avg30d,
  } = useHabitsStats(activeHabits, logs, effectiveToday);

  if (loading) {
    return (
      <QuestLoadingView
        title="Crunching Guild Stats"
        subtitle="Calculating streaks, Gold ledger, and Trophy Case..."
        reduceMotion={motionPrefs.reduceMotion}
        hapticsEnabled={settings.hapticsEnabled}
      />
    );
  }

  if (error) {
    return (
      <Screen className="items-center justify-center gap-4 p-6">
        <Text variant="body" tone="danger">
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
          loadout={heroProfile}
          goldBalance={goldEconomy.availableGold}
          availableShields={shieldStats.availableShields}
          onPressShop={() => router.push("/shop")}
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
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 104 }}
        >
          <Text variant="heading" className="mb-2">
            This Month Consistency
          </Text>
          <TourTarget id="stats_heatmap">
            <FluidHeatmap
              cells={aggregateCells}
              tier={motionPrefs.tier}
              hapticsEnabled={settings.hapticsEnabled}
            />
          </TourTarget>
          <TrophyCaseSection achievements={achievements} />
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
            >
              <Card elevated className="mb-3 p-4">
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
              </Card>
            </Animated.View>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  );
}
