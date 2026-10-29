// Real OS-level prayer notifications (they fire even when the app is closed).
// We schedule the next few days of prayers and top the queue up every app launch.
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes, loadLastLocation, ReminderName, timeFor, formatTime } from '../prayer/prayerTimes';

const REMINDERS_KEY = 'prayer_reminders';
const CHANNEL_ID = 'prayer-times-v1';
// iOS keeps at most 64 pending notifications; 6 per day * 7 days stays under that.
const DAYS_AHEAD = 7;

export type ReminderSettings = Record<ReminderName, boolean>;
export const DEFAULT_REMINDERS: ReminderSettings = {
  Fajr: true, Sunrise: false, Dhuhr: true, Asr: true, Maghrib: true, Isha: true,
};

const MESSAGES: Record<ReminderName, string> = {
  Fajr: 'Prayer is better than sleep. Time for Fajr.',
  Sunrise: 'The sun is rising. Remember Allah in the morning adhkar.',
  Dhuhr: 'Take a break from the world. Time for Dhuhr.',
  Asr: 'Guard the middle prayer. Time for Asr.',
  Maghrib: 'The sun has set. Time for Maghrib.',
  Isha: 'End your day with Allah. Time for Isha.',
};

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    if (raw) return { ...DEFAULT_REMINDERS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_REMINDERS;
}

export async function saveReminderSettings(settings: ReminderSettings) {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(settings));
  await schedulePrayerNotifications(settings);
}

async function ensureChannel() {
  // To use a custom Adhan, add android/app/src/main/res/raw/adhan.mp3 and set sound: 'adhan'
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Prayer times',
    description: 'Adhan reminders at each prayer time',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

/** Cancel and re-create all prayer notifications for the coming week. */
export async function schedulePrayerNotifications(settings?: ReminderSettings) {
  try {
    const reminders = settings ?? (await loadReminderSettings());
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const channelId = await ensureChannel();
    // Only clear our own prayer reminders: community event reminders share the same queue
    const scheduled = await notifee.getTriggerNotificationIds();
    await notifee.cancelTriggerNotifications(scheduled.filter((id) => id.startsWith('prayer-')));

    const { latitude, longitude } = await loadLastLocation();
    const now = Date.now();

    for (let day = 0; day < DAYS_AHEAD; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const times = getPrayerTimes(latitude, longitude, date);

      for (const name of Object.keys(reminders) as ReminderName[]) {
        if (!reminders[name]) continue;
        const at = timeFor(times, name);
        if (at.getTime() <= now) continue;

        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: at.getTime(),
          alarmManager: { allowWhileIdle: true },
        };
        await notifee.createTriggerNotification(
          {
            id: `prayer-${name}-${at.toDateString()}`,
            title: name === 'Sunrise' ? '🌅 Sunrise' : `🕌 ${name} · ${formatTime(at)}`,
            body: MESSAGES[name],
            data: { prayer: name },
            android: {
              channelId,
              smallIcon: 'ic_launcher',
              color: '#0E9F6E',
              pressAction: { id: 'default' },
            },
            ios: { sound: 'default' },
          },
          trigger,
        );
      }
    }
  } catch (e) {
    console.warn('[notifications] scheduling failed:', e);
  }
}
