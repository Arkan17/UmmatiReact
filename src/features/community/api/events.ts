import { currentUserId, supabase, unwrap } from './client';
import type { CommunityEvent, EventKind } from './types';

export async function fetchEvents(opts: { lat?: number | null; lng?: number | null; radiusKm?: number; groupId?: string | null; mine?: boolean } = {}): Promise<CommunityEvent[]> {
  return unwrap(await supabase.rpc('get_events', {
    p_lat: opts.lat ?? null,
    p_lng: opts.lng ?? null,
    p_radius_km: opts.radiusKm ?? 50,
    p_group: opts.groupId ?? null,
    p_mine: opts.mine ?? false,
  })) ?? [];
}

export async function createEvent(input: {
  title: string;
  description?: string;
  kind: EventKind;
  startsAt: Date;
  endsAt?: Date | null;
  locationName: string;
  mosqueId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  groupId?: string | null;
}): Promise<string> {
  const uid = await currentUserId();
  return unwrap<{ id: string }>(await supabase.from('community_events').insert({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    kind: input.kind,
    starts_at: input.startsAt.toISOString(),
    ends_at: input.endsAt ? input.endsAt.toISOString() : null,
    location_name: input.locationName.trim(),
    mosque_id: input.mosqueId ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    group_id: input.groupId ?? null,
    created_by: uid,
  }).select('id').single()).id;
}

export async function deleteEvent(id: string) {
  unwrap(await supabase.from('community_events').delete().eq('id', id));
}

export async function setRsvp(eventId: string, going: boolean) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Please sign in first.');
  if (going) unwrap(await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: uid }, { onConflict: 'event_id,user_id' }));
  else unwrap(await supabase.from('event_rsvps').delete().match({ event_id: eventId, user_id: uid }));
}
