import { View } from "react-native";
import { Tabs } from "expo-router";
import BarChart3 from "lucide-react-native/icons/bar-chart-3";
import CalendarCheck2 from "lucide-react-native/icons/calendar-check-2";
import Settings from "lucide-react-native/icons/settings";
import { colors, radii } from "@/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radii.pill,
                      paddingHorizontal: 14,
                      paddingVertical: 3,
                    }
                  : undefined
              }
            >
              <CalendarCheck2
                size={size}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radii.pill,
                      paddingHorizontal: 14,
                      paddingVertical: 3,
                    }
                  : undefined
              }
            >
              <BarChart3
                size={size}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radii.pill,
                      paddingHorizontal: 14,
                      paddingVertical: 3,
                    }
                  : undefined
              }
            >
              <Settings
                size={size}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
