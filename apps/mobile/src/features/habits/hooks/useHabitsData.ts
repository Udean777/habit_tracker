import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getDeviceLocalDate,
  type LocalDate,
  type Settings,
} from "@habit/shared";
import {
  listActiveHabits,
  listArchivedHabits,
  type HabitRecord,
} from "@/features/habits/repository";
import {
  countPendingOutbox,
  listAllActiveLogs,
  type HabitLogRecord,
} from "@/features/logs";
import { getSettings, useSettingsMutation } from "@/features/settings";
import { useUiStore } from "@/stores/uiStore";
import { useHabitMutations } from "./useHabitMutations";

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

export function useHabitsData() {
  const dataVersion = useUiStore((s) => s.dataVersion);
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);

  const [state, setState] = useState<HabitsDataState>({
    loading: true,
    error: null,
    activeHabits: [],
    archivedHabits: [],
    logs: [],
    settings: DEFAULT_SETTINGS,
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

  const mutations = useHabitMutations({
    activeHabits: state.activeHabits,
    settings: state.settings,
    effectiveToday: state.effectiveToday,
    onOptimisticReorder: (nextHabits) =>
      setState((prev) => ({ ...prev, activeHabits: nextHabits })),
  });

  const settingsMutation = useSettingsMutation(state.settings.hapticsEnabled);

  return {
    ...state,
    refresh: bumpDataVersion,
    ...mutations,
    ...settingsMutation,
  };
}
