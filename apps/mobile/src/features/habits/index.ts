export {
  archiveHabit,
  createHabit,
  getHabitById,
  listActiveHabits,
  listArchivedHabits,
  reorderHabits,
  softDeleteHabit,
  unarchiveHabit,
  updateHabit,
  type HabitRecord,
} from "./repository";
export { useHabitsData } from "./hooks/useHabitsData";
export { computeQuestProgress, type QuestProgress } from "./questStats";
export {
  mapQuestProgressToAvatar,
  resolveGearTier,
  type AvatarClass,
  type AvatarGearTier,
  type AvatarMood,
  type AvatarVisualState,
} from "./avatarMapper";
export { PixelAvatar } from "./components/PixelAvatar";
export { QuestHud } from "./components/QuestHud";
export { DraggableQuestList } from "./components/DraggableQuestList";
