import { Modal, View } from "react-native";
import Animated, { Easing, FadeIn, ZoomIn } from "react-native-reanimated";
import Sparkles from "lucide-react-native/icons/sparkles";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { PixelAvatar, type AvatarVisualState } from "@/features/habits";
import { useTheme } from "@/theme/useTheme";

type LevelUpModalProps = {
  readonly visible: boolean;
  readonly level: number;
  readonly avatarState: AvatarVisualState;
  readonly reduceMotion: boolean;
  readonly onClose: () => void;
};

export function LevelUpModal({
  visible,
  level,
  avatarState,
  reduceMotion,
  onClose,
}: LevelUpModalProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : ZoomIn.duration(220).easing(Easing.out(Easing.cubic))
          }
          className="w-full max-w-sm"
        >
          <Card
            elevated
            style={{ borderColor: colors.accentBorder }}
            className="items-center p-6"
          >
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.duration(180)}
              className="items-center"
            >
              <Badge
                label={`LEVEL ${level} UNLOCKED`}
                variant="accent"
                pill
                icon={
                  <Sparkles
                    size={14}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />

              <View className="my-4">
                <PixelAvatar
                  state={avatarState}
                  reduceMotion={reduceMotion}
                  size={84}
                />
              </View>

              <Text variant="title" className="text-center">
                {avatarState.classTitle}
              </Text>
              <Text variant="caption" className="mt-1 text-center">
                Your consistency forged a stronger hero. Visit the Hero Shop to
                spend your Gold on new gear!
              </Text>
            </Animated.View>

            <Button
              label="Continue Questing"
              className="mt-5 w-full"
              onPress={onClose}
            />
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}
