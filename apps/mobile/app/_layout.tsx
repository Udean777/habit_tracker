import "../global.css";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { appDb } from "@/db/client";
import migrations from "@/db/migrations/migrations";
import { listActiveHabits } from "@/features/habits";
import { ensureSettingsAndSyncState, getSettings } from "@/features/settings";
import {
  configureNotificationHandler,
  handleNotificationResponse,
  reconcileNotifications,
  registerNotificationCategories,
} from "@/lib/notifications";
import { hydrateAvatarClass, useUiStore } from "@/stores/uiStore";
import { useTheme } from "@/theme/useTheme";

configureNotificationHandler();

export default function RootLayout() {
  const { success, error } = useMigrations(appDb, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const { isDark, colors: themeColors } = useTheme();

  useEffect(() => {
    if (!success) return;
    let cancelled = false;
    void ensureSettingsAndSyncState(appDb)
      .then(async () => {
        const loaded = await getSettings(appDb);
        useUiStore.getState().setThemeMode(loaded.theme);
        await hydrateAvatarClass();
        await registerNotificationCategories();
        const active = await listActiveHabits(appDb);
        await reconcileNotifications(active);
        if (!cancelled) setSeeded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSeedError(
            "We could not load your local data. Please restart the app.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [success]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleNotificationResponse(response).then((changed) => {
          if (changed) bumpDataVersion();
        });
      },
    );
    return () => sub.remove();
  }, [bumpDataVersion]);

  if (error || seedError) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-base font-semibold text-red-600">
          {error?.message ?? seedError}
        </Text>
      </View>
    );
  }

  if (!success || !seeded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "ios_from_right",
            contentStyle: { backgroundColor: themeColors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen
            name="habit/new"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="habit/[id]"
            options={{ animation: "ios_from_right" }}
          />
          <Stack.Screen
            name="auth/login"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
