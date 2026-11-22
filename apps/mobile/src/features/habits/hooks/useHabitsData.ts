import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  getDeviceLocalDate,
  type CreateHabitInput,
  type LocalDate,
  type Settings,
  type UpdateHabitInput,
} from "@habit/shared";
import {
  archiveHabit,
  createHabit,
  listActiveHabits,
  listArchivedHabits,
  reorderHabits,
  softDeleteHabit,
  unarchiveHabit,
  updateHabit,
  type HabitRecord,
} from "@/features/habits/repository";
import {
  countPendingOutbox,
  listAllActiveLogs,
  upsertHabitLog,
  type HabitLogRecord,
} from "@/features/logs";
import { getSettings, updateSettings } from "@/features/settings";
import { reconcileNotifications } from "@/lib/notifications";
import { useUiStore } from "@/stores/uiStore";

type HabitsDataState = {
  readonly loading: boolean;
  readonly error: string | null;
  readonly activeHabits: readonly HabitRecord[];
  readonly archivedHabits: readonly HabitRecord[];
  readonly logs: readonly HabitLogRecord[];
  readonly settings: Settings;
  readonly pendingOutbox: number;
  readonly effectiveToday: LocalDate;
};

const INITIAL_SETTINGS: Settings = {
  theme: "system",
  hapticsEnabled: true,
  reduceMotion: "system",
  qualityTier: "auto",
  dayStartOffsetMin: 0,
  backfillWindowDays: 14,
};

export function useHabitsData() {
  const dataVersion = useUiStore((s) => s.dataVersion);
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  const [state, setState] = useState<HabitsDataState>({
    loading: true,
    error: null,
    activeHabits: [],
    archivedHabits: [],
    logs: [],
    settings: INITIAL_SETTINGS,
    pendingOutbox: 0,
    effectiveToday: getDeviceLocalDate(),
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [
          activeHabits,
          archivedHabits,
          logs,
          loadedSettings,
          pendingOutbox,
        ] = await Promise.all([
          listActiveHabits(),
          listArchivedHabits(),
          listAllActiveLogs(),
          getSettings(),
          countPendingOutbox(),
        ]);

        if (cancelled) return;
        const effectiveToday = getDeviceLocalDate(
          new Date(),
          loadedSettings.dayStartOffsetMin,
        );

        setState({
          loading: false,
          error: null,
          activeHabits,
          archivedHabits,
          logs,
          settings: loadedSettings,
          pendingOutbox,
          effectiveToday,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error ? err.message : "Failed to load habit data",
        }));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  async function maybeHaptic(kind: "light" | "success") {
    if (!state.settings.hapticsEnabled) return;
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
      today: state.effectiveToday,
      backfillWindowDays: state.settings.backfillWindowDays,
    });
    await maybeHaptic(value > 0 ? "success" : "light");
    bumpDataVersion();
  }

  async function onMoveHabit(habitId: string, direction: "up" | "down") {
    const ids = state.activeHabits.map((h) => h.id);
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

  async function onUpdateSettings(patch: Partial<Settings>) {
    const updated = await updateSettings(patch);
    if (patch.dayStartOffsetMin !== undefined) {
      setSelectedDate(
        getDeviceLocalDate(new Date(), updated.dayStartOffsetMin),
      );
    }
    await maybeHaptic("light");
    bumpDataVersion();
  }

  return {
    ...state,
    refresh: bumpDataVersion,
    onCreateHabit,
    onUpdateHabit,
    onLogValue,
    onMoveHabit,
    onArchiveHabit,
    onUnarchiveHabit,
    onDeleteHabit,
    onUpdateSettings,
  };
}
