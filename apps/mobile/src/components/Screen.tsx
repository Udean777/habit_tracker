import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  className?: string;
};

export function Screen({ children, className = "" }: ScreenProps) {
  return (
    <SafeAreaView className={`flex-1 bg-white ${className}`}>
      {children}
    </SafeAreaView>
  );
}
