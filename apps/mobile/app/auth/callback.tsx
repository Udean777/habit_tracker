import { useEffect, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import {
  mapQuestProgressToAvatar,
  PixelAvatar,
  type QuestProgress,
} from "@/features/habits";
import { useUiStore } from "@/stores/uiStore";
import { useTheme } from "@/theme/useTheme";

const CALLBACK_PROGRESS: QuestProgress = {
  level: 1,
  totalXp: 0,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  completedToday: 0,
  scheduledToday: 1,
  comboMultiplier: 1,
};

const COLD_LINK_FALLBACK_MS = 8000;

/**
 * Deep-link landing route for `glimkin://auth/callback`.
 * Stays visible while `login.tsx` finishes exchanging the OAuth ticket and
 * dismissing the auth stack, so `login.tsx` never flashes back underneath.
 */
export default function OAuthCallbackScreen() {
  const { colors } = useTheme();
  const avatarClass = useUiStore((s) => s.avatarClass);

  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(CALLBACK_PROGRESS, avatarClass),
    [avatarClass],
  );

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      router.replace("/(tabs)/settings");
    }, COLD_LINK_FALLBACK_MS);
    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Card variant="primary" elevated className="items-center p-6">
          <Badge
            label="GUILD LINK"
            variant="accent"
            pill
            className="mb-3 px-2.5 py-0.5"
            textClassName="text-[10px] font-extrabold"
          />
          <PixelAvatar
            state={avatarState}
            reduceMotion={false}
            triggerKey={1}
            size={84}
          />
          <Text tone="onPrimary" className="mt-3 text-lg font-extrabold">
            Completing Guild Sign-In
          </Text>
          <Text tone="onPrimary" className="mt-1 text-center text-xs">
            Verifying your account and returning to Glimkin...
          </Text>
          <View className="mt-4 flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.accent} />
            <Text tone="onPrimary" className="text-xs font-bold">
              Syncing local save
            </Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
