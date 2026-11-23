import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";

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
        <Card variant="primary" tactile={false} elevated className="flex-1 p-4">
          <Text tone="onPrimary" className="text-sm font-medium">
            Completed Today
          </Text>
          <Text
            tone="onPrimary"
            className="mt-1 text-2xl font-bold"
            tabularNums
          >
            {completedTodayCount} / {totalHabitsCount}
          </Text>
        </Card>
        <Card variant="accent" tactile={false} elevated className="flex-1 p-4">
          <Text tone="onAccent" className="text-sm font-medium">
            30d Avg Rate
          </Text>
          <Text tone="onAccent" className="mt-1 text-2xl font-bold" tabularNums>
            {avg30d}%
          </Text>
        </Card>
      </Animated.View>

      <Card variant="muted" tactile={false} className="mb-4 p-3">
        <Text variant="caption" tabularNums>
          {pendingOutbox > 0
            ? `Sync status: ${pendingOutbox} updates waiting to upload`
            : "Sync status: All updates saved"}
        </Text>
      </Card>
    </>
  );
}
