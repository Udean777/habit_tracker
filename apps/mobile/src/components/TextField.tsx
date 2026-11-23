import { TextInput, View, type TextInputProps } from "react-native";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Text } from "./Text";

type TextFieldProps = TextInputProps & {
  readonly label?: string;
  readonly error?: string | null;
  readonly containerClassName?: string;
};

export function TextField({
  label,
  error,
  containerClassName = "mb-4",
  className = "",
  style,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <View className={containerClassName}>
      {label ? (
        <Text variant="heading" className="mb-1.5">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          {
            borderRadius: radii.button,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.borderStrong,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
          },
          style,
        ]}
        className={`min-h-[44px] px-3 text-base ${className}`}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger" className="mt-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
