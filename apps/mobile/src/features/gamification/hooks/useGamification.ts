import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeAvailableShields,
  computeGoldEconomy,
  DEFAULT_HERO_LOADOUT,
  evaluateAchievements,
  findShieldableMisses,
  toHabitSchedule,
  type AvatarClass,
  type GamificationHabitInput,
  type HeroLoadout,
  type LocalDate,
  type ShopItemCategory,
} from "@habit/shared";
import type { HabitRecord } from "@/features/habits/repository";
import type { HabitLogRecord } from "@/features/logs";
import { triggerHaptic } from "@/lib/haptics";
import { useUiStore } from "@/stores/uiStore";
import { runSyncCycle } from "@/sync/syncEngine";
import {
  applyStreakFreeze,
  getHeroProfile,
  listActiveInventory,
  listActiveStreakFreezes,
  purchaseShopItem,
  updateHeroProfile,
  type InventoryRecord,
  type PurchaseResult,
  type StreakFreezeRecord,
} from "../repository";

type GamificationDbState = {
  readonly loading: boolean;
  readonly heroProfile: HeroLoadout;
  readonly inventory: readonly InventoryRecord[];
  readonly freezes: readonly StreakFreezeRecord[];
};

export function useGamification(
  habits: readonly HabitRecord[],
  logs: readonly HabitLogRecord[],
  effectiveToday: LocalDate,
  hapticsEnabled: boolean,
) {
  const dataVersion = useUiStore((s) => s.dataVersion);
  const bumpDataVersion = useUiStore((s) => s.bumpDataVersion);
  const setAvatarClassUi = useUiStore((s) => s.setAvatarClass);

  const [dbState, setDbState] = useState<GamificationDbState>({
    loading: true,
    heroProfile: DEFAULT_HERO_LOADOUT,
    inventory: [],
    freezes: [],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profile, inventory, freezes] = await Promise.all([
          getHeroProfile(),
          listActiveInventory(),
          listActiveStreakFreezes(),
        ]);
        if (cancelled) return;
        setDbState({
          loading: false,
          heroProfile: profile,
          inventory,
          freezes,
        });
        setAvatarClassUi(profile.avatarClass);
      } catch (err) {
        console.warn("Failed to load gamification data:", err);
        if (!cancelled) {
          setDbState((prev) => ({ ...prev, loading: false }));
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dataVersion, setAvatarClassUi]);

  const habitInputs: readonly GamificationHabitInput[] = useMemo(
    () =>
      habits.map((h) => ({
        id: h.id,
        icon: h.icon,
        type: h.type,
        targetValue: h.targetValue,
        schedule: toHabitSchedule(h),
        startDate: h.startDate,
      })),
    [habits],
  );

  const goldEconomy = useMemo(
    () => computeGoldEconomy(habitInputs, logs, dbState.inventory),
    [habitInputs, logs, dbState.inventory],
  );

  const shieldStats = useMemo(
    () =>
      computeAvailableShields(
        habitInputs,
        logs,
        dbState.inventory,
        dbState.freezes,
        effectiveToday,
      ),
    [habitInputs, logs, dbState.inventory, dbState.freezes, effectiveToday],
  );

  const shieldableMisses = useMemo(
    () =>
      findShieldableMisses(habitInputs, logs, dbState.freezes, effectiveToday),
    [habitInputs, logs, dbState.freezes, effectiveToday],
  );

  const achievements = useMemo(
    () =>
      evaluateAchievements(
        habitInputs,
        logs,
        dbState.inventory,
        dbState.freezes,
        effectiveToday,
      ),
    [habitInputs, logs, dbState.inventory, dbState.freezes, effectiveToday],
  );

  const ownedItemIds = useMemo(
    () =>
      new Set(
        dbState.inventory
          .filter((i) => !i.deletedAt && i.category !== "consumable")
          .map((i) => i.itemId),
      ),
    [dbState.inventory],
  );

  const freezesByHabitId = useMemo(() => {
    const map = new Map<string, LocalDate[]>();
    for (const f of dbState.freezes) {
      if (f.deletedAt) continue;
      const list = map.get(f.habitId) ?? [];
      list.push(f.freezeDate);
      map.set(f.habitId, list);
    }
    return map;
  }, [dbState.freezes]);

  const selectAvatarClass = useCallback(
    async (avatarClass: AvatarClass) => {
      triggerHaptic("selection", hapticsEnabled);
      setAvatarClassUi(avatarClass);
      const updated = await updateHeroProfile({ avatarClass });
      setDbState((prev) => ({ ...prev, heroProfile: updated }));
      bumpDataVersion();
      void runSyncCycle();
    },
    [hapticsEnabled, setAvatarClassUi, bumpDataVersion],
  );

  const equipCosmetic = useCallback(
    async (category: Exclude<ShopItemCategory, "consumable">, itemId: string | null) => {
      triggerHaptic("selection", hapticsEnabled);
      const patch: Partial<HeroLoadout> =
        category === "palette"
          ? { equippedPaletteId: itemId }
          : category === "aura"
            ? { equippedAuraId: itemId }
            : { equippedFrameId: itemId };
      const updated = await updateHeroProfile(patch);
      setDbState((prev) => ({ ...prev, heroProfile: updated }));
      bumpDataVersion();
      void runSyncCycle();
    },
    [hapticsEnabled, bumpDataVersion],
  );

  const buyItem = useCallback(
    async (itemId: string): Promise<PurchaseResult> => {
      const result = await purchaseShopItem(itemId, goldEconomy.availableGold);
      if (result.ok) {
        triggerHaptic("success", hapticsEnabled);
        bumpDataVersion();
        void runSyncCycle();
      } else {
        triggerHaptic("light", hapticsEnabled);
      }
      return result;
    },
    [goldEconomy.availableGold, hapticsEnabled, bumpDataVersion],
  );

  const activateShieldOnMiss = useCallback(
    async (habitId: string, missedDate: LocalDate) => {
      if (shieldStats.availableShields <= 0) return;
      triggerHaptic("success", hapticsEnabled);
      await applyStreakFreeze(habitId, missedDate, "manual");
      bumpDataVersion();
      void runSyncCycle();
    },
    [shieldStats.availableShields, hapticsEnabled, bumpDataVersion],
  );

  return {
    loading: dbState.loading,
    heroProfile: dbState.heroProfile,
    inventory: dbState.inventory,
    freezes: dbState.freezes,
    freezesByHabitId,
    goldEconomy,
    shieldStats,
    shieldableMisses,
    achievements,
    ownedItemIds,
    selectAvatarClass,
    equipCosmetic,
    buyItem,
    activateShieldOnMiss,
  };
}
