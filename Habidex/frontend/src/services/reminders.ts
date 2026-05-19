import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const reminderKey = (habitId: string) => `habit-reminder-${habitId}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const parseTime = (time: string) => {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
};

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelHabitReminder(habitId: string) {
  const existingId = await SecureStore.getItemAsync(reminderKey(habitId));
  if (!existingId) return;

  await Notifications.cancelScheduledNotificationAsync(existingId);
  await SecureStore.deleteItemAsync(reminderKey(habitId));
}

export async function scheduleHabitReminder(habitId: string, habitName: string, reminderTime?: string | null) {
  if (!reminderTime) {
    await cancelHabitReminder(habitId);
    return true;
  }

  const parsed = parseTime(reminderTime);
  if (!parsed) return false;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return false;

  await cancelHabitReminder(habitId);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habidex',
      body: `Hora de completar: ${habitName}`,
      sound: true,
      data: { habitId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
    },
  });

  await SecureStore.setItemAsync(reminderKey(habitId), notificationId);
  return true;
}
