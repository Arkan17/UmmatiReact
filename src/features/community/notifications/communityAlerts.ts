// In-app alerts for community activity (reactions, replies, scholar answers, Ameens, RSVPs).
//
// These fire only while the app is open (foreground or recently backgrounded), driven by the
// Supabase Realtime subscription in CommunityAlertsListener. Real push notifications when the app
// is fully closed need FCM/APNs device tokens plus a Supabase Edge Function (or database webhook)
// that sends them on insert into community_notifications — that is out of scope here.
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CommunityNotification } from '../api/types';

const CHANNEL_ID = 'community-v1';
const ENABLED_KEY = 'community_alerts_enabled';

const REACTION_LABELS: Record<string, string> = {
  subhanallah: 'SubhanAllah',
  mashallah: 'MashaAllah',
  jazakallah: 'JazakAllah Khair',
  ameen: 'Ameen',
};

/** Splits a reaction preview ("kind|post text") into its parts; other kinds keep the raw preview. */
export function parsePreview(n: CommunityNotification): { reaction: string | null; snippet: string } {
  const raw = n.preview ?? '';
  if (n.kind !== 'reaction') return { reaction: null, snippet: raw };
  const i = raw.indexOf('|');
  const kind = i >= 0 ? raw.slice(0, i) : raw;
  return { reaction: REACTION_LABELS[kind] ?? 'MashaAllah', snippet: i >= 0 ? raw.slice(i + 1) : '' };
}

/** Headline text for a notification, e.g. "Bilal said MashaAllah on your post". */
export function describeNotification(n: CommunityNotification): string {
  const who = n.actor_name || 'Someone';
  const { reaction, snippet } = parsePreview(n);
  switch (n.kind) {
    case 'reaction': return `${who} said ${reaction} on your post`;
    case 'comment': return `${who} replied: ${snippet}`;
    case 'answer': return 'A scholar answered your question';
    case 'ameen': return `${who} said Ameen to your dua 🤲`;
    case 'rsvp': return `${who} is going to ${snippet || 'your event'}`;
    case 'group_join': return `${who} joined your group`;
    default: return `${who} interacted with you`;
  }
}

export async function getAlertsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setAlertsEnabled(on: boolean) {
  await AsyncStorage.setItem(ENABLED_KEY, on ? 'true' : 'false');
}

let channelReady: Promise<string> | null = null;
const ensureChannel = () => {
  channelReady ??= notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Community',
    description: 'Reactions, replies and Ameens on your posts and duas',
    importance: AndroidImportance.DEFAULT,
  });
  return channelReady;
};

/** Shows a local notification for a new community notification, if the user has alerts on. */
export async function showCommunityAlert(n: CommunityNotification) {
  if (!(await getAlertsEnabled())) return;
  try {
    const channelId = await ensureChannel();
    const { snippet } = parsePreview(n);
    await notifee.displayNotification({
      title: n.kind === 'answer' ? 'Your question was answered ✨' : 'Ummati Community',
      body: n.kind === 'answer' && snippet ? `${describeNotification(n)}: ${snippet}` : describeNotification(n),
      data: {
        source: 'community',
        ...(n.post_id ? { postId: n.post_id } : {}),
        ...(n.dua_id ? { duaId: n.dua_id } : {}),
        ...(n.event_id ? { eventId: n.event_id } : {}),
      },
      android: { channelId, pressAction: { id: 'default' }, smallIcon: 'ic_launcher' },
    });
  } catch (e) {
    console.warn('[community] alert failed:', e);
  }
}
