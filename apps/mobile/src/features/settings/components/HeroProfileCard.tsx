import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import {
  PixelAvatar,
  type AvatarClass,
  type AvatarVisualState,
  type QuestProgress,
} from "@/features/habits";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
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
  const { colors } = useTheme();

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
              <View
                style={{
                  borderRadius: radii.badge,
                  backgroundColor: colors.accentBg,
                }}
                className="px-2 py-0.5"
              >
                <Text
                  tabularNums
                  className="text-xs font-extrabold text-[#2A2140]"
                >
                  LVL {questProgress.level}
                </Text>
              </View>
              <Text tabularNums className="text-xs font-bold text-[#6B4DF5]">
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
          <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#6B6285]">
            Character Class
          </Text>
          <View className="flex-row gap-2">
            {AVATAR_CLASSES.map((cls) => {
              const active = avatarClass === cls.value;
              return (
                <Pressable
                  key={cls.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Select ${cls.label} class`}
                  onPress={() => onSelectAvatarClass(cls.value)}
                  style={{
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderBottomWidth: active ? 3 : 1,
                    borderColor: active
                      ? colors.primaryPressed
                      : colors.borderStrong,
                    backgroundColor: active ? colors.primary : colors.surface,
                  }}
                  className="min-h-[40px] flex-1 items-center justify-center"
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-white" : "text-[#2A2140]"
                    }`}
                  >
                    {cls.label}
                  </Text>
                </Pressable>
              );
            })}
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
