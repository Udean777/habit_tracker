import { Text as RNText, type TextProps as RNTextProps } from "react-native";

type TextVariant = "title" | "heading" | "body" | "caption";

const variantClasses: Record<TextVariant, string> = {
  title: "text-2xl font-bold text-neutral-900",
  heading: "text-lg font-semibold text-neutral-900",
  body: "text-base text-neutral-800",
  caption: "text-sm text-neutral-600",
};

type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
};

export function Text({
  variant = "body",
  className = "",
  ...rest
}: TextProps) {
  return (
    <RNText
      className={`${variantClasses[variant]} ${className}`}
      {...rest}
    />
  );
}
