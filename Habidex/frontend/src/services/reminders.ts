import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const reminderKey = (habitId: string) => `habit-reminder-${habitId}`;
const reminderConfigKey = (habitId: string) => `habit-reminder-config-${habitId}`;

export type ReminderMode = 'daily' | 'weekly' | 'custom';

export interface ReminderSchedule {
  mode: ReminderMode;
  time: string;
  weekday?: number;
  weekdays?: number[];
}

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

const toExpoWeekday = (weekday: number) => (weekday === 0 ? 1 : weekday + 1);

const parseStoredIds = (value: string | null) => {
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string');
  } catch {
    // backward compatibility: old storage kept a single string id
  }

  return [value];
};

export async function loadHabitReminderConfig(habitId: string): Promise<ReminderSchedule | null> {
  const raw = await SecureStore.getItemAsync(reminderConfigKey(habitId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ReminderSchedule;
    if (!parsed?.mode || !parsed?.time) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveHabitReminderConfig(habitId: string, config: ReminderSchedule) {
  await SecureStore.setItemAsync(reminderConfigKey(habitId), JSON.stringify(config));
}

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelHabitReminder(habitId: string) {
  const existingRaw = await SecureStore.getItemAsync(reminderKey(habitId));
  const existingIds = parseStoredIds(existingRaw);

  for (const existingId of existingIds) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }

  await SecureStore.deleteItemAsync(reminderKey(habitId));
  await SecureStore.deleteItemAsync(reminderConfigKey(habitId));
}

export async function scheduleHabitReminder(habitId: string, habitName: string, schedule?: ReminderSchedule | null) {
  if (!schedule?.time) {
    await cancelHabitReminder(habitId);
    return true;
  }

  const parsed = parseTime(schedule.time);
  if (!parsed) return false;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return false;

  await cancelHabitReminder(habitId);

  const ids: string[] = [];
  const scheduleContent = {
    title: 'Habidex',
    body: `Hora de completar: ${habitName}`,
    sound: true,
    data: { habitId },
  };

  if (schedule.mode === 'daily') {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: scheduleContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    });
    ids.push(notificationId);
  } else if (schedule.mode === 'weekly') {
    const weekday = toExpoWeekday(schedule.weekday ?? 0);
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: scheduleContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: parsed.hour,
        minute: parsed.minute,
      } as any,
    });
    ids.push(notificationId);
  } else {
    const weekdays = (schedule.weekdays?.length ? schedule.weekdays : [0]).map(toExpoWeekday);
    for (const weekday of weekdays) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: scheduleContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: parsed.hour,
          minute: parsed.minute,
        } as any,
      });
      ids.push(notificationId);
    }
  }

  await SecureStore.setItemAsync(reminderKey(habitId), JSON.stringify(ids));
  await saveHabitReminderConfig(habitId, schedule);
  return true;
}
