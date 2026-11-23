import { mapQuestProgressToAvatar } from "./avatarMapper";

describe("avatarMapper", () => {
  it("maps quest progress and class to evolving 16x16 pixel avatar states", () => {
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
    expect(noviceKnight.gearTier).toBe("novice");
    expect(noviceKnight.classTitle).toBe("Squire");
    expect(noviceKnight.mood).toBe("idle");
    expect(noviceKnight.primaryFrame).toHaveLength(16);
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
  });
});
