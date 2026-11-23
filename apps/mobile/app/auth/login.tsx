import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useAuthActions } from "@/features/auth";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { authenticate } = useAuthActions();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setError(null);
      setSubmitting(true);
      const result = await authenticate(mode, email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.back();
    } catch {
      setError(
        "Could not connect to the server. Check your internet connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  };

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
          <Animated.View
            entering={FadeIn.duration(180).easing(Easing.out(Easing.cubic))}
            layout={LinearTransition.duration(180).easing(Easing.out(Easing.cubic))}
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
              style={inputStyle}
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
              style={inputStyle}
              className="mb-4 min-h-[44px] px-3 text-base"
            />

            {error ? (
              <Animated.View
                entering={FadeIn.duration(150).easing(Easing.out(Easing.cubic))}
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
              </Animated.View>
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
