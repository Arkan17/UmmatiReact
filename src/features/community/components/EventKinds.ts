import { tints } from '../../../core/theme/palettes';
import type { EventKind } from '../api/types';

export const EVENT_KINDS: { key: EventKind; label: string; emoji: string; tint: string }[] = [
  { key: 'lecture', label: 'Lecture', emoji: '🎤', tint: tints.blue },
  { key: 'class', label: 'Class', emoji: '📖', tint: tints.teal },
  { key: 'jumuah', label: "Jumu'ah", emoji: '🕌', tint: tints.green },
  { key: 'iftar', label: 'Iftar', emoji: '🌙', tint: tints.indigo },
  { key: 'charity', label: 'Charity', emoji: '🤲', tint: tints.rose },
  { key: 'social', label: 'Social', emoji: '☕', tint: tints.orange },
  { key: 'other', label: 'Other', emoji: '✨', tint: tints.violet },
];

export const eventKind = (k: string) => EVENT_KINDS.find((e) => e.key === k) ?? EVENT_KINDS[EVENT_KINDS.length - 1];

export const formatDistance = (km: number | null) =>
  km == null ? null : km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

export const formatTimeRange = (startIso: string, endIso: string | null) => {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const start = new Date(startIso).toLocaleTimeString(undefined, opts);
  return endIso ? `${start} – ${new Date(endIso).toLocaleTimeString(undefined, opts)}` : start;
};

/** "Today", "Tomorrow" or e.g. "Sat, 2 Nov". */
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Native maps URL for an event: coordinates when known, otherwise a search for the place name. */
export function mapsUrl(platform: string, name: string, lat: number | null, lng: number | null) {
  const q = encodeURIComponent(name);
  if (platform === 'ios') return lat != null && lng != null ? `maps://?q=${q}&ll=${lat},${lng}` : `maps://?q=${q}`;
  return lat != null && lng != null ? `geo:${lat},${lng}?q=${lat},${lng}(${q})` : `geo:0,0?q=${q}`;
}
