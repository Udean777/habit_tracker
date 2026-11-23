import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, motion, radii } from "@/theme/tokens";

type ButtonVariant = "primary" | "secondary" | "danger";

const variantStyles: Record<
  ButtonVariant,
  { backgroundColor: string; borderColor: string }
> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: "#991B1B",
  },
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-[#2A2140]",
  danger: "text-white",
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  className = "",
}: ButtonProps) {
  const pressProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressProgress.value * 2 }],
  }));

  function handlePressIn() {
    pressProgress.value = withSpring(1, motion.springs.snappy);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  function handlePressOut() {
    pressProgress.value = withSpring(0, motion.springs.snappy);
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          variantStyles[variant],
          { borderRadius: radii.button, borderBottomWidth: 3 },
        ]}
        className={`min-h-[44px] items-center justify-center px-4 py-2 ${disabled ? "opacity-50" : ""} ${className}`}
      >
        <Text className={`font-semibold ${textClasses[variant]}`}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
