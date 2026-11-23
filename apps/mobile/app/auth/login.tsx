import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { eq } from "drizzle-orm";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { appDb } from "@/db/client";
import { syncState } from "@/db/schema";
import { apiClient, saveAuthTokens } from "@/lib/apiClient";
import { useUiStore } from "@/stores/uiStore";
import { colors, radii } from "@/theme/tokens";
import {
  enqueueAllLocalDataForSync,
  runSyncCycle,
} from "@/sync/syncEngine";

export default function LoginScreen() {
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setError(null);
      setSubmitting(true);

      const rows = await appDb
        .select()
        .from(syncState)
        .where(eq(syncState.id, "singleton"));
      const deviceId = rows[0]?.deviceId ?? "mobile-device";

      const res =
        mode === "login"
          ? await apiClient.auth.login.$post({
              json: { email, password, deviceId },
            })
          : await apiClient.auth.register.$post({
              json: { email, password, deviceId },
            });

      if (!res.ok) {
        setError(
          mode === "login"
            ? "Invalid email or password"
            : "Could not create account",
        );
        return;
      }

      const data = await res.json();
      await saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: data.user.email,
      });

      await enqueueAllLocalDataForSync();
      await runSyncCycle();
      bumpDataVersion();
      router.back();
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="pt-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="flex-row items-center justify-between pb-6">
            <Text variant="title">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Text>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>

          <Text variant="heading" className="mb-1">
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            style={{
              borderRadius: radii.button,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            }}
            className="mb-4 min-h-[44px] px-3 text-base"
          />

          <Text variant="heading" className="mb-1">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textSecondary}
            style={{
              borderRadius: radii.button,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            }}
            className="mb-4 min-h-[44px] px-3 text-base"
          />

          {error ? (
            <View
              accessibilityRole="alert"
              style={{
                borderRadius: radii.badge,
                borderWidth: 1,
                borderColor: colors.danger,
                backgroundColor: "#FEF2F2",
              }}
              className="mb-4 p-3"
            >
              <Text variant="caption" style={{ color: colors.danger }}>
                Error: {error}
              </Text>
            </View>
          ) : null}

          <Button
            label={
              submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In & Sync"
                  : "Register & Sync"
            }
            disabled={submitting}
            onPress={() => void handleSubmit()}
          />

          <Button
            label={
              mode === "login"
                ? "Need an account? Register"
                : "Already have an account? Sign In"
            }
            variant="secondary"
            className="mt-3"
            onPress={() =>
              setMode((m) => (m === "login" ? "register" : "login"))
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
