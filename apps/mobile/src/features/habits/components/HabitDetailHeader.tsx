import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type HabitDetailHeaderProps = {
  readonly name: string;
  readonly reduceMotion: boolean;
  readonly onRename: (nextName: string) => Promise<void>;
};

export function HabitDetailHeader({
  name,
  reduceMotion,
  onRename,
}: HabitDetailHeaderProps) {
  const { colors } = useTheme();
  const [editingName, setEditingName] = useState<string | null>(null);

  async function saveNameEdit() {
    if (editingName === null) return;
    const trimmed = editingName.trim();
    if (trimmed.length > 0) {
      await onRename(trimmed);
    }
    setEditingName(null);
  }

  return (
    <>
      <View className="flex-row items-center gap-3 pb-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{
            borderRadius: radii.button,
            borderWidth: 1,
            borderBottomWidth: 3,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
          }}
          className="min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.5} />
        </Pressable>
        <Text variant="title" className="flex-1" numberOfLines={1}>
          {name}
        </Text>
        {editingName === null ? (
          <Button
            label="Rename"
            variant="secondary"
            onPress={() => setEditingName(name)}
          />
        ) : null}
      </View>

      {editingName !== null ? (
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeIn.duration(160).easing(Easing.out(Easing.cubic))
          }
          className="mb-4 gap-2"
        >
          <TextField
            value={editingName}
            onChangeText={setEditingName}
            containerClassName=""
          />
          <View className="flex-row gap-2">
            <Button label="Save Name" onPress={() => void saveNameEdit()} />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setEditingName(null)}
            />
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}
