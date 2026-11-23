import { useMemo } from "react";
import { Pressable, View } from "react-native";
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

const SAMPLE_PROGRESS: QuestProgress = {
  level: 1,
  totalXp: 0,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  completedToday: 0,
  scheduledToday: 3,
  comboMultiplier: 1,
};

const CLASS_META: Record<
  AvatarClass,
  { readonly label: string; readonly role: string; readonly summary: string }
> = {
  knight: {
    label: "Knight",
    role: "Squire",
    summary: "Steadfast discipline. Built for daily streaks and steel resolve.",
  },
  mage: {
    label: "Mage",
    role: "Apprentice Mage",
    summary: "Arcane focus. Ideal for deep work, study, and creative rituals.",
  },
  ranger: {
    label: "Ranger",
    role: "Forest Scout",
    summary: "Balanced rhythm. Made for movement, health, and steady pacing.",
  },
};

const CLASS_ORDER: readonly AvatarClass[] = ["knight", "mage", "ranger"];

type OnboardingHeroStepProps = {
  readonly avatarClass: AvatarClass;
  readonly triggerKey: number;
  readonly reduceMotion: boolean;
  readonly onSelectClass: (cls: AvatarClass) => void;
};

export function OnboardingHeroStep({
  avatarClass,
  triggerKey,
  reduceMotion,
  onSelectClass,
}: OnboardingHeroStepProps) {
  const { colors } = useTheme();
  const activeOption = CLASS_META[avatarClass];

  const avatarState = useMemo(
    () => mapQuestProgressToAvatar(SAMPLE_PROGRESS, avatarClass),
    [avatarClass],
  );

  return (
    <View className="flex-1 justify-between">
      <View>
        <Text variant="title">Meet your pixel hero</Text>
        <Text variant="body" tone="secondary" className="mt-1.5">
          Glimkin turns everyday habits into quests. Pick your starting class —
          tap the hero to test their celebration.
        </Text>

        <Card variant="primary" elevated className="mt-5 items-center p-5">
          <PixelAvatar
            state={avatarState}
            reduceMotion={reduceMotion}
            triggerKey={triggerKey}
            size={108}
          />
          <View className="mt-3 flex-row items-center gap-2">
            <Badge label="LVL 1" variant="accent" pill tabularNums />
            <Text tone="onPrimary" className="text-lg font-extrabold">
              {activeOption.role}
            </Text>
          </View>
          <Text tone="onPrimary" className="mt-1.5 text-center text-xs">
            {activeOption.summary}
          </Text>
        </Card>

        <View className="mt-4 flex-row gap-2.5">
          {CLASS_ORDER.map((cls) => {
            const opt = CLASS_META[cls];
            const selected = cls === avatarClass;
            return (
              <Pressable
                key={cls}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${opt.label} class`}
                accessibilityState={{ selected }}
                onPress={() => onSelectClass(cls)}
                style={{
                  borderRadius: radii.button,
                  borderWidth: selected ? 2 : 1,
                  borderBottomWidth: selected ? 4 : 1,
                  borderColor: selected
                    ? colors.primaryPressed
                    : colors.borderStrong,
                  backgroundColor: selected ? colors.primary : colors.surface,
                }}
                className="min-h-[52px] flex-1 items-center justify-center px-2 py-2"
              >
                <Text
                  tone={selected ? "onPrimary" : "primary"}
                  className="text-sm font-extrabold"
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
