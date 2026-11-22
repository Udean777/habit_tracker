import * as Notifications from "expo-notifications";
import { getDeviceLocalDate } from "@habit/shared";
import type { HabitRecord } from "@/features/habits/repository";
import { upsertHabitLog } from "@/features/logs";
import { getSettings } from "@/features/settings";

const HABIT_CATEGORY_ID = "habit_reminder";
const COMPLETE_ACTION_ID = "COMPLETE_HABIT";

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(HABIT_CATEGORY_ID, [
    {
      identifier: COMPLETE_ACTION_ID,
      buttonTitle: "Complete",
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function reconcileNotifications(
  activeHabits: readonly HabitRecord[],
): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const req of scheduled) {
    if (req.content.data?.kind === "habit_reminder") {
      await Notifications.cancelScheduledNotificationAsync(req.identifier);
    }
  }

  const withReminders = activeHabits.filter((h) => h.reminderTime !== null);
  if (withReminders.length === 0) return;

  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return;

  for (const habit of withReminders) {
    if (!habit.reminderTime) continue;
    const [hourStr, minuteStr] = habit.reminderTime.split(":");
    const hour = Number.parseInt(hourStr ?? "9", 10);
    const minute = Number.parseInt(minuteStr ?? "0", 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: habit.name,
        body: "Time for your habit",
        categoryIdentifier: HABIT_CATEGORY_ID,
        data: { kind: "habit_reminder", habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): Promise<boolean> {
  if (response.actionIdentifier !== COMPLETE_ACTION_ID) {
    return false;
  }
  const habitId = response.notification.request.content.data?.habitId;
  if (typeof habitId !== "string" || habitId.length === 0) {
    return false;
  }

  const settings = await getSettings();
  const today = getDeviceLocalDate(new Date(), settings.dayStartOffsetMin);
  await upsertHabitLog({
    habitId,
    logDate: today,
    value: 1,
    today,
    backfillWindowDays: settings.backfillWindowDays,
  });
  return true;
}
