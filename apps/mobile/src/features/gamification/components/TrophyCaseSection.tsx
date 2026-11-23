import { View } from "react-native";
import Award from "lucide-react-native/icons/award";
import Lock from "lucide-react-native/icons/lock";
import type { AchievementStatus } from "@habit/shared";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type TrophyCaseSectionProps = {
  readonly achievements: readonly AchievementStatus[];
};

export function TrophyCaseSection({ achievements }: TrophyCaseSectionProps) {
  const { colors } = useTheme();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="heading">Trophy Case</Text>
        <Badge
          label={`${unlockedCount}/${achievements.length}`}
          variant="accent"
          pill
          tabularNums
        />
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        {achievements.map((item) => {
          const pct =
            item.target > 0
              ? Math.min(100, Math.round((item.current / item.target) * 100))
              : 0;
          return (
            <Card
              key={item.id}
              variant={item.unlocked ? "surface" : "muted"}
              elevated={item.unlocked}
              style={{
                width: "48%",
                borderColor: item.unlocked
                  ? colors.accentBorder
                  : colors.border,
              }}
              className="p-3"
            >
              <View className="flex-row items-center justify-between">
                <View
                  style={{
                    backgroundColor: item.unlocked
                      ? colors.accentBg
                      : colors.background,
                    borderWidth: 1,
                    borderColor: item.unlocked
                      ? colors.accentBorder
                      : colors.border,
                    borderRadius: radii.button,
                  }}
                  className="h-8 w-8 items-center justify-center"
                >
                  {item.unlocked ? (
                    <Award
                      size={16}
                      color={colors.accentText}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Lock size={14} color={colors.textSecondary} strokeWidth={2.5} />
                  )}
                </View>
                <Text variant="caption" tabularNums className="font-bold">
                  {item.current}/{item.target}
                </Text>
              </View>

              <Text variant="heading" numberOfLines={1} className="mt-2 text-sm">
                {item.title}
              </Text>
              <Text variant="caption" numberOfLines={2} className="mt-0.5 text-xs">
                {item.description}
              </Text>

              <View
                style={{
                  height: 7,
                  borderRadius: radii.pill,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
                className="mt-2"
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: radii.pill,
                    backgroundColor: item.unlocked
                      ? colors.accentBorder
                      : colors.primaryTextAccent,
                  }}
                />
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}
