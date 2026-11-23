import {
  mapQuestProgressToAvatar,
  type AvatarClass,
} from "./avatarMapper";

const ALL_CLASSES: readonly AvatarClass[] = ["knight", "mage", "ranger"];

describe("avatarMapper", () => {
  it("maps quest progress and class to evolving 32x32 human pixel avatar states", () => {
    const noviceKnight = mapQuestProgressToAvatar(
      {
        level: 1,
        totalXp: 0,
        xpIntoLevel: 0,
        xpForNextLevel: 100,
        completedToday: 0,
        scheduledToday: 2,
        comboMultiplier: 1,
      },
      "knight",
    );
    expect(noviceKnight.gridSize).toBe(32);
    expect(noviceKnight.gearTier).toBe("novice");
    expect(noviceKnight.classTitle).toBe("Squire");
    expect(noviceKnight.mood).toBe("idle");
    expect(noviceKnight.primaryFrame).toHaveLength(32);
    expect(noviceKnight.actionFrames.length).toBeGreaterThan(0);

    const championMage = mapQuestProgressToAvatar(
      {
        level: 6,
        totalXp: 1600,
        xpIntoLevel: 100,
        xpForNextLevel: 600,
        completedToday: 3,
        scheduledToday: 3,
        comboMultiplier: 3,
      },
      "mage",
    );
    expect(championMage.gearTier).toBe("champion");
    expect(championMage.classTitle).toBe("Grand Archmage");
    expect(championMage.mood).toBe("victory");
    expect(championMage.sparkleCount).toBeGreaterThan(0);

    const legendWithCosmetics = mapQuestProgressToAvatar(
      {
        level: 20,
        totalXp: 25000,
        xpIntoLevel: 0,
        xpForNextLevel: 2000,
        completedToday: 0,
        scheduledToday: 2,
        comboMultiplier: 1,
      },
      "knight",
      {
        avatarClass: "ranger",
        equippedPaletteId: "palette_crimson",
        equippedAuraId: "aura_crown",
        equippedFrameId: "frame_gold",
      },
    );
    expect(legendWithCosmetics.gearTier).toBe("legend");
    expect(legendWithCosmetics.classTitle).toBe("Mythic Pathfinder");
    expect(legendWithCosmetics.palette.A).toBe("#E11D48");
    expect(legendWithCosmetics.auraRingColor).not.toBeNull();
    expect(legendWithCosmetics.frameBorderColor).toBe("#F59E0B");
    expect(legendWithCosmetics.sparkleCount).toBe(4);
  });

  it("ensures every idle and action frame across all classes is strictly 32x32 with valid palette keys", () => {
    for (const cls of ALL_CLASSES) {
      const state = mapQuestProgressToAvatar(
        {
          level: 5,
          totalXp: 1000,
          xpIntoLevel: 0,
          xpForNextLevel: 500,
          completedToday: 1,
          scheduledToday: 2,
          comboMultiplier: 1,
        },
        cls,
      );

      const allFrames = [...state.frames, ...state.actionFrames];
      for (const frame of allFrames) {
        expect(frame).toHaveLength(32);
        for (const row of frame) {
          expect(row).toHaveLength(32);
          for (const ch of row) {
            if (ch !== ".") {
              expect(state.palette[ch]).toBeDefined();
            }
          }
        }
      }
    }
  });
});
