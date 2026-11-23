import { useColorScheme } from "react-native";
import { useUiStore } from "@/stores/uiStore";
import { darkColors, lightColors, type ThemeColors } from "./tokens";

export function useTheme(): {
  readonly isDark: boolean;
  readonly colors: ThemeColors;
} {
  const themeMode = useUiStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemScheme === "dark");

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}
