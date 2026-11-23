import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Coins from "lucide-react-native/icons/coins";
import Shield from "lucide-react-native/icons/shield";
import {
  GOLD_ALL_DONE_BONUS,
  GOLD_PER_COMPLETION,
  GOLD_PER_LEVEL_UP,
  SHOP_CATALOG,
  type ShopItem,
  type ShopItemCategory,
} from "@habit/shared";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { SelectableChip } from "@/components/SelectableChip";
import { Text } from "@/components/Text";
import { useGamification } from "@/features/gamification";
import {
  computeQuestProgress,
  mapQuestProgressToAvatar,
  PixelAvatar,
  useHabitsData,
} from "@/features/habits";
import { useMotionPreferences } from "@/lib/motion";
import { radii } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

const CATEGORIES: readonly {
  readonly label: string;
  readonly value: ShopItemCategory;
}[] = [
  { label: "Palettes", value: "palette" },
  { label: "Auras", value: "aura" },
  { label: "Frames", value: "frame" },
  { label: "Shields", value: "consumable" },
];

export default function HeroShopScreen() {
  const { colors } = useTheme();
  const { activeHabits, logs, settings, effectiveToday } = useHabitsData();
  const motionPrefs = useMotionPreferences(settings);
  const {
    heroProfile,
    goldEconomy,
    shieldStats,
    ownedItemIds,
    buyItem,
    equipCosmetic,
  } = useGamification(
    activeHabits,
    logs,
    effectiveToday,
    settings.hapticsEnabled,
  );

  const [activeCategory, setActiveCategory] =
    useState<ShopItemCategory>("palette");
  const [showEarnGuide, setShowEarnGuide] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const questProgress = useMemo(
    () => computeQuestProgress(activeHabits, logs, effectiveToday),
    [activeHabits, logs, effectiveToday],
  );
  const avatarState = useMemo(
    () =>
      mapQuestProgressToAvatar(
        questProgress,
        heroProfile.avatarClass,
        heroProfile,
      ),
    [questProgress, heroProfile],
  );

  const items = useMemo(
    () => SHOP_CATALOG.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  function isEquipped(item: ShopItem): boolean {
    if (item.category === "palette") {
      return heroProfile.equippedPaletteId === item.id;
    }
    if (item.category === "aura") {
      return heroProfile.equippedAuraId === item.id;
    }
    if (item.category === "frame") {
      return heroProfile.equippedFrameId === item.id;
    }
    return false;
  }

  async function handleAction(item: ShopItem) {
    setFeedback(null);
    if (item.category === "consumable") {
      const res = await buyItem(item.id);
      setFeedback(
        res.ok
          ? `Purchased ${item.name}!`
          : "Not enough Gold yet. Complete more quests!",
      );
      return;
    }

    const owned = ownedItemIds.has(item.id);
    if (owned) {
      const currentlyEquipped = isEquipped(item);
      await equipCosmetic(item.category, currentlyEquipped ? null : item.id);
      setFeedback(
        currentlyEquipped
          ? `Unequipped ${item.name}.`
          : `Equipped ${item.name}!`,
      );
      return;
    }

    const res = await buyItem(item.id);
    if (res.ok) {
      await equipCosmetic(item.category, item.id);
      setFeedback(`Unlocked & equipped ${item.name}!`);
    } else if (res.reason === "insufficient_gold") {
      setFeedback("Not enough Gold yet. Complete more quests!");
    }
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]} className="pt-2">
      <View className="flex-row items-center justify-between pb-3">
        <View>
          <Text variant="title">Hero Shop</Text>
          <Text variant="caption">Spend Gold on gear & shields</Text>
        </View>
        <Button label="Done" variant="secondary" onPress={() => router.back()} />
      </View>

      <Card variant="primary" className="mb-4 p-4">
        <View className="flex-row items-center gap-4">
          <PixelAvatar
            state={avatarState}
            reduceMotion={motionPrefs.reduceMotion}
            size={72}
          />
          <View className="flex-1 gap-2">
            <Text tone="onPrimary" className="text-base font-extrabold">
              {avatarState.classTitle}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Badge
                label={`${goldEconomy.availableGold} G`}
                variant="accent"
                pill
                tabularNums
                icon={
                  <Coins
                    size={13}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />
              <Badge
                label={`${shieldStats.availableShields} Shields`}
                variant="accent"
                pill
                tabularNums
                icon={
                  <Shield
                    size={13}
                    color={colors.accentText}
                    strokeWidth={2.5}
                  />
                }
              />
            </View>
            <Text tone="onPrimary" className="text-xs font-semibold">
              Earned: {goldEconomy.earnedGold}G · Spent: {goldEconomy.spentGold}G
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle how to earn gold breakdown"
          accessibilityState={{ expanded: showEarnGuide }}
          onPress={() => setShowEarnGuide((prev) => !prev)}
          style={{
            backgroundColor: colors.primaryPressed,
            borderRadius: radii.button,
          }}
          className="mt-3 min-h-[44px] flex-row items-center justify-between px-3 py-2"
        >
          <Text tone="onPrimary" className="text-xs font-extrabold">
            How to Earn Gold
          </Text>
          {showEarnGuide ? (
            <ChevronDown size={15} color={colors.primaryText} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={15} color={colors.primaryText} strokeWidth={2.5} />
          )}
        </Pressable>

        {showEarnGuide ? (
          <View
            style={{
              backgroundColor: colors.primaryPressed,
              borderRadius: radii.button,
            }}
            className="mt-2 gap-1.5 p-3"
          >
            <View className="flex-row items-center justify-between">
              <Text tone="onPrimary" className="text-xs">
                Quests (+{GOLD_PER_COMPLETION}G each)
              </Text>
              <Text tone="onPrimary" tabularNums className="text-xs font-bold">
                +{goldEconomy.breakdown.questsGold}G
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text tone="onPrimary" className="text-xs">
                Perfect Days (+{GOLD_ALL_DONE_BONUS}G bonus)
              </Text>
              <Text tone="onPrimary" tabularNums className="text-xs font-bold">
                +{goldEconomy.breakdown.perfectDaysGold}G
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text tone="onPrimary" className="text-xs">
                Streak Milestones (7/14/30/100d)
              </Text>
              <Text tone="onPrimary" tabularNums className="text-xs font-bold">
                +{goldEconomy.breakdown.streakMilestonesGold}G
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text tone="onPrimary" className="text-xs">
                Trophy Case Achievements
              </Text>
              <Text tone="onPrimary" tabularNums className="text-xs font-bold">
                +{goldEconomy.breakdown.achievementsGold}G
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text tone="onPrimary" className="text-xs">
                Hero Level-Ups (+{GOLD_PER_LEVEL_UP}G/lvl)
              </Text>
              <Text tone="onPrimary" tabularNums className="text-xs font-bold">
                +{goldEconomy.breakdown.levelUpGold}G
              </Text>
            </View>
          </View>
        ) : null}
      </Card>

      <View className="mb-3 flex-row gap-2">
        {CATEGORIES.map((cat) => (
          <SelectableChip
            key={cat.value}
            label={cat.label}
            selected={activeCategory === cat.value}
            accessibilityLabel={`Filter shop by ${cat.label}`}
            onPress={() => {
              setActiveCategory(cat.value);
              setFeedback(null);
            }}
            textClassName="text-xs font-bold"
          />
        ))}
      </View>

      {feedback ? (
        <Text variant="caption" tone="primaryAccent" className="mb-2 font-bold">
          {feedback}
        </Text>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {items.map((item) => {
          const owned =
            item.category !== "consumable" && ownedItemIds.has(item.id);
          const equipped = isEquipped(item);
          const canAfford = goldEconomy.availableGold >= item.costGold;

          const buttonLabel =
            item.category === "consumable"
              ? `Buy · ${item.costGold}G`
              : equipped
                ? "Equipped"
                : owned
                  ? "Equip"
                  : `Buy · ${item.costGold}G`;

          return (
            <Card
              key={item.id}
              elevated={!equipped}
              style={{
                borderColor: equipped ? colors.accentBorder : colors.border,
              }}
              className="mb-3 p-4"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.button,
                    backgroundColor: item.previewColor,
                    borderWidth: 2,
                    borderColor: item.accentColor,
                  }}
                />
                <View className="flex-1">
                  <Text variant="heading">{item.name}</Text>
                  <Text variant="caption" className="mt-0.5">
                    {item.description}
                  </Text>
                </View>
                <Button
                  label={buttonLabel}
                  variant={equipped ? "secondary" : "primary"}
                  disabled={!owned && !canAfford}
                  onPress={() => void handleAction(item)}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
