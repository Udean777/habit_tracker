import { Pressable, View } from "react-native";
import {
  habitColorKeySchema,
  habitIconKeySchema,
  type HabitColorKey,
  type HabitIconKey,
} from "@habit/shared";
import { HabitIcon } from "@/components/HabitIcon";
import { Text } from "@/components/Text";
import { habitAccents, radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const ICON_KEYS = habitIconKeySchema.options;
const COLOR_KEYS = habitColorKeySchema.options;

type HabitAppearanceFieldsProps = {
  readonly selectedIcon: HabitIconKey;
  readonly selectedColor: HabitColorKey;
  readonly onSelectIcon: (icon: HabitIconKey) => void;
  readonly onSelectColor: (color: HabitColorKey) => void;
};

export function HabitAppearanceFields({
  selectedIcon,
  selectedColor,
  onSelectIcon,
  onSelectColor,
}: HabitAppearanceFieldsProps) {
  const { colors } = useTheme();

  return (
    <>
      <Text variant="heading" className="mb-2">
        Icon
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {ICON_KEYS.map((iconKey) => {
          const active = selectedIcon === iconKey;
          const activeBg = habitAccents[selectedColor];
          return (
            <Pressable
              key={iconKey}
              accessibilityRole="button"
              accessibilityLabel={`Icon ${iconKey}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelectIcon(iconKey)}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderBottomWidth: active ? 3 : 1,
                borderColor: active ? colors.textPrimary : colors.borderStrong,
                backgroundColor: active ? activeBg : colors.surface,
              }}
              className="min-h-[44px] min-w-[44px] items-center justify-center px-3"
            >
              <HabitIcon
                icon={iconKey}
                size={20}
                color={active ? colors.primaryText : colors.textPrimary}
              />
            </Pressable>
          );
        })}
      </View>

      <Text variant="heading" className="mb-2">
        Color
      </Text>
      <View className="mb-6 flex-row gap-3">
        {COLOR_KEYS.map((colorKey) => {
          const active = selectedColor === colorKey;
          return (
            <Pressable
              key={colorKey}
              accessibilityRole="button"
              accessibilityLabel={`Color ${colorKey}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelectColor(colorKey)}
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.pill,
                backgroundColor: habitAccents[colorKey],
                borderWidth: active ? 3 : 1,
                borderColor: active ? colors.textPrimary : colors.border,
              }}
              className="items-center justify-center"
            />
          );
        })}
      </View>
    </>
  );
}
