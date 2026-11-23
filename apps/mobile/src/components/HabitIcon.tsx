import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react-native";
import Activity from "lucide-react-native/icons/activity";
import BookOpen from "lucide-react-native/icons/book-open";
import CheckCircle2 from "lucide-react-native/icons/check-circle-2";
import Code2 from "lucide-react-native/icons/code-2";
import Droplets from "lucide-react-native/icons/droplets";
import Flame from "lucide-react-native/icons/flame";
import Leaf from "lucide-react-native/icons/leaf";
import Moon from "lucide-react-native/icons/moon";
import type { HabitIconKey } from "@habit/shared";
import { useTheme } from "@/theme/useTheme";

const ICON_MAP: Record<HabitIconKey, ComponentType<LucideProps>> = {
  check: CheckCircle2,
  book: BookOpen,
  water: Droplets,
  run: Activity,
  code: Code2,
  moon: Moon,
  leaf: Leaf,
  flame: Flame,
};

type HabitIconProps = {
  readonly icon: HabitIconKey;
  readonly size?: number;
  readonly color?: string;
};

export function HabitIcon({
  icon,
  size = 18,
  color,
}: HabitIconProps) {
  const { colors } = useTheme();
  const IconComponent = ICON_MAP[icon] ?? CheckCircle2;
  return (
    <IconComponent
      size={size}
      color={color ?? colors.textPrimary}
      strokeWidth={2.25}
    />
  );
}
