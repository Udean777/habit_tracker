import { create } from "zustand";
import { getDeviceLocalDate, type LocalDate } from "@habit/shared";

type UiState = {
  readonly selectedDate: LocalDate;
  readonly dataVersion: number;
  readonly setSelectedDate: (date: LocalDate) => void;
  readonly bumpDataVersion: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedDate: getDeviceLocalDate(),
  dataVersion: 0,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  bumpDataVersion: () =>
    set((state) => ({ dataVersion: state.dataVersion + 1 })),
}));
