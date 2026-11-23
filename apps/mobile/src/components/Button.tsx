import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { triggerHaptic } from "@/lib/haptics";
import { motion, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly className?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  className = "",
}: ButtonProps) {
  const { colors } = useTheme();
  const pressProgress = useSharedValue(0);

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary, borderColor: colors.primaryPressed }
      : variant === "danger"
        ? { backgroundColor: colors.danger, borderColor: colors.dangerPressed }
        : { backgroundColor: colors.surfaceMuted, borderColor: colors.border };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressProgress.value * 2 }],
  }));

  function handlePressIn() {
    pressProgress.value = withSpring(1, motion.springs.snappy);
    triggerHaptic("light");
  }

  function handlePressOut() {
    pressProgress.value = withSpring(0, motion.springs.snappy);
  }

  return (
    <Animated.View style={animatedStyle} className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          variantStyle,
          { borderRadius: radii.button, borderBottomWidth: 3 },
        ]}
        className={`min-h-[44px] items-center justify-center px-4 py-2 ${disabled ? "opacity-50" : ""}`}
      >
        <Text
          className="font-semibold"
          tone={variant === "secondary" ? "primary" : "onPrimary"}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
