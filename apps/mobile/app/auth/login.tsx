import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import { router } from "expo-router";
import type { OAuthProvider } from "@habit/shared";
import Check from "lucide-react-native/icons/check";
import Shield from "lucide-react-native/icons/shield";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
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

type ActiveAuthAction = OAuthProvider | "dev" | null;

const SYNC_GUARANTEES: readonly {
  readonly title: string;
  readonly detail: string;
}[] = [
  {
    title: "Automatic Email Linking",
    detail:
      "Google and GitHub accounts with the same verified email link to one hero profile.",
  },
  {
    title: "Conflict-Free Offline Merge",
    detail:
      "Your local quests, streaks, XP, Gold, and equipped cosmetics merge on first sync.",
  },
  {
    title: "Zero Password Storage",
    detail:
      "No passwords to remember or reset. Tokens stay encrypted in device SecureStore.",
  },
];

export default function LoginScreen() {
  const { colors } = useTheme();
  const {
    activeHabits,
    logs,
    effectiveToday,
    settings,
    pendingOutbox,
  } = useHabitsData();
  const { heroProfile, goldEconomy } = useGamification(
    activeHabits,
    logs,
    effectiveToday,
    settings.hapticsEnabled,
  );
  const motionPrefs = useMotionPreferences(settings);
  const { authenticateWithOAuth, authenticateDevLocal } = useAuthActions();

  const [activeAction, setActiveAction] = useState<ActiveAuthAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [heroTrigger, setHeroTrigger] = useState(0);

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

  function handleTapHero() {
    triggerHaptic("selection", settings.hapticsEnabled);
    setHeroTrigger((n) => n + 1);
  }

  async function handleOAuthPress(provider: OAuthProvider) {
    if (activeAction !== null) return;
    triggerHaptic("medium", settings.hapticsEnabled);
    setError(null);
    setActiveAction(provider);
    setHeroTrigger((n) => n + 1);

    try {
      const result = await authenticateWithOAuth(provider);
      if (!result.ok) {
        if (!result.cancelled) {
          triggerHaptic("light", settings.hapticsEnabled);
          setError(result.message);
        }
        return;
      }
      triggerHaptic("success", settings.hapticsEnabled);
      router.back();
    } catch {
      triggerHaptic("light", settings.hapticsEnabled);
      setError(
        "Could not connect to the authentication server. Your local data remains safe on this device.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleDevQuickPress() {
    if (activeAction !== null) return;
    triggerHaptic("medium", settings.hapticsEnabled);
    setError(null);
    setActiveAction("dev");
    setHeroTrigger((n) => n + 1);

    try {
      const result = await authenticateDevLocal();
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
        "Could not reach the local dev API. Make sure bun run dev:api is running.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <Screen className="pt-3">
      <ScrollView
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
              : LinearTransition.duration(180).easing(Easing.out(Easing.cubic))
          }
        >
          {/* Header Bar */}
          <View className="flex-row items-center justify-between pb-3">
            <View className="flex-1 pr-3">
              <Text variant="title">Cloud Guild Roster</Text>
              <Text variant="caption" tone="secondary">
                Link your local hero for automatic cloud backup & multi-device sync
              </Text>
            </View>
            <Button
              label="Close"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>

          {/* Interactive Local Hero Snapshot (Real Local SQLite Data) */}
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
                  size={72}
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
                      label={`${goldEconomy.availableGold}G`}
                      variant="muted"
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
                        } queued to sync on sign-in`
                      : "Tap your hero to celebrate. Ready to link with cloud save."}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>

          {/* OAuth Provider Card */}
          <Card className="mt-4 p-4">
            <Text variant="heading">One-Tap Guild Sign-In</Text>
            <Text variant="caption" tone="secondary" className="mt-1 mb-4">
              Choose a verified provider to sign in or create your cloud account
              instantly.
            </Text>

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

            {/* Continue with Google */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={activeAction !== null}
              onPress={() => void handleOAuthPress("google")}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderBottomWidth: 3,
                borderColor: colors.primaryPressed,
                backgroundColor: colors.primary,
              }}
              className={`min-h-[52px] flex-row items-center justify-between px-3.5 py-2.5 ${
                activeAction !== null && activeAction !== "google"
                  ? "opacity-50"
                  : ""
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radii.badge,
                    backgroundColor: colors.accentBg,
                    borderWidth: 1,
                    borderColor: colors.accentBorder,
                  }}
                  className="items-center justify-center"
                >
                  <Text tone="onAccent" className="text-base font-extrabold">
                    G
                  </Text>
                </View>
                <View>
                  <Text tone="onPrimary" className="text-sm font-extrabold">
                    {activeAction === "google"
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </Text>
                  <Text tone="onPrimary" className="text-[11px]">
                    Instant sign-in with your Google account
                  </Text>
                </View>
              </View>
              <Badge
                label="Verified"
                variant="accent"
                pill
                className="px-2 py-0.5"
                textClassName="text-[10px] font-extrabold"
              />
            </Pressable>

            {/* Continue with GitHub */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with GitHub"
              disabled={activeAction !== null}
              onPress={() => void handleOAuthPress("github")}
              style={{
                borderRadius: radii.button,
                borderWidth: 1,
                borderBottomWidth: 3,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surfaceMuted,
              }}
              className={`mt-3 min-h-[52px] flex-row items-center justify-between px-3.5 py-2.5 ${
                activeAction !== null && activeAction !== "github"
                  ? "opacity-50"
                  : ""
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radii.badge,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                  }}
                  className="items-center justify-center"
                >
                  <Text
                    tone="primaryAccent"
                    className="text-xs font-extrabold"
                  >
                    {"</>"}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-extrabold">
                    {activeAction === "github"
                      ? "Connecting to GitHub..."
                      : "Continue with GitHub"}
                  </Text>
                  <Text variant="caption" tone="secondary" className="text-[11px]">
                    Sign in with your verified GitHub email
                  </Text>
                </View>
              </View>
              <Badge
                label="OAuth 2.0"
                variant="muted"
                pill
                className="px-2 py-0.5"
                textClassName="text-[10px] font-bold"
              />
            </Pressable>

            {/* Sync Guarantees Breakdown */}
            <View
              style={{
                borderRadius: radii.button,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              className="mt-4 gap-2.5 p-3"
            >
              {SYNC_GUARANTEES.map((item) => (
                <View key={item.title} className="flex-row items-start gap-2.5">
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: radii.pill,
                      backgroundColor: colors.surfaceMuted,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    className="mt-0.5 items-center justify-center"
                  >
                    <Check size={12} color={colors.success} strokeWidth={3} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-extrabold">{item.title}</Text>
                    <Text variant="caption" tone="secondary" className="text-xs">
                      {item.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Local Dev Only Quick Sign-In (Stripped in Release APK/AAB) */}
          {__DEV__ ? (
            <Card variant="muted" className="mt-3 p-3.5">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Badge
                      label="LOCAL DEV ONLY"
                      variant="accent"
                      pill
                      className="px-2 py-0.5"
                      textClassName="text-[10px] font-extrabold"
                    />
                  </View>
                  <Text className="mt-1 text-xs font-bold">
                    Test Local Postgres Sync (LAN Wi-Fi)
                  </Text>
                  <Text variant="caption" tone="secondary" className="text-[11px]">
                    Signs into hero.dev@glimkin.local on your local Hono API
                    without requiring public OAuth callbacks.
                  </Text>
                </View>
                <Button
                  label={activeAction === "dev" ? "Linking..." : "Dev Sign-In"}
                  variant="secondary"
                  disabled={activeAction !== null}
                  onPress={() => void handleDevQuickPress()}
                />
              </View>
            </Card>
          ) : null}

          {/* Offline-first reassurance footer */}
          <View className="mt-4 flex-row items-center justify-between px-1">
            <View className="flex-1 flex-row items-center gap-2 pr-2">
              <Shield size={16} color={colors.textSecondary} />
              <Text variant="caption" tone="secondary" className="flex-1">
                Offline-first: your SQLite data always works without an account.
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
    </Screen>
  );
}
