import * as Haptics from "expo-haptics";
import type {
  CreateHabitInput,
  LocalDate,
  Settings,
  UpdateHabitInput,
} from "@habit/shared";
import {
  archiveHabit,
  createHabit,
  listActiveHabits,
  reorderHabits,
  softDeleteHabit,
  unarchiveHabit,
  updateHabit,
  type HabitRecord,
} from "@/features/habits/repository";
import { upsertHabitLog } from "@/features/logs";
import { reconcileNotifications } from "@/lib/notifications";
import { useUiStore } from "@/stores/uiStore";

type MutationParams = {
  readonly activeHabits: readonly HabitRecord[];
  readonly settings: Settings;
  readonly effectiveToday: LocalDate;
  readonly onOptimisticReorder: (nextHabits: readonly HabitRecord[]) => void;
};

export function useHabitMutations({
  activeHabits,
  settings,
  effectiveToday,
  onOptimisticReorder,
}: MutationParams) {
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);

  async function maybeHaptic(kind: "light" | "success") {
    if (!settings.hapticsEnabled) return;
    if (kind === "light") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function syncNotifications() {
    const active = await listActiveHabits();
    await reconcileNotifications(active);
  }

  async function onCreateHabit(input: CreateHabitInput) {
    await createHabit(input);
    await syncNotifications();
    await maybeHaptic("success");
    bumpDataVersion();
  }

  async function onUpdateHabit(id: string, input: UpdateHabitInput) {
    await updateHabit(id, input);
    await syncNotifications();
    await maybeHaptic("light");
    bumpDataVersion();
  }

  async function onLogValue(habitId: string, logDate: LocalDate, value: number) {
    await upsertHabitLog({
      habitId,
      logDate,
      value,
      today: effectiveToday,
      backfillWindowDays: settings.backfillWindowDays,
    });
    await maybeHaptic(value > 0 ? "success" : "light");
    bumpDataVersion();
  }

  async function onMoveHabit(habitId: string, direction: "up" | "down") {
    const ids = activeHabits.map((h) => h.id);
    const idx = ids.indexOf(habitId);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || targetIdx < 0 || targetIdx >= ids.length) return;

    const current = ids[idx];
    const target = ids[targetIdx];
    if (!current || !target) return;

    const reordered = [...ids];
    reordered[idx] = target;
    reordered[targetIdx] = current;

    await reorderHabits(reordered);
    await maybeHaptic("light");
    bumpDataVersion();
  }

  async function onReorderHabit(habitId: string, targetIndex: number) {
    const ids = activeHabits.map((h) => h.id);
    const idx = ids.indexOf(habitId);
    if (
      idx < 0 ||
      targetIndex < 0 ||
      targetIndex >= ids.length ||
      idx === targetIndex
    ) {
      return;
    }
    const nextHabits = [...activeHabits];
    const [movedHabit] = nextHabits.splice(idx, 1);
    if (!movedHabit) return;
    nextHabits.splice(targetIndex, 0, movedHabit);

    // Update UI order synchronously so the list doesn't flash back before SQLite finishes.
    onOptimisticReorder(nextHabits);
    await reorderHabits(nextHabits.map((h) => h.id));
    await maybeHaptic("light");
  }

  async function onArchiveHabit(id: string) {
    await archiveHabit(id);
    await syncNotifications();
    await maybeHaptic("light");
    bumpDataVersion();
  }

  async function onUnarchiveHabit(id: string) {
    await unarchiveHabit(id);
    await syncNotifications();
    await maybeHaptic("light");
    bumpDataVersion();
  }

  async function onDeleteHabit(id: string) {
    await softDeleteHabit(id);
    await syncNotifications();
    await maybeHaptic("light");
    bumpDataVersion();
  }

  return {
    onCreateHabit,
    onUpdateHabit,
    onLogValue,
    onMoveHabit,
    onReorderHabit,
    onArchiveHabit,
    onUnarchiveHabit,
    onDeleteHabit,
  };
}
