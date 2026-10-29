// Full event details: description, open in maps, RSVP, share and the "…" moderation menu.
import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Check, Clock, Flag, MapPin, MoreHorizontal, Navigation, Share2, Trash2, UserX, Users } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable, PressableScale, haptic, outline } from '../../../core/components/ui';
import { deleteEvent } from '../api/events';
import { blockUser } from '../api/moderation';
import type { CommunityEvent } from '../api/types';
import { formatEventDate } from '../utils/time';
import { cancelEventReminder } from '../utils/eventReminders';
import { eventKind, formatDistance, formatTimeRange, mapsUrl } from './EventKinds';
import { OptionsSheet } from './OptionsSheet';
import { ReportSheet } from './ReportSheet';
import { Sheet } from './Sheet';

const INK = '#1C1A17';

export function EventDetailSheet({ event, onClose, onToggleRsvp, onRemoved, myId, isAdmin }: {
  event: CommunityEvent | null;
  onClose: () => void;
  onToggleRsvp: (e: CommunityEvent) => void;
  /** Event deleted or its host blocked: drop it (or all of that host's events) from the list. */
  onRemoved: (e: CommunityEvent, blockedHost: boolean) => void;
  myId: string | null;
  isAdmin: boolean;
}) {
  const { colors } = useAppTheme();
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  // Keep the last event while the sheet animates closed / while sub-sheets are open
  const [kept, setKept] = useState<CommunityEvent | null>(event);
  if (event && event !== kept) setKept(event);
  const e = event ?? kept;
  if (!e) return null;

  const kind = eventKind(e.kind);
  const mine = !!myId && e.created_by === myId;
  const distance = formatDistance(e.distance_km);

  const openMaps = async () => {
    const url = mapsUrl(Platform.OS, e.location_name, e.latitude, e.longitude);
    const web = e.latitude != null && e.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location_name)}`;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else await Linking.openURL(web);
    } catch {
      Linking.openURL(web).catch(() => {});
    }
  };

  const share = () => {
    Share.share({
      message: `${kind.emoji} ${e.title}\n🗓 ${formatEventDate(e.starts_at)}\n📍 ${e.location_name}${e.description ? `\n\n${e.description}` : ''}\n\nShared from Ummati`,
    }).catch(() => {});
  };

  const remove = () => {
    Alert.alert('Delete event?', 'This removes it for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteEvent(e.id);
            cancelEventReminder(e.id);
            haptic.success();
            onRemoved(e, false);
            onClose();
          } catch (err: any) {
            Alert.alert('Could not delete', err?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const block = () => {
    Alert.alert(`Block ${e.host_name ?? 'this host'}?`, "You won't see their posts or events anymore.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          try {
            await blockUser(e.created_by);
            onRemoved(e, true);
            onClose();
          } catch (err: any) {
            Alert.alert('Could not block', err?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <>
      <Sheet visible={!!event && !menu && !reporting} onClose={onClose} title={e.title} subtitle={`${kind.emoji} ${kind.label}${e.group_name ? ` · ${e.group_name}` : ''}`}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.info, outline(colors), { backgroundColor: kind.tint }]}>
            <View style={styles.infoRow}>
              <Clock color={INK} size={16} strokeWidth={2.5} />
              <Text style={styles.infoText}>{formatEventDate(e.starts_at)}{e.ends_at ? ` (${formatTimeRange(e.starts_at, e.ends_at)})` : ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin color={INK} size={16} strokeWidth={2.5} />
              <Text style={styles.infoText}>{e.location_name}{distance ? ` · ${distance} away` : ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Users color={INK} size={16} strokeWidth={2.5} />
              <Text style={styles.infoText}>{e.rsvp_count} going · hosted by {e.host_name ?? 'a community member'}</Text>
            </View>
          </View>
          {e.description ? <Text style={[styles.desc, { color: colors.text }]}>{e.description}</Text> : null}
        </ScrollView>

        <View style={styles.actions}>
          <BrutalPressable fill={colors.surface} offset={brutal.shadowSmall} style={styles.iconBtn} onPress={openMaps}>
            <Navigation color={colors.text} size={19} strokeWidth={2.4} />
          </BrutalPressable>
          <BrutalPressable fill={colors.surface} offset={brutal.shadowSmall} style={styles.iconBtn} onPress={share}>
            <Share2 color={colors.text} size={19} strokeWidth={2.4} />
          </BrutalPressable>
          <BrutalPressable fill={colors.surface} offset={brutal.shadowSmall} style={styles.iconBtn} onPress={() => setMenu(true)}>
            <MoreHorizontal color={colors.text} size={19} strokeWidth={2.4} />
          </BrutalPressable>
          <BrutalPressable fill={e.my_rsvp ? colors.primary : colors.accent} style={styles.rsvp} onPress={() => onToggleRsvp(e)}>
            {e.my_rsvp ? <Check color={colors.onPrimary} size={18} strokeWidth={3} /> : null}
            <Text style={[styles.rsvpText, { color: e.my_rsvp ? colors.onPrimary : INK }]}>{e.my_rsvp ? "I'm going" : "I'll be there"}</Text>
          </BrutalPressable>
        </View>
        <PressableScale onPress={openMaps} style={styles.mapsLink}>
          <Text style={[styles.mapsText, { color: colors.textMuted }]}>Open in Maps</Text>
        </PressableScale>
      </Sheet>

      <OptionsSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title="Event options"
        options={[
          { label: 'Share event', Icon: Share2, onPress: share },
          { label: 'Delete event', Icon: Trash2, onPress: remove, destructive: true, hidden: !mine && !isAdmin },
          { label: 'Report event', Icon: Flag, onPress: () => setReporting(true), hidden: mine },
          { label: `Block ${e.host_name ?? 'host'}`, Icon: UserX, onPress: block, destructive: true, hidden: mine },
        ]}
      />
      <ReportSheet
        visible={reporting}
        onClose={() => setReporting(false)}
        target={{ type: 'event', id: e.id }}
        authorId={mine ? null : e.created_by}
        authorName={e.host_name}
        onDone={(blocked) => { if (blocked) { onRemoved(e, true); onClose(); } }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 380 },
  info: { borderRadius: 18, padding: 14, gap: 8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, color: INK, fontSize: 14, fontWeight: '700' },
  desc: { fontSize: 15, lineHeight: 23, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  iconBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  rsvp: { flex: 1, height: 52, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  rsvpText: { fontSize: 15.5, fontWeight: '900' },
  mapsLink: { alignSelf: 'center', marginTop: 12 },
  mapsText: { fontSize: 12.5, fontWeight: '800', textDecorationLine: 'underline' },
});
