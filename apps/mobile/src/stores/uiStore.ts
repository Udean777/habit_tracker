import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { getDeviceLocalDate, type LocalDate, type ThemeMode } from "@habit/shared";
import type { AvatarClass } from "@/features/habits/avatarMapper";

const AVATAR_CLASS_STORAGE_KEY = "habit_avatar_class";

type UiState = {
  readonly selectedDate: LocalDate;
  readonly dataVersion: number;
  readonly avatarClass: AvatarClass;
  readonly themeMode: ThemeMode;
  readonly setSelectedDate: (date: LocalDate) => void;
  readonly bumpDataVersion: () => void;
  readonly setAvatarClass: (avatarClass: AvatarClass) => void;
  readonly setThemeMode: (themeMode: ThemeMode) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedDate: getDeviceLocalDate(),
  dataVersion: 0,
  avatarClass: "knight",
  themeMode: "system",
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  bumpDataVersion: () =>
    set((state) => ({ dataVersion: state.dataVersion + 1 })),
  setAvatarClass: (avatarClass) => {
    set({ avatarClass });
    void SecureStore.setItemAsync(AVATAR_CLASS_STORAGE_KEY, avatarClass).catch(
      () => {},
    );
  },
  setThemeMode: (themeMode) => set({ themeMode }),
}));

export async function hydrateAvatarClass(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(AVATAR_CLASS_STORAGE_KEY);
    if (saved === "knight" || saved === "mage" || saved === "ranger") {
      useUiStore.setState({ avatarClass: saved });
    }
  } catch {
    // Ignore secure store errors in test/unsupported environments
  }
}
