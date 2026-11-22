import "../global.css";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { appDb } from "@/db/client";
import migrations from "@/db/migrations/migrations";
import { listActiveHabits } from "@/features/habits";
import { ensureSettingsAndSyncState } from "@/features/settings";
import {
  configureNotificationHandler,
  handleNotificationResponse,
  reconcileNotifications,
  registerNotificationCategories,
} from "@/lib/notifications";
import { useUiStore } from "@/stores/uiStore";

configureNotificationHandler();

export default function RootLayout() {
  const { success, error } = useMigrations(appDb, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);

  useEffect(() => {
    if (!success) return;
    let cancelled = false;
    void ensureSettingsAndSyncState(appDb)
      .then(async () => {
        await registerNotificationCategories();
        const active = await listActiveHabits(appDb);
        await reconcileNotifications(active);
        if (!cancelled) setSeeded(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setSeedError(
            err instanceof Error ? err.message : "Database setup failed",
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="habit/new" options={{ presentation: "modal" }} />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
