import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { elevation, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export type CardVariant = "surface" | "muted" | "primary" | "accent";

type CardProps = {
  readonly children: ReactNode;
  readonly variant?: CardVariant;
  readonly tactile?: boolean;
  readonly elevated?: boolean;
  readonly className?: string;
  readonly style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  variant = "surface",
  tactile = true,
  elevated = false,
  className = "p-4",
  style,
}: CardProps) {
  const { colors } = useTheme();

  const variantPalette =
    variant === "primary"
      ? { backgroundColor: colors.primary, borderColor: colors.primaryPressed }
      : variant === "accent"
        ? { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }
        : variant === "muted"
          ? { backgroundColor: colors.surfaceMuted, borderColor: colors.border }
          : { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <View
      style={[
        {
          borderRadius: radii.card,
          borderWidth: tactile ? 2 : 1,
          borderBottomWidth: tactile ? 4 : 1,
          borderColor: variantPalette.borderColor,
          backgroundColor: variantPalette.backgroundColor,
        },
        elevated ? elevation.card : undefined,
        style,
      ]}
      className={className}
    >
      {children}
    </View>
  );
}
