import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Shield from "lucide-react-native/icons/shield";
import type { AvatarClass } from "@habit/shared";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import {
  mapQuestProgressToAvatar,
  PixelAvatar,
  type QuestProgress,
} from "@/features/habits";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const PREVIEW_PALETTES = [
  { id: null, label: "Classic", color: "#6B4DF5" },
  { id: "palette_crimson", label: "Crimson", color: "#E11D48" },
  { id: "palette_frost", label: "Glacier", color: "#0EA5E9" },
  { id: "palette_solar", label: "Solar", color: "#F59E0B" },
] as const;

const PREVIEW_PROGRESS: QuestProgress = {
  level: 5,
  totalXp: 1000,
  xpIntoLevel: 120,
  xpForNextLevel: 500,
  completedToday: 3,
  scheduledToday: 3,
  comboMultiplier: 3,
};

type OnboardingRewardsStepProps = {
  readonly avatarClass: AvatarClass;
  readonly reduceMotion: boolean;
  readonly onInteractionHaptic: () => void;
};

export function OnboardingRewardsStep({
  avatarClass,
  reduceMotion,
  onInteractionHaptic,
}: OnboardingRewardsStepProps) {
  const { colors } = useTheme();
  const [previewPaletteId, setPreviewPaletteId] = useState<string | null>(
    "palette_solar",
  );
  const [shieldActive, setShieldActive] = useState(true);

  const avatarState = useMemo(
    () =>
      mapQuestProgressToAvatar(PREVIEW_PROGRESS, avatarClass, {
        avatarClass,
        equippedPaletteId: previewPaletteId,
        equippedAuraId: previewPaletteId ? "aura_crown" : null,
        equippedFrameId: previewPaletteId ? "frame_gold" : null,
      }),
    [avatarClass, previewPaletteId],
  );

  return (
    <View className="flex-1">
      <Text variant="title">Gear up & guard your streaks</Text>
      <Text variant="body" tone="secondary" className="mt-1.5">
        Earn Gold from quests, perfect days, milestones, trophies, and level-ups
        — then spend it in the Hero Shop.
      </Text>

      <Card elevated className="mt-4 p-4">
        <View className="flex-row items-center gap-3.5">
          <PixelAvatar
            state={avatarState}
            reduceMotion={reduceMotion}
            triggerKey={previewPaletteId ? 1 : 0}
            size={72}
          />
          <View className="flex-1 gap-1.5">
            <Text variant="heading">Hero Shop Preview</Text>
            <Text variant="caption">
              Tap a color below to preview unlockable armor palettes & auras.
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row gap-2">
          {PREVIEW_PALETTES.map((p) => {
            const selected = previewPaletteId === p.id;
            return (
              <Pressable
                key={p.label}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${p.label} palette`}
                accessibilityState={{ selected }}
                onPress={() => {
                  onInteractionHaptic();
                  setPreviewPaletteId(p.id);
                }}
                style={{
                  borderRadius: radii.button,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.textPrimary : colors.border,
                  backgroundColor: selected
                    ? colors.surfaceMuted
                    : colors.background,
                }}
                className="min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 px-1.5"
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: radii.pill,
                    backgroundColor: p.color,
                  }}
                />
                <Text className="text-xs font-bold">{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card
        variant="muted"
        style={{
          borderColor: shieldActive ? colors.accentBorder : colors.border,
        }}
        className="mt-3 p-3.5"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              backgroundColor: colors.accentBg,
              borderRadius: radii.button,
              borderWidth: 1,
              borderColor: colors.accentBorder,
            }}
            className="h-10 w-10 items-center justify-center"
          >
            <Shield size={20} color={colors.accentText} strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text variant="heading" className="text-base">
                Streak Shields
              </Text>
              <Badge
                label={shieldActive ? "7d Protected" : "Missed day"}
                variant={shieldActive ? "accent" : "muted"}
                pill
                className="px-2 py-0.5"
                textClassName="text-[10px] font-extrabold"
              />
            </View>
            <Text variant="caption" className="mt-0.5">
              Missed yesterday? Activate a shield so your streak stays alive
              without guilt.
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: shieldActive }}
            accessibilityLabel="Toggle streak shield preview"
            onPress={() => {
              onInteractionHaptic();
              setShieldActive((v) => !v);
            }}
            style={{
              borderRadius: radii.button,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: shieldActive ? colors.primary : colors.surface,
            }}
            className="min-h-[44px] min-w-[54px] items-center justify-center px-2"
          >
            <Text
              tone={shieldActive ? "onPrimary" : "primary"}
              className="text-xs font-extrabold"
            >
              {shieldActive ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Text variant="caption" className="mt-3">
        Everything works 100% offline. Sign in later in Settings whenever you
        want cloud sync across devices.
      </Text>
    </View>
  );
}
