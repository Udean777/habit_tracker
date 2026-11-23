import * as Haptics from "expo-haptics";
import { getDeviceLocalDate, type Settings } from "@habit/shared";
import { useUiStore } from "@/stores/uiStore";
import { updateSettings } from "../repository";

export function useSettingsMutation(hapticsEnabled: boolean) {
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  async function onUpdateSettings(patch: Partial<Settings>) {
    const updated = await updateSettings(patch);
    if (patch.dayStartOffsetMin !== undefined) {
      setSelectedDate(
        getDeviceLocalDate(new Date(), updated.dayStartOffsetMin),
      );
    }
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    bumpDataVersion();
  }

  return { onUpdateSettings };
}
