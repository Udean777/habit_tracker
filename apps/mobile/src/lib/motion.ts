import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import * as Device from "expo-device";
import type { QualityTierMode, Settings } from "@habit/shared";

export type QualityTier = "high" | "medium" | "low";

const GB = 1024 * 1024 * 1024;

export function resolveQualityTier(mode: QualityTierMode): QualityTier {
  if (mode !== "auto") {
    return mode;
  }
  const totalMemory = Device.totalMemory;
  if (typeof totalMemory === "number") {
    if (totalMemory >= 7.5 * GB) return "high";
    if (totalMemory >= 3.5 * GB) return "medium";
    return "low";
  }
  return "medium";
}

export function useMotionPreferences(settings: Settings): {
  readonly tier: QualityTier;
  readonly reduceMotion: boolean;
} {
  const [osReduceMotion, setOsReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setOsReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setOsReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const reduceMotion =
    settings.reduceMotion === "on"
      ? true
      : settings.reduceMotion === "off"
        ? false
        : osReduceMotion;

  const tier = resolveQualityTier(settings.qualityTier);

  return { tier, reduceMotion };
}
