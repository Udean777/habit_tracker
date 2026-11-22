import { Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600",
  secondary: "bg-neutral-200",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-neutral-900",
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[44px] items-center justify-center rounded-lg px-4 py-2 ${variantClasses[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      <Text className={`font-medium ${textClasses[variant]}`}>{label}</Text>
    </Pressable>
  );
}
