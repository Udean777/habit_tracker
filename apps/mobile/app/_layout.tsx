import "../global.css";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { appDb } from "@/db/client";
import migrations from "@/db/migrations/migrations";

export default function RootLayout() {
  const { success, error } = useMigrations(appDb, migrations);

  if (error) throw error;
  if (!success) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
