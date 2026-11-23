import type { ReactNode } from "react";
import { View } from "react-native";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Text, type TextTone } from "./Text";

export type BadgeVariant = "accent" | "primary" | "muted";

type BadgeProps = {
  readonly label: string;
  readonly variant?: BadgeVariant;
  readonly pill?: boolean;
  readonly tabularNums?: boolean;
  readonly icon?: ReactNode;
  readonly className?: string;
  readonly textClassName?: string;
};

export function Badge({
  label,
  variant = "accent",
  pill = false,
  tabularNums = false,
  icon,
  className = "px-2 py-0.5",
  textClassName = "text-xs font-extrabold",
}: BadgeProps) {
  const { colors } = useTheme();

  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "muted"
        ? colors.surfaceMuted
        : colors.accentBg;

  const textTone: TextTone =
    variant === "primary"
      ? "onPrimary"
      : variant === "muted"
        ? "primary"
        : "onAccent";

  return (
    <View
      style={{
        borderRadius: pill ? radii.pill : radii.badge,
        backgroundColor,
      }}
      className={`flex-row items-center gap-1 ${className}`}
    >
      {icon}
      <Text tone={textTone} tabularNums={tabularNums} className={textClassName}>
        {label}
      </Text>
    </View>
  );
}
