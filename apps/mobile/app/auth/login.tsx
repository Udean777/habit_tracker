import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import Check from "lucide-react-native/icons/check";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import Shield from "lucide-react-native/icons/shield";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useAuthActions } from "@/features/auth";
import { useGamification } from "@/features/gamification";
import {
  computeQuestProgress,
  mapQuestProgressToAvatar,
  PixelAvatar,
  useHabitsData,
} from "@/features/habits";
import { triggerHaptic } from "@/lib/haptics";
import { useMotionPreferences } from "@/lib/motion";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const { colors } = useTheme();
  const {
    activeHabits,
    logs,
    effectiveToday,
    settings,
    pendingOutbox,
  } = useHabitsData();
  const { heroProfile } = useGamification(
    activeHabits,
    logs,
    effectiveToday,
    settings.hapticsEnabled,
  );
  const motionPrefs = useMotionPreferences(settings);
  const { authenticate } = useAuthActions();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroTrigger, setHeroTrigger] = useState(0);

  const passwordInputRef = useRef<TextInput | null>(null);

  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );
  const avatarState = useMemo(
    () =>
      mapQuestProgressToAvatar(
        questProgress,
        heroProfile.avatarClass,
        heroProfile,
      ),
    [questProgress, heroProfile],
  );

  const trimmedEmail = email.trim();
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail);
  const isPasswordValid = password.length >= MIN_PASSWORD_LEN;

  const emailFieldError =
    touchedSubmit && !isEmailValid
      ? "Enter a valid email address (for example: hero@example.com)."
      : null;
  const passwordFieldError =
    touchedSubmit && !isPasswordValid
      ? "Password must be at least 8 characters."
      : null;

  function handleSelectMode(nextMode: AuthMode) {
    if (nextMode === mode) return;
    triggerHaptic("selection", settings.hapticsEnabled);
    setMode(nextMode);
    setError(null);
    setTouchedSubmit(false);
    setHeroTrigger((n) => n + 1);
  }

  function handleTapHero() {
    triggerHaptic("selection", settings.hapticsEnabled);
    setHeroTrigger((n) => n + 1);
  }

  async function handleSubmit() {
    setTouchedSubmit(true);
    setError(null);

    if (!isEmailValid || !isPasswordValid) {
      triggerHaptic("light", settings.hapticsEnabled);
      return;
    }

    try {
      setSubmitting(true);
      setHeroTrigger((n) => n + 1);
      const result = await authenticate(mode, trimmedEmail, password);
      if (!result.ok) {
        triggerHaptic("light", settings.hapticsEnabled);
        setError(result.message);
        return;
      }
      triggerHaptic("success", settings.hapticsEnabled);
      router.back();
    } catch {
      triggerHaptic("light", settings.hapticsEnabled);
      setError(
        "Could not reach the sync server. Your local data is safe on this device. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="pt-3">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36 }}
        >
          <Animated.View
            entering={
              motionPrefs.reduceMotion
                ? undefined
                : FadeIn.duration(180).easing(Easing.out(Easing.cubic))
            }
            layout={
              motionPrefs.reduceMotion
                ? undefined
                : LinearTransition.duration(180).easing(
                    Easing.out(Easing.cubic),
                  )
            }
          >
            {/* Header Bar */}
            <View className="flex-row items-center justify-between pb-3">
              <View>
                <Text variant="title">Cloud Guild Roster</Text>
                <Text variant="caption" tone="secondary">
                  Back up your local hero and sync across devices
                </Text>
              </View>
              <Button
                label="Close"
                variant="secondary"
                onPress={() => router.back()}
              />
            </View>

            {/* Interactive Local Hero Preview Card (Real Local SQLite Data) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Preview ${avatarState.classTitle}, tap to celebrate`}
              onPress={handleTapHero}
            >
              <Card variant="primary" elevated className="mt-1 p-4">
                <View className="flex-row items-center gap-3.5">
                  <PixelAvatar
                    state={avatarState}
                    reduceMotion={motionPrefs.reduceMotion}
                    triggerKey={heroTrigger}
                    size={68}
                  />
                  <View className="flex-1">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Badge
                        label={`LVL ${questProgress.level}`}
                        variant="accent"
                        pill
                        tabularNums
                      />
                      <Badge
                        label={`${activeHabits.length} ${
                          activeHabits.length === 1 ? "Quest" : "Quests"
                        }`}
                        variant="muted"
                        pill
                        tabularNums
                      />
                    </View>
                    <Text
                      tone="onPrimary"
                      className="mt-1.5 text-base font-extrabold"
                    >
                      {avatarState.classTitle}
                    </Text>
                    <Text tone="onPrimary" className="mt-0.5 text-xs">
                      {pendingOutbox > 0
                        ? `${pendingOutbox} local ${
                            pendingOutbox === 1 ? "change" : "changes"
                          } ready to upload on sign-in`
                        : "Local save ready to link with your cloud account"}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>

            {/* Tactile Segmented Mode Switcher */}
            <View
              accessibilityRole="tablist"
              style={{
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surfaceMuted,
              }}
              className="mt-4 flex-row gap-1.5 p-1.5"
            >
              {(
                [
                  { key: "login", label: "Sign In" },
                  { key: "register", label: "Create Account" },
                ] as const
              ).map((tab) => {
                const selected = mode === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    accessibilityRole="tab"
                    accessibilityLabel={tab.label}
                    accessibilityState={{ selected }}
                    onPress={() => handleSelectMode(tab.key)}
                    style={{
                      borderRadius: radii.button,
                      borderWidth: selected ? 1 : 0,
                      borderBottomWidth: selected ? 3 : 0,
                      borderColor: selected
                        ? colors.primaryPressed
                        : "transparent",
                      backgroundColor: selected
                        ? colors.primary
                        : "transparent",
                    }}
                    className="min-h-[44px] flex-1 items-center justify-center px-3"
                  >
                    <Text
                      tone={selected ? "onPrimary" : "primary"}
                      className="text-sm font-extrabold"
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Form Card */}
            <Card className="mt-4 p-4">
              <Text variant="heading">
                {mode === "login"
                  ? "Welcome back, adventurer"
                  : "Register your hero in the cloud"}
              </Text>
              <Text variant="caption" tone="secondary" className="mt-1 mb-4">
                {mode === "login"
                  ? "Signing in merges your local quests with your cloud save without losing offline progress."
                  : "Your existing local quests, XP, Gold, and equipped gear will automatically sync to your new account."}
              </Text>

              <TextField
                label="Email Address"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (error) setError(null);
                }}
                error={emailFieldError}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                placeholder="email@example.com"
              />

              <TextField
                ref={passwordInputRef}
                label="Password"
                hint={mode === "register" ? "Min 8 chars" : undefined}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (error) setError(null);
                }}
                error={passwordFieldError}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                textContentType={
                  mode === "register" ? "newPassword" : "password"
                }
                returnKeyType="go"
                onSubmitEditing={() => void handleSubmit()}
                placeholder="Enter at least 8 characters"
                containerClassName="mb-3"
                rightSlot={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onPress={() => {
                      triggerHaptic("selection", settings.hapticsEnabled);
                      setShowPassword((prev) => !prev);
                    }}
                    className="min-h-[44px] min-w-[44px] items-center justify-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </Pressable>
                }
              />

              {/* Live Readiness Checklist */}
              <View
                style={{
                  borderRadius: radii.button,
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                className="mb-4 flex-row flex-wrap items-center justify-between gap-2 px-3 py-2.5"
              >
                <View className="flex-row items-center gap-1.5">
                  <Check
                    size={14}
                    color={
                      isEmailValid ? colors.success : colors.textSecondary
                    }
                  />
                  <Text
                    variant="caption"
                    tone={isEmailValid ? "primary" : "secondary"}
                    className={isEmailValid ? "font-bold" : ""}
                  >
                    Valid email format
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <Check
                    size={14}
                    color={
                      isPasswordValid ? colors.success : colors.textSecondary
                    }
                  />
                  <Text
                    variant="caption"
                    tone={isPasswordValid ? "primary" : "secondary"}
                    className={isPasswordValid ? "font-bold" : ""}
                  >
                    8+ chars ({password.length}/8)
                  </Text>
                </View>
              </View>

              {error ? (
                <Animated.View
                  entering={
                    motionPrefs.reduceMotion
                      ? undefined
                      : FadeIn.duration(150).easing(Easing.out(Easing.cubic))
                  }
                  accessibilityRole="alert"
                  style={{
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderColor: colors.danger,
                    backgroundColor: colors.dangerSurface,
                  }}
                  className="mb-4 p-3"
                >
                  <Text variant="caption" tone="danger" className="font-bold">
                    {error}
                  </Text>
                </Animated.View>
              ) : null}

              <Button
                label={
                  submitting
                    ? mode === "login"
                      ? "Signing in & syncing..."
                      : "Creating account & syncing..."
                    : mode === "login"
                      ? "Sign In & Sync Hero"
                      : "Create Account & Sync Hero"
                }
                disabled={submitting}
                onPress={() => void handleSubmit()}
              />
            </Card>

            {/* Offline-first reassurance footer */}
            <View className="mt-4 flex-row items-center justify-between px-1">
              <View className="flex-1 flex-row items-center gap-2 pr-2">
                <Shield size={16} color={colors.textSecondary} />
                <Text variant="caption" tone="secondary" className="flex-1">
                  Offline-first: your SQLite data always stays on this device.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue offline as guest"
                onPress={() => router.back()}
                className="min-h-[44px] items-center justify-center px-2"
              >
                <Text tone="primaryAccent" className="text-xs font-extrabold">
                  Stay Guest
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
