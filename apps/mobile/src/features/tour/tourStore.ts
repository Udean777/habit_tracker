import type { RefObject } from "react";
import type { View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { FEATURE_TOUR_STEPS, type TourStepId } from "./tourSteps";

const TOUR_COMPLETED_KEY = "glimkin_feature_tour_completed_v1";

const targetRegistry = new Map<TourStepId, RefObject<View | null>>();

export function registerTourTarget(
  id: TourStepId,
  ref: RefObject<View | null>,
): void {
  targetRegistry.set(id, ref);
}

export function unregisterTourTarget(id: TourStepId): void {
  targetRegistry.delete(id);
}

export function getTourTargetRef(
  id: TourStepId,
): RefObject<View | null> | undefined {
  return targetRegistry.get(id);
}

export async function hasCompletedTour(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(TOUR_COMPLETED_KEY);
    return val === "1";
  } catch {
    return false;
  }
}

export async function markTourCompleted(): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOUR_COMPLETED_KEY, "1");
  } catch {
    // Ignore secure store errors in unsupported/test environments
  }
}

type TourState = {
  readonly isOpen: boolean;
  readonly stepIndex: number;
  readonly startTour: (startIndex?: number) => void;
  readonly nextStep: () => void;
  readonly prevStep: () => void;
  readonly closeTour: () => void;
};

export const useTourStore = create<TourState>((set) => ({
  isOpen: false,
  stepIndex: 0,
  startTour: (startIndex = 0) => {
    const clamped = Math.max(
      0,
      Math.min(FEATURE_TOUR_STEPS.length - 1, startIndex),
    );
    set({ isOpen: true, stepIndex: clamped });
  },
  nextStep: () =>
    set((state) => {
      if (state.stepIndex >= FEATURE_TOUR_STEPS.length - 1) {
        void markTourCompleted();
        return { isOpen: false, stepIndex: 0 };
      }
      return { stepIndex: state.stepIndex + 1 };
    }),
  prevStep: () =>
    set((state) => ({
      stepIndex: Math.max(0, state.stepIndex - 1),
    })),
  closeTour: () => {
    void markTourCompleted();
    set({ isOpen: false, stepIndex: 0 });
  },
}));
