import { getDeviceLocalDate, type Settings } from "@habit/shared";
import { triggerHaptic } from "@/lib/haptics";
import { useUiStore } from "@/stores/uiStore";
import { updateSettings } from "../repository";

export function useSettingsMutation(hapticsEnabled: boolean) {
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  async function onUpdateSettings(patch: Partial<Settings>) {
    const updated = await updateSettings(patch);
    if (patch.theme !== undefined) {
      useUiStore.getState().setThemeMode(updated.theme);
    }
    if (patch.dayStartOffsetMin !== undefined) {
      setSelectedDate(
        getDeviceLocalDate(new Date(), updated.dayStartOffsetMin),
      );
    }
    triggerHaptic("light", hapticsEnabled);
    bumpDataVersion();
  }

  return { onUpdateSettings };
}
