import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Canvas, Circle } from "@shopify/react-native-skia";
import {
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { hc } from "hono/client";
import type { AppType } from "../../api/src/index";
import { appDb } from "@/db/client";
import { habits } from "@/db/schema";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const client = hc<AppType>(API_URL);

export default function SmokeTestScreen() {
  const [dbCount, setDbCount] = useState<number>(0);
  const [secureVal, setSecureVal] = useState<string>("-");
  const [apiStatus, setApiStatus] = useState<string>("untested");
  const radius = useSharedValue(24);

  useEffect(() => {
    radius.value = withRepeat(withTiming(44, { duration: 900 }), -1, true);
    void appDb.select().from(habits).then((rows) => setDbCount(rows.length));
  }, [radius]);

  async function testDb() {
    await appDb.insert(habits).values({
      id: `smoke-${Date.now()}`,
      name: "Smoke Test Habit",
      createdAt: Date.now(),
    });
    const rows = await appDb.select().from(habits);
    setDbCount(rows.length);
  }

  async function testSecureStore() {
    await SecureStore.setItemAsync("smoke_key", "ok_secure");
    const val = await SecureStore.getItemAsync("smoke_key");
    setSecureVal(val ?? "null");
  }

  async function testApi() {
    try {
      const res = await client.health.$get();
      const data = await res.json();
      setApiStatus(data.ok ? "ok: true" : "failed");
    } catch (e) {
      setApiStatus(e instanceof Error ? e.message : "error");
    }
  }

  async function testNotification() {
    await Notifications.requestPermissionsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: "Habit Tracker", body: "Smoke test notification" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white p-6">
      <Text className="text-xl font-bold text-neutral-900">
        Smoke Test (Option A)
      </Text>

      <Canvas style={{ width: 120, height: 120 }}>
        <Circle cx={60} cy={60} r={radius} color="#2563eb" />
      </Canvas>

      <Text className="text-sm text-neutral-700">
        DB rows: {dbCount} | SecureStore: {secureVal} | API: {apiStatus}
      </Text>

      <Pressable
        onPress={testDb}
        className="rounded-lg bg-blue-600 px-4 py-2"
      >
        <Text className="font-medium text-white">Insert Drizzle Row</Text>
      </Pressable>

      <Pressable
        onPress={testSecureStore}
        className="rounded-lg bg-emerald-600 px-4 py-2"
      >
        <Text className="font-medium text-white">Test SecureStore</Text>
      </Pressable>

      <Pressable
        onPress={testApi}
        className="rounded-lg bg-violet-600 px-4 py-2"
      >
        <Text className="font-medium text-white">Test Hono RPC /health</Text>
      </Pressable>

      <Pressable
        onPress={testNotification}
        className="rounded-lg bg-amber-600 px-4 py-2"
      >
        <Text className="font-medium text-white">Test Notification (2s)</Text>
      </Pressable>
    </View>
  );
}
