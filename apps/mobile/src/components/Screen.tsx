import type { ReactNode } from "react";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme/tokens";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  edges?: readonly Edge[];
};

export function Screen({
  children,
  className = "",
  padded = true,
  edges = ["top", "left", "right", "bottom"],
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: padded ? spacing.md + 4 : 0,
      }}
      className={className}
    >
      {children}
    </SafeAreaView>
  );
}
