import { View } from "react-native";
import { router } from "expo-router";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { SelectableChip } from "@/components/SelectableChip";
import { Text } from "@/components/Text";
import {
  PixelAvatar,
  type AvatarClass,
  type AvatarVisualState,
  type QuestProgress,
} from "@/features/habits";
import { Section } from "./SettingsPrimitives";

const AVATAR_CLASSES: readonly {
  readonly label: string;
  readonly value: AvatarClass;
}[] = [
  { label: "Knight", value: "knight" },
  { label: "Mage", value: "mage" },
  { label: "Ranger", value: "ranger" },
];

type HeroProfileCardProps = {
  readonly avatarState: AvatarVisualState;
  readonly questProgress: QuestProgress;
  readonly avatarClass: AvatarClass;
  readonly reduceMotion: boolean;
  readonly accountEmail: string | null;
  readonly syncMessage: string | null;
  readonly onSelectAvatarClass: (cls: AvatarClass) => void;
  readonly onSyncNow: () => void;
  readonly onSignOut: () => void;
};

export function HeroProfileCard({
  avatarState,
  questProgress,
  avatarClass,
  reduceMotion,
  accountEmail,
  syncMessage,
  onSelectAvatarClass,
  onSyncNow,
  onSignOut,
}: HeroProfileCardProps) {
  return (
    <Section title="Hero Profile & Account">
      <View className="p-4">
        <View className="flex-row items-center gap-3.5">
          <PixelAvatar
            state={avatarState}
            reduceMotion={reduceMotion}
            size={68}
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Badge
                label={`LVL ${questProgress.level}`}
                variant="accent"
                tabularNums
              />
              <Text
                tabularNums
                tone="primaryAccent"
                className="text-xs font-bold"
              >
                {questProgress.totalXp} Total XP
              </Text>
            </View>
            <Text variant="heading" className="mt-1">
              {avatarState.classTitle}
            </Text>
            <Text variant="caption" className="mt-0.5" numberOfLines={1}>
              {accountEmail ? accountEmail : "Guest Adventurer (Local)"}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <Text variant="label" className="mb-1.5">
            Character Class
          </Text>
          <View className="flex-row gap-2">
            {AVATAR_CLASSES.map((cls) => (
              <SelectableChip
                key={cls.value}
                label={cls.label}
                selected={avatarClass === cls.value}
                accessibilityLabel={`Select ${cls.label} class`}
                onPress={() => onSelectAvatarClass(cls.value)}
                textClassName="text-xs font-bold"
              />
            ))}
          </View>
        </View>

        {syncMessage ? (
          <Text variant="caption" className="mt-3">
            {syncMessage}
          </Text>
        ) : null}

        <View className="mt-3 flex-row gap-2">
          {accountEmail ? (
            <>
              <Button label="Sync Now" className="flex-1" onPress={onSyncNow} />
              <Button
                label="Sign Out"
                variant="secondary"
                className="flex-1"
                onPress={onSignOut}
              />
            </>
          ) : (
            <Button
              label="Sign In / Register"
              className="flex-1"
              onPress={() => router.push("/auth/login")}
            />
          )}
        </View>
      </View>
    </Section>
  );
}
