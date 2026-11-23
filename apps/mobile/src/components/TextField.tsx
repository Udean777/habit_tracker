import { forwardRef, useState, type ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Text } from "./Text";

type TextFieldProps = TextInputProps & {
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string | null;
  readonly rightSlot?: ReactNode;
  readonly containerClassName?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      rightSlot,
      containerClassName = "mb-4",
      className = "",
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) {
    const { colors, isDark } = useTheme();
    const [focused, setFocused] = useState(false);

    const activeFocusColor = isDark ? colors.primaryTextAccent : colors.primary;
    const borderColor = error
      ? colors.danger
      : focused
        ? activeFocusColor
        : colors.borderStrong;

    return (
      <View className={containerClassName}>
        {label ? (
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text variant="heading">{label}</Text>
            {hint ? (
              <Text variant="caption" tone="secondary">
                {hint}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View
          style={{
            borderRadius: radii.button,
            borderWidth: focused || error ? 2 : 1,
            borderColor,
            backgroundColor: colors.surface,
          }}
          className="min-h-[48px] flex-row items-center"
        >
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textSecondary}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[{ color: colors.textPrimary, flex: 1 }, style]}
            className={`min-h-[48px] px-3.5 text-base ${className}`}
            {...rest}
          />
          {rightSlot ? <View className="pr-1.5">{rightSlot}</View> : null}
        </View>
        {error ? (
          <Text variant="caption" tone="danger" className="mt-1.5 font-semibold">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);
