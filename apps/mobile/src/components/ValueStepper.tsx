import { Pressable, View } from "react-native";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Text } from "./Text";

type ValueStepperProps = {
  readonly targetLabel: string;
  readonly onDecrement: () => void;
  readonly onIncrement: () => void;
};

export function ValueStepper({
  targetLabel,
  onDecrement,
  onIncrement,
}: ValueStepperProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${targetLabel}`}
        onPress={onDecrement}
        style={{
          borderRadius: radii.button,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        }}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
      >
        <Text tone="primary" className="text-lg font-bold">
          -
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${targetLabel}`}
        onPress={onIncrement}
        style={{
          borderRadius: radii.button,
          borderWidth: 1,
          borderBottomWidth: 3,
          borderColor: colors.primaryPressed,
          backgroundColor: colors.primary,
        }}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
      >
        <Text tone="onPrimary" className="text-lg font-bold">
          +
        </Text>
      </Pressable>
    </View>
  );
}
