import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "@/theme/useTheme";

export type TextVariant = "title" | "heading" | "body" | "caption" | "label";
export type TextTone =
  | "primary"
  | "secondary"
  | "onPrimary"
  | "onAccent"
  | "primaryAccent"
  | "danger";

const variantClasses: Record<TextVariant, string> = {
  title: "text-2xl font-bold",
  heading: "text-lg font-semibold",
  body: "text-base",
  caption: "text-sm",
  label: "text-xs font-bold uppercase tracking-wider",
};

type TextProps = RNTextProps & {
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  readonly className?: string;
  readonly tabularNums?: boolean;
};

export function Text({
  variant = "body",
  tone,
  className = "",
  tabularNums = false,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const resolvedTone: TextTone =
    tone ??
    (variant === "caption" || variant === "label" ? "secondary" : "primary");

  const toneColor: Record<TextTone, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    onPrimary: colors.primaryText,
    onAccent: colors.accentText,
    primaryAccent: colors.primaryTextAccent,
    danger: colors.dangerText,
  };

  return (
    <RNText
      className={`${variantClasses[variant]} ${className}`}
      style={[
        { color: toneColor[resolvedTone] },
        tabularNums ? { fontVariant: ["tabular-nums"] } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
