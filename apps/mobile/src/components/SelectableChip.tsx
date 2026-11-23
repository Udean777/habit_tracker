import { Pressable } from "react-native";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { Text } from "./Text";

type SelectableChipProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
  readonly className?: string;
  readonly textClassName?: string;
};

export function SelectableChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  className = "flex-1 px-2",
  textClassName = "text-sm font-semibold",
}: SelectableChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        borderRadius: radii.button,
        borderWidth: 1,
        borderBottomWidth: selected ? 3 : 1,
        borderColor: selected ? colors.primaryPressed : colors.borderStrong,
        backgroundColor: selected ? colors.primary : colors.surface,
      }}
      className={`min-h-[44px] items-center justify-center ${className}`}
    >
      <Text
        tone={selected ? "onPrimary" : "primary"}
        className={textClassName}
      >
        {label}
      </Text>
    </Pressable>
  );
}
