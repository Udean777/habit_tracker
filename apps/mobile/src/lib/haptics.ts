import * as Haptics from "expo-haptics";

export type HapticKind = "light" | "medium" | "heavy" | "selection" | "success";

export function triggerHaptic(kind: HapticKind, enabled = true): void {
  if (!enabled) return;

  const task =
    kind === "light"
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === "medium"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : kind === "heavy"
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          : kind === "selection"
            ? Haptics.selectionAsync()
            : Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );

  void task.catch(() => {});
}
