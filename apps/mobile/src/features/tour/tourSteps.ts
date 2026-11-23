export type TourStepId =
  | "quest_hud"
  | "date_strip"
  | "first_quest"
  | "new_habit_btn"
  | "stats_heatmap"
  | "settings_hero";

export type TourRoute = "/(tabs)" | "/(tabs)/stats" | "/(tabs)/settings";

export type TourStep = {
  readonly id: TourStepId;
  readonly route: TourRoute;
  readonly title: string;
  readonly description: string;
  readonly spotlightRadius: number;
  readonly trimBottom?: number;
};

export const FEATURE_TOUR_STEPS: readonly TourStep[] = [
  {
    id: "quest_hud",
    route: "/(tabs)",
    title: "Hero HUD & Shop",
    description:
      "Track your 32x32 pixel hero, XP level, daily combo, Gold balance, and Streak Shields. Tap Hero Shop to unlock palettes, auras, and frames.",
    spotlightRadius: 16,
    trimBottom: 16,
  },
  {
    id: "date_strip",
    route: "/(tabs)",
    title: "Daily Calendar & Backfill",
    description:
      "Switch between today and recent days to review or backfill missed quests. Days where all quests are done show a golden dot.",
    spotlightRadius: 18,
    trimBottom: 12,
  },
  {
    id: "first_quest",
    route: "/(tabs)",
    title: "Interactive Quests",
    description:
      "Complete Check-off, Counter, or live Countdown Timer quests to earn +25 XP and +10G. Drag the right grip handle to reorder your list.",
    spotlightRadius: 16,
    trimBottom: 0,
  },
  {
    id: "new_habit_btn",
    route: "/(tabs)",
    title: "Create Custom Quests",
    description:
      "Add new daily, weekday, or times-per-week quests with custom icons, colors, and reminders.",
    spotlightRadius: 12,
    trimBottom: 0,
  },
  {
    id: "stats_heatmap",
    route: "/(tabs)/stats",
    title: "Consistency & Trophy Case",
    description:
      "Tap any day in the monthly heatmap to inspect completion rates, and unlock Trophy Case achievements for bonus Gold.",
    spotlightRadius: 16,
    trimBottom: 16,
  },
  {
    id: "settings_hero",
    route: "/(tabs)/settings",
    title: "Hero Class & Cloud Sync",
    description:
      "Switch between Knight, Mage, and Ranger anytime. Everything works offline first — sign in here whenever you want multi-device sync.",
    spotlightRadius: 16,
    trimBottom: 24,
  },
] as const;

export type SpotlightRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type TooltipPlacement = {
  readonly top: number;
  readonly position: "above" | "below" | "center";
};

const TOOLTIP_GAP = 16;
const ESTIMATED_TOOLTIP_HEIGHT = 210;

export function computeTooltipPlacement(
  target: SpotlightRect | null,
  screenHeight: number,
  topInset: number,
  bottomInset: number,
): TooltipPlacement {
  if (!target || target.width <= 0 || target.height <= 0) {
    return {
      top: Math.max(topInset + 24, (screenHeight - ESTIMATED_TOOLTIP_HEIGHT) / 2),
      position: "center",
    };
  }

  const spaceBelow =
    screenHeight - bottomInset - (target.y + target.height + TOOLTIP_GAP);
  if (spaceBelow >= ESTIMATED_TOOLTIP_HEIGHT) {
    return {
      top: target.y + target.height + TOOLTIP_GAP,
      position: "below",
    };
  }

  const aboveTop = Math.max(
    topInset + 16,
    target.y - TOOLTIP_GAP - ESTIMATED_TOOLTIP_HEIGHT,
  );
  return {
    top: aboveTop,
    position: "above",
  };
}
