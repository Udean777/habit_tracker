import "../global.css";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Text } from "@/components/Text";
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

// Keep the native splash screen visible until migrations and initial local data are ready.
void SplashScreen.preventAutoHideAsync().catch((err) => {
  console.warn("Failed to prevent splash screen auto-hide:", err);
});

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

configureNotificationHandler();

export default function RootLayout() {
  const { success, error } = useMigrations(appDb, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const splashHiddenRef = useRef(false);

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

  function handleRootLayout() {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hide();
  }

  if (error || seedError) {
    return (
      <View
        onLayout={handleRootLayout}
        style={{ backgroundColor: themeColors.background }}
        className="flex-1 items-center justify-center p-6"
      >
        <Text tone="danger" className="text-base font-semibold">
          {error?.message ?? seedError}
        </Text>
      </View>
    );
  }

  if (!success || !seeded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView
        style={{ flex: 1 }}
        onLayout={handleRootLayout}
      >
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
          <Stack.Screen
            name="shop"
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
