import { useLayoutEffect, type ReactNode } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import GripVertical from "lucide-react-native/icons/grip-vertical";
import { colors, motion, radii } from "@/theme/tokens";

const ESTIMATED_ROW_HEIGHT = 96;

type DraggableQuestCardProps = {
  readonly index: number;
  readonly totalCount: number;
  readonly reduceMotion: boolean;
  readonly activeDragIndex: SharedValue<number>;
  readonly hoverIndex: SharedValue<number>;
  readonly onReorder: (targetIndex: number) => void;
  readonly children: ReactNode;
};

export function DraggableQuestCard({
  index,
  totalCount,
  reduceMotion,
  activeDragIndex,
  hoverIndex,
  onReorder,
  children,
}: DraggableQuestCardProps) {
  const translateY = useSharedValue(0);

  useLayoutEffect(() => {
    translateY.set(0);
    activeDragIndex.set(-1);
    hoverIndex.set(-1);
  }, [index, translateY, activeDragIndex, hoverIndex]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      activeDragIndex.set(index);
      hoverIndex.set(index);
    })
    .onUpdate((e) => {
      translateY.set(e.translationY);
      const delta = Math.round(e.translationY / ESTIMATED_ROW_HEIGHT);
      hoverIndex.set(Math.max(0, Math.min(totalCount - 1, index + delta)));
    })
    .onEnd(() => {
      const targetIndex = hoverIndex.get();
      if (targetIndex !== index && targetIndex >= 0) {
        runOnJS(onReorder)(targetIndex);
      } else {
        activeDragIndex.set(-1);
        hoverIndex.set(-1);
        translateY.set(
          reduceMotion ? 0 : withSpring(0, motion.springs.snappy),
        );
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const active = activeDragIndex.value;
    const hover = hoverIndex.value;

    if (active === index) {
      return {
        transform: [{ translateY: translateY.value }, { scale: 1.02 }],
        zIndex: 100,
      };
    }

    let shiftY = 0;
    if (active !== -1 && hover !== -1) {
      if (active < hover && index > active && index <= hover) {
        shiftY = -ESTIMATED_ROW_HEIGHT;
      } else if (active > hover && index >= hover && index < active) {
        shiftY = ESTIMATED_ROW_HEIGHT;
      }
    }

    return {
      transform: [
        {
          translateY:
            active === -1 || reduceMotion
              ? shiftY
              : withSpring(shiftY, motion.springs.snappy),
        },
        { scale: 1 },
      ],
      zIndex: 1,
    };
  });

  const topIndicatorStyle = useAnimatedStyle(() => {
    const active = activeDragIndex.value;
    const hover = hoverIndex.value;
    const show =
      active !== -1 && active !== index && hover === index && active > index;
    return { opacity: show ? 1 : 0 };
  });

  const bottomIndicatorStyle = useAnimatedStyle(() => {
    const active = activeDragIndex.value;
    const hover = hoverIndex.value;
    const show =
      active !== -1 && active !== index && hover === index && active < index;
    return { opacity: show ? 1 : 0 };
  });

  return (
    <Animated.View style={cardStyle} className="mb-3">
      <Animated.View
        style={[
          {
            height: 3,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            marginBottom: 4,
          },
          topIndicatorStyle,
        ]}
      />
      <View className="flex-row items-center">
        <View className="flex-1">{children}</View>
        {totalCount > 1 ? (
          <GestureDetector gesture={panGesture}>
            <View
              accessibilityRole="adjustable"
              accessibilityLabel="Drag to reorder quest"
              className="ml-1.5 min-h-[44px] min-w-[32px] items-center justify-center"
            >
              <GripVertical size={18} color={colors.textSecondary} />
            </View>
          </GestureDetector>
        ) : null}
      </View>
      <Animated.View
        style={[
          {
            height: 3,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            marginTop: 4,
          },
          bottomIndicatorStyle,
        ]}
      />
    </Animated.View>
  );
}
