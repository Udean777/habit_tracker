import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import GripVertical from "lucide-react-native/icons/grip-vertical";
import { motion } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const ROW_HEIGHT = 104;

type SortableItemProps = {
  readonly id: string;
  readonly index: number;
  readonly totalCount: number;
  readonly reduceMotion: boolean;
  readonly positions: SharedValue<Record<string, number>>;
  readonly activeId: SharedValue<string | null>;
  readonly onReorder: (id: string, targetIndex: number) => void;
  readonly children: ReactNode;
};

function SortableItem({
  id,
  index,
  totalCount,
  reduceMotion,
  positions,
  activeId,
  onReorder,
  children,
}: SortableItemProps) {
  const { colors } = useTheme();
  const dragY = useSharedValue(0);
  const originY = useSharedValue(0);
  const slotY = useSharedValue(index * ROW_HEIGHT);

  useAnimatedReaction(
    () => positions.value[id] ?? 0,
    (slot, prevSlot) => {
      if (prevSlot === null || slot === prevSlot) return;
      const targetTop = slot * ROW_HEIGHT;
      slotY.set(
        reduceMotion ? targetTop : withSpring(targetTop, motion.springs.snappy),
      );
    },
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      activeId.set(id);
      const currentSlot = positions.get()[id] ?? 0;
      const startTop = currentSlot * ROW_HEIGHT;
      originY.set(startTop);
      dragY.set(startTop);
    })
    .onUpdate((e) => {
      const currentMap = positions.get();
      const currentSlot = currentMap[id] ?? 0;
      const nextY = Math.max(
        0,
        Math.min((totalCount - 1) * ROW_HEIGHT, originY.get() + e.translationY),
      );
      dragY.set(nextY);

      const newSlot = Math.max(
        0,
        Math.min(totalCount - 1, Math.round(nextY / ROW_HEIGHT)),
      );

      if (newSlot !== currentSlot) {
        const nextMap: Record<string, number> = { ...currentMap };
        for (const key of Object.keys(nextMap)) {
          if (nextMap[key] === newSlot) {
            nextMap[key] = currentSlot;
            break;
          }
        }
        nextMap[id] = newSlot;
        positions.set(nextMap);
      }
    })
    .onEnd(() => {
      const finalSlot = positions.get()[id] ?? 0;
      slotY.set(finalSlot * ROW_HEIGHT);
      activeId.set(null);
      runOnJS(onReorder)(id, finalSlot);
    })
    .onFinalize(() => {
      activeId.set(null);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isDragging = activeId.value === id;
    return {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      transform: [{ translateY: isDragging ? dragY.value : slotY.value }],
      opacity: isDragging ? 0.96 : 1,
      zIndex: isDragging ? 100 : 1,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
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
  const initialMap: Record<string, number> = {};
  items.forEach((item, idx) => {
    initialMap[item.id] = idx;
  });

  const positions = useSharedValue<Record<string, number>>(initialMap);
  const activeId = useSharedValue<string | null>(null);

  useEffect(() => {
    const nextMap: Record<string, number> = {};
    items.forEach((item, idx) => {
      nextMap[item.id] = idx;
    });
    positions.set(nextMap);
  }, [items, positions]);

  return (
    <View
      style={{
        height: items.length * ROW_HEIGHT,
        position: "relative",
      }}
    >
      {items.map((item, idx) => (
        <SortableItem
          key={item.id}
          id={item.id}
          index={idx}
          totalCount={items.length}
          reduceMotion={reduceMotion}
          positions={positions}
          activeId={activeId}
          onReorder={onReorder}
        >
          {renderItem(item)}
        </SortableItem>
      ))}
    </View>
  );
}
