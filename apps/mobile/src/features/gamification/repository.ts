import { eq, isNull } from "drizzle-orm";
import {
  avatarClassSchema,
  DEFAULT_HERO_LOADOUT,
  getShopItemById,
  shopItemCategorySchema,
  type AvatarClass,
  type HeroLoadout,
  type InventoryItemInput,
  type LocalDate,
  type ShopItemCategory,
  type StreakFreezeInput,
} from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import { heroProfile, streakFreezes, userInventory } from "@/db/schema";
import { createId } from "@/lib/id";
import { enqueueOutbox } from "@/sync/outbox";

export type InventoryRecord = InventoryItemInput & {
  readonly purchasedAt: string;
};

export type StreakFreezeRecord = StreakFreezeInput & {
  readonly id: string;
  readonly source: "earned" | "manual";
};

function parseAvatarClass(value: string): AvatarClass {
  const parsed = avatarClassSchema.safeParse(value);
  return parsed.success ? parsed.data : "knight";
}

function parseCategory(value: string): ShopItemCategory {
  const parsed = shopItemCategorySchema.safeParse(value);
  return parsed.success ? parsed.data : "palette";
}

export async function getHeroProfile(
  db: AppDb = appDb,
): Promise<HeroLoadout> {
  const rows = await db
    .select()
    .from(heroProfile)
    .where(eq(heroProfile.id, "singleton"));
  const row = rows[0];
  if (!row) return DEFAULT_HERO_LOADOUT;
  return {
    avatarClass: parseAvatarClass(row.avatarClass),
    equippedPaletteId: row.equippedPaletteId,
    equippedAuraId: row.equippedAuraId,
    equippedFrameId: row.equippedFrameId,
  };
}

export async function updateHeroProfile(
  patch: Partial<HeroLoadout>,
  db: AppDb = appDb,
): Promise<HeroLoadout> {
  const nowIso = new Date().toISOString();
  return db.transaction(async (tx) => {
    const existingRows = await tx
      .select()
      .from(heroProfile)
      .where(eq(heroProfile.id, "singleton"));
    const current = existingRows[0];

    const nextRow = {
      id: "singleton",
      avatarClass: patch.avatarClass ?? current?.avatarClass ?? "knight",
      equippedPaletteId:
        patch.equippedPaletteId !== undefined
          ? patch.equippedPaletteId
          : (current?.equippedPaletteId ?? null),
      equippedAuraId:
        patch.equippedAuraId !== undefined
          ? patch.equippedAuraId
          : (current?.equippedAuraId ?? null),
      equippedFrameId:
        patch.equippedFrameId !== undefined
          ? patch.equippedFrameId
          : (current?.equippedFrameId ?? null),
      updatedAt: nowIso,
    };

    await tx
      .insert(heroProfile)
      .values(nextRow)
      .onConflictDoUpdate({
        target: heroProfile.id,
        set: nextRow,
      });

    await enqueueOutbox(tx, {
      entity: "hero_profile",
      entityId: "singleton",
      op: "upsert",
      payload: nextRow,
      nowIso,
    });

    return {
      avatarClass: parseAvatarClass(nextRow.avatarClass),
      equippedPaletteId: nextRow.equippedPaletteId,
      equippedAuraId: nextRow.equippedAuraId,
      equippedFrameId: nextRow.equippedFrameId,
    };
  });
}

export async function listActiveInventory(
  db: AppDb = appDb,
): Promise<readonly InventoryRecord[]> {
  const rows = await db
    .select()
    .from(userInventory)
    .where(isNull(userInventory.deletedAt));

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    category: parseCategory(r.category),
    costGold: r.costGold,
    purchasedAt: r.purchasedAt,
    deletedAt: r.deletedAt,
  }));
}

export type PurchaseResult =
  | { readonly ok: true; readonly record: InventoryRecord }
  | { readonly ok: false; readonly reason: "unknown_item" | "already_owned" | "insufficient_gold" };

export async function purchaseShopItem(
  itemId: string,
  availableGold: number,
  db: AppDb = appDb,
): Promise<PurchaseResult> {
  const item = getShopItemById(itemId);
  if (!item) return { ok: false, reason: "unknown_item" };
  if (availableGold < item.costGold) {
    return { ok: false, reason: "insufficient_gold" };
  }

  const nowIso = new Date().toISOString();
  return db.transaction(async (tx) => {
    if (item.category !== "consumable") {
      const owned = await tx
        .select({ id: userInventory.id, itemId: userInventory.itemId })
        .from(userInventory)
        .where(isNull(userInventory.deletedAt));
      if (owned.some((r) => r.itemId === item.id)) {
        return { ok: false, reason: "already_owned" };
      }
    }

    const row = {
      id: createId(),
      itemId: item.id,
      category: item.category,
      costGold: item.costGold,
      purchasedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await tx.insert(userInventory).values(row);
    await enqueueOutbox(tx, {
      entity: "user_inventory",
      entityId: row.id,
      op: "upsert",
      payload: row,
      nowIso,
    });

    return {
      ok: true,
      record: {
        id: row.id,
        itemId: row.itemId,
        category: item.category,
        costGold: row.costGold,
        purchasedAt: row.purchasedAt,
        deletedAt: null,
      },
    };
  });
}

export async function listActiveStreakFreezes(
  db: AppDb = appDb,
): Promise<readonly StreakFreezeRecord[]> {
  const rows = await db
    .select()
    .from(streakFreezes)
    .where(isNull(streakFreezes.deletedAt));

  return rows.map((r) => ({
    id: r.id,
    habitId: r.habitId,
    freezeDate: r.freezeDate,
    source: r.source === "earned" ? "earned" : "manual",
    deletedAt: r.deletedAt,
  }));
}

export async function applyStreakFreeze(
  habitId: string,
  freezeDate: LocalDate,
  source: "earned" | "manual" = "manual",
  db: AppDb = appDb,
): Promise<StreakFreezeRecord> {
  const nowIso = new Date().toISOString();
  return db.transaction(async (tx) => {
    const row = {
      id: createId(),
      habitId,
      freezeDate,
      source,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await tx
      .insert(streakFreezes)
      .values(row)
      .onConflictDoNothing({
        target: [streakFreezes.habitId, streakFreezes.freezeDate],
      });

    await enqueueOutbox(tx, {
      entity: "streak_freeze",
      entityId: row.id,
      op: "upsert",
      payload: row,
      nowIso,
    });

    return {
      id: row.id,
      habitId,
      freezeDate,
      source,
      deletedAt: null,
    };
  });
}
