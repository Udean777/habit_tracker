import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import Check from "lucide-react-native/icons/check";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(180).easing(Easing.out(Easing.cubic))}
      layout={LinearTransition.duration(180).easing(Easing.out(Easing.cubic))}
      className="mb-6"
    >
      <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#6B6285]">
        {title}
      </Text>
      <Animated.View
        layout={LinearTransition.duration(180).easing(Easing.out(Easing.cubic))}
        style={{
          borderRadius: radii.card,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

export function SettingRow<T extends string | number>({
  title,
  subtitle,
  valueLabel,
  options,
  selectedValue,
  expanded,
  onToggleExpand,
  onSelect,
  isLast = false,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly valueLabel: string;
  readonly options: readonly { readonly label: string; readonly value: T }[];
  readonly selectedValue: T;
  readonly expanded: boolean;
  readonly onToggleExpand: () => void;
  readonly onSelect: (value: T) => void;
  readonly isLast?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, current value ${valueLabel}`}
        accessibilityState={{ expanded }}
        onPress={onToggleExpand}
        className="min-h-[56px] flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-[#2A2140]">{title}</Text>
          {subtitle ? (
            <Text variant="caption" className="mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              borderRadius: radii.badge,
              backgroundColor: colors.surfaceMuted,
            }}
            className="px-2.5 py-1"
          >
            <Text className="text-xs font-bold capitalize text-[#2A2140]">
              {valueLabel}
            </Text>
          </View>
          {expanded ? (
            <ChevronDown size={16} color={colors.primary} />
          ) : (
            <ChevronRight size={16} color={colors.textSecondary} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(150).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(110)}
          style={{ backgroundColor: colors.background }}
          className="gap-1.5 px-4 pb-3 pt-1"
        >
          {options.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <Pressable
                key={String(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(opt.value);
                  onToggleExpand();
                }}
                style={{
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? colors.surfaceMuted
                    : colors.surface,
                }}
                className="min-h-[44px] flex-row items-center justify-between px-3 py-2"
              >
                <Text
                  className={`text-sm capitalize ${
                    isSelected
                      ? "font-bold text-[#2A2140]"
                      : "font-medium text-[#6B6285]"
                  }`}
                >
                  {opt.label}
                </Text>
                {isSelected ? (
                  <Check size={16} color={colors.primary} strokeWidth={2.5} />
                ) : null}
              </Pressable>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}
