import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Tabs } from "expo-router";
import BarChart3 from "lucide-react-native/icons/bar-chart-3";
import CalendarCheck2 from "lucide-react-native/icons/calendar-check-2";
import Settings from "lucide-react-native/icons/settings";
import { Text } from "@/components/Text";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

const TAB_TIMING = {
  damping: 26,
  stiffness: 260,
  mass: 0.7,
} as const;

type TabItemProps = {
  readonly routeName: string;
  readonly label: string;
  readonly focused: boolean;
  readonly onPress: () => void;
};

function TabItem({ routeName, label, focused, onPress }: TabItemProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.set(withSpring(focused ? 1 : 0, TAB_TIMING));
  }, [focused, progress]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(107, 77, 245, 0)", colors.primary],
    ),
    paddingHorizontal: 14 + progress.value * 6,
    transform: [{ scale: pressScale.value }],
  }));

  const labelContainerStyle = useAnimatedStyle(() => ({
    maxWidth: progress.value * 76,
    opacity: progress.value,
    marginLeft: progress.value * 8,
    transform: [{ translateX: (1 - progress.value) * -6 }],
  }));

  const iconColor = focused ? "#FFFFFF" : colors.textSecondary;
  const strokeWidth = focused ? 2.5 : 2;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      android_ripple={null}
      onPressIn={() => {
        pressScale.set(withSpring(0.96, TAB_TIMING));
      }}
      onPressOut={() => {
        pressScale.set(withSpring(1, TAB_TIMING));
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            height: 46,
            borderRadius: radii.pill,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          },
          pillAnimatedStyle,
        ]}
      >
        {routeName === "index" ? (
          <CalendarCheck2
            size={20}
            color={iconColor}
            strokeWidth={strokeWidth}
          />
        ) : routeName === "stats" ? (
          <BarChart3 size={20} color={iconColor} strokeWidth={strokeWidth} />
        ) : (
          <Settings size={20} color={iconColor} strokeWidth={strokeWidth} />
        )}

        <Animated.View
          style={[{ overflow: "hidden", justifyContent: "center" }, labelContainerStyle]}
        >
          <Text
            numberOfLines={1}
            className="text-xs font-extrabold tracking-wide text-white"
          >
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function FloatingPillTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, 14),
        alignItems: "center",
      }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.pill,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: colors.border,
          paddingVertical: 6,
          paddingHorizontal: 8,
          shadowColor: colors.textPrimary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}
        className="flex-row items-center gap-1.5"
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const label = descriptor?.options.title ?? route.name;
          const focused = state.index === index;

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              label={label}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  void Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "shift",
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={(props) => <FloatingPillTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
