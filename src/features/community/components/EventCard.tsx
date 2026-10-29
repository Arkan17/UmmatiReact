import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Clock, MapPin, Users } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable, PressableScale, outline } from '../../../core/components/ui';
import type { CommunityEvent } from '../api/types';
import { eventKind, formatDistance, formatTimeRange } from './EventKinds';

const INK = '#1C1A17';

/** Event row: kind-coloured date block, details and an "I'm going" toggle. */
export function EventCard({ event, onPress, onToggleRsvp }: {
  event: CommunityEvent;
  onPress: () => void;
  onToggleRsvp: () => void;
}) {
  const { colors } = useAppTheme();
  const kind = eventKind(event.kind);
  const start = new Date(event.starts_at);
  const distance = formatDistance(event.distance_km);

  return (
    <BrutalPressable onPress={onPress} radius={22} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dateBlock, outline(colors), { backgroundColor: kind.tint }]}>
          <Text style={styles.month}>{start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
          <Text style={styles.day}>{start.getDate()}</Text>
          <Text style={styles.emoji}>{kind.emoji}</Text>
        </View>
        <View style={styles.flex}>
          <View style={[styles.kindPill, outline(colors, 1.5), { backgroundColor: kind.tint }]}>
            <Text style={styles.kindText}>{kind.label}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
          <View style={styles.meta}>
            <Clock color={colors.textMuted} size={13} strokeWidth={2.4} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatTimeRange(event.starts_at, event.ends_at)}</Text>
          </View>
          <View style={styles.meta}>
            <MapPin color={colors.textMuted} size={13} strokeWidth={2.4} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.location_name}{distance ? ` · ${distance}` : ''}
            </Text>
          </View>
          <Text style={[styles.host, { color: colors.textMuted }]} numberOfLines={1}>
            {event.host_name ? `Hosted by ${event.host_name}` : 'Community event'}{event.group_name ? ` · ${event.group_name}` : ''}
          </Text>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: colors.ink }]}>
        <View style={styles.meta}>
          <Users color={colors.textSecondary} size={15} strokeWidth={2.4} />
          <Text style={[styles.going, { color: colors.textSecondary }]}>{event.rsvp_count} going</Text>
        </View>
        <PressableScale
          onPress={onToggleRsvp}
          style={[styles.rsvp, outline(colors), { backgroundColor: event.my_rsvp ? colors.primary : colors.surface }]}
        >
          {event.my_rsvp ? <Check color={colors.onPrimary} size={15} strokeWidth={3} /> : null}
          <Text style={[styles.rsvpText, { color: event.my_rsvp ? colors.onPrimary : colors.text }]}>
            {event.my_rsvp ? "I'm going" : 'Going?'}
          </Text>
        </PressableScale>
      </View>
    </BrutalPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { padding: 14, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 14 },
  dateBlock: { width: 62, borderRadius: 16, alignItems: 'center', paddingVertical: 8 },
  month: { color: INK, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  day: { color: INK, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, lineHeight: 30 },
  emoji: { fontSize: 16, marginTop: 2 },
  kindPill: { alignSelf: 'flex-start', paddingHorizontal: 8, height: 20, borderRadius: 10, justifyContent: 'center', marginBottom: 5 },
  kindText: { color: INK, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.4 },
  title: { fontSize: 17, fontWeight: '900', letterSpacing: -0.2, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  metaText: { flex: 1, fontSize: 13, fontWeight: '600' },
  host: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: brutal.borderThin, marginTop: 12, paddingTop: 10 },
  going: { fontSize: 13.5, fontWeight: '800' },
  rsvp: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, height: 34, borderRadius: 17 },
  rsvpText: { fontSize: 13.5, fontWeight: '900' },
});
