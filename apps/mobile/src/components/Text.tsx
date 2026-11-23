import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "@/theme/useTheme";

type TextVariant = "title" | "heading" | "body" | "caption";

const variantClasses: Record<TextVariant, string> = {
  title: "text-2xl font-bold",
  heading: "text-lg font-semibold",
  body: "text-base",
  caption: "text-sm",
};

type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
  tabularNums?: boolean;
};

export function Text({
  variant = "body",
  className = "",
  tabularNums = false,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const baseColor =
    variant === "caption" ? colors.textSecondary : colors.textPrimary;
  const hasExplicitColor = /\btext-(white|black|\[)/.test(className);

  return (
    <RNText
      className={`${variantClasses[variant]} ${className}`}
      style={[
        hasExplicitColor ? undefined : { color: baseColor },
        tabularNums ? { fontVariant: ["tabular-nums"] } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
