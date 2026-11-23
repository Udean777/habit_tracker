import { useRef, type ReactNode } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import GripVertical from "lucide-react-native/icons/grip-vertical";
import { motion } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const FALLBACK_ROW_HEIGHT = 96;
const ITEM_GAP = 12;

type SortableItemProps = {
  readonly id: string;
  readonly index: number;
  readonly totalCount: number;
  readonly reduceMotion: boolean;
  readonly activeId: SharedValue<string | null>;
  readonly avgRowHeight: SharedValue<number>;
  readonly onMeasureHeight: (id: string, height: number) => void;
  readonly onReorder: (id: string, targetIndex: number) => void;
  readonly children: ReactNode;
};

function SortableItem({
  id,
  index,
  totalCount,
  reduceMotion,
  activeId,
  avgRowHeight,
  onMeasureHeight,
  onReorder,
  children,
}: SortableItemProps) {
  const { colors } = useTheme();
  const dragY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      activeId.set(id);
      dragY.set(0);
    })
    .onUpdate((e) => {
      dragY.set(e.translationY);
    })
    .onEnd((e) => {
      const stride = Math.max(48, avgRowHeight.get() + ITEM_GAP);
      const delta = Math.round(e.translationY / stride);
      const targetIndex = Math.max(
        0,
        Math.min(totalCount - 1, index + delta),
      );
      dragY.set(reduceMotion ? 0 : withSpring(0, motion.springs.snappy));
      activeId.set(null);
      if (targetIndex !== index) {
        runOnJS(onReorder)(id, targetIndex);
      }
    })
    .onFinalize(() => {
      dragY.set(reduceMotion ? 0 : withSpring(0, motion.springs.snappy));
      activeId.set(null);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isDragging = activeId.value === id;
    return {
      transform: [
        { translateY: dragY.value },
        { scale: isDragging ? 1.01 : 1 },
      ],
      opacity: isDragging ? 0.96 : 1,
      zIndex: isDragging ? 100 : 1,
    };
  });

  return (
    <Animated.View
      layout={
        reduceMotion
          ? undefined
          : LinearTransition.duration(180).easing(Easing.out(Easing.cubic))
      }
      onLayout={(e) => onMeasureHeight(id, e.nativeEvent.layout.height)}
      style={animatedStyle}
    >
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
    </Animated.View>
  );
}

type DraggableQuestListProps<T extends { readonly id: string }> = {
  readonly items: readonly T[];
  readonly reduceMotion: boolean;
  readonly onReorder: (id: string, targetIndex: number) => void;
  readonly renderItem: (item: T) => ReactNode;
};

export function DraggableQuestList<T extends { readonly id: string }>({
  items,
  reduceMotion,
  onReorder,
  renderItem,
}: DraggableQuestListProps<T>) {
  const activeId = useSharedValue<string | null>(null);
  const avgRowHeight = useSharedValue(FALLBACK_ROW_HEIGHT);
  const heightsRef = useRef<Record<string, number>>({});

  function handleMeasureHeight(id: string, height: number) {
    if (height <= 0) return;
    heightsRef.current[id] = height;
    const values = Object.values(heightsRef.current);
    if (values.length > 0) {
      const avg = values.reduce((acc, h) => acc + h, 0) / values.length;
      avgRowHeight.set(avg);
    }
  }

  return (
    <View className="gap-3">
      {items.map((item, idx) => (
        <SortableItem
          key={item.id}
          id={item.id}
          index={idx}
          totalCount={items.length}
          reduceMotion={reduceMotion}
          activeId={activeId}
          avgRowHeight={avgRowHeight}
          onMeasureHeight={handleMeasureHeight}
          onReorder={onReorder}
        >
          {renderItem(item)}
        </SortableItem>
      ))}
    </View>
  );
}
