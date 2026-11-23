import { Text as RNText, type TextProps as RNTextProps } from "react-native";

type TextVariant = "title" | "heading" | "body" | "caption";

const variantClasses: Record<TextVariant, string> = {
  title: "text-2xl font-bold text-[#2A2140]",
  heading: "text-lg font-semibold text-[#2A2140]",
  body: "text-base text-[#2A2140]",
  caption: "text-sm text-[#6B6285]",
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
  return (
    <RNText
      className={`${variantClasses[variant]} ${className}`}
      style={tabularNums ? [{ fontVariant: ["tabular-nums"] }, style] : style}
      {...rest}
    />
  );
}
