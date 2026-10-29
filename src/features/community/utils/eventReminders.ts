// Local reminders for events I'm going to: one notification 1 hour before the start.
import notifee, { AndroidImportance, AuthorizationStatus, TimestampTrigger, TriggerType } from '@notifee/react-native';
import type { CommunityEvent } from '../api/types';
import { formatEventDate } from './time';

const CHANNEL_ID = 'community-events-v1';
const LEAD_MS = 60 * 60 * 1000;

const reminderId = (eventId: string) => `event-${eventId}`;

type ReminderEvent = Pick<CommunityEvent, 'id' | 'title' | 'starts_at' | 'location_name'>;

export async function scheduleEventReminder(event: ReminderEvent) {
  try {
    const start = new Date(event.starts_at).getTime();
    // If the event starts within the hour, remind a minute from now instead
    const at = Math.max(start - LEAD_MS, Date.now() + 60_000);
    if (at >= start) return;

    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) return;

    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Community events',
      description: 'Reminders for events you are going to',
      importance: AndroidImportance.HIGH,
    });
    const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: at, alarmManager: { allowWhileIdle: true } };
    await notifee.createTriggerNotification(
      {
        id: reminderId(event.id),
        title: `📅 ${event.title}`,
        body: `Starts ${formatEventDate(event.starts_at)} · ${event.location_name}`,
        data: { eventId: event.id },
        android: { channelId, smallIcon: 'ic_launcher', color: '#0E9F6E', pressAction: { id: 'default' } },
        ios: { sound: 'default' },
      },
      trigger,
    );
  } catch (e) {
    console.warn('[events] reminder scheduling failed:', e);
  }
}

export async function cancelEventReminder(eventId: string) {
  try {
    await notifee.cancelTriggerNotification(reminderId(eventId));
  } catch {}
}

/**
 * Re-creates reminders for every upcoming event I RSVP'd to that has none pending
 * (prayer scheduling clears all trigger notifications on launch).
 */
export async function syncEventReminders(events: CommunityEvent[]) {
  try {
    const pending = new Set(await notifee.getTriggerNotificationIds());
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) return;
    for (const e of events) {
      if (e.my_rsvp && !pending.has(reminderId(e.id)) && new Date(e.starts_at).getTime() > Date.now()) {
        await scheduleEventReminder(e);
      }
    }
  } catch {}
}
