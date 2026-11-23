import { View } from "react-native";
import Shield from "lucide-react-native/icons/shield";
import type { LocalDate, ShieldableMiss } from "@habit/shared";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/useTheme";

type StreakShieldBannerProps = {
  readonly miss: ShieldableMiss;
  readonly habitName: string;
  readonly availableShields: number;
  readonly onApplyShield: (habitId: string, missedDate: LocalDate) => void;
};

export function StreakShieldBanner({
  miss,
  habitName,
  availableShields,
  onApplyShield,
}: StreakShieldBannerProps) {
  const { colors } = useTheme();

  if (availableShields <= 0) return null;

  return (
    <Card
      elevated
      style={{ borderColor: colors.accentBorder }}
      className="mb-4 p-3.5"
    >
      <View className="flex-row items-center gap-3">
        <View
          style={{ backgroundColor: colors.accent }}
          className="h-10 w-10 items-center justify-center rounded-xl"
        >
          <Shield size={20} color={colors.accentText} strokeWidth={2.5} />
        </View>
        <View className="flex-1">
          <Text variant="heading" numberOfLines={1}>
            Protect {habitName}?
          </Text>
          <Text variant="caption" className="mt-0.5">
            Keep your {miss.previousStreak}-day streak safe with 1 Streak Shield ({availableShields} left).
          </Text>
        </View>
        <Button
          label="Shield"
          onPress={() => onApplyShield(miss.habitId, miss.missedDate)}
        />
      </View>
    </Card>
  );
}
