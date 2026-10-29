// One community group: tinted header, join/leave, invite code, members, upcoming events and the group feed.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Calendar, ChevronLeft, Globe, Lock, LogOut, MapPin, MoreHorizontal, Plus, Share2, Trash2, UserMinus, Users,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalPressable, PressableScale, haptic, outline } from '../../../core/components/ui';
import { supabase } from '../api/client';
import { fetchEvents } from '../api/events';
import { deleteGroup, fetchGroup, fetchGroupMembers, joinGroup, leaveGroup } from '../api/groups';
import type { CommunityEvent, CommunityGroup } from '../api/types';
import { Avatar } from '../components/Avatar';
import { FeedList } from '../components/FeedList';
import { OptionsSheet } from '../components/OptionsSheet';
import { Sheet } from '../components/Sheet';
import { useCommunityGate } from '../hooks/useCommunityGate';
import { formatEventDate } from '../utils/time';

const INK = '#1C1A17';
const PAPER = '#FFFAF1';

type Member = { user_id: string; role: string; username: string; avatar_color: string | null };

export function GroupDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupDetail'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const gate = useCommunityGate();
  const { id } = route.params;

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const load = useCallback(async () => {
    try {
      const g = await fetchGroup(id);
      setGroup(g);
      if (g) {
        const [m, e] = await Promise.all([fetchGroupMembers(id).catch(() => []), fetchEvents({ groupId: id }).catch(() => [])]);
        setMembers(m);
        setEvents(e);
      }
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  // Refresh events/members after creating an event
  const focused = React.useRef(false);
  useFocusEffect(useCallback(() => {
    if (focused.current) load();
    focused.current = true;
  }, [load]));

  const isAdmin = group?.my_role === 'admin';
  const isCreator = !!user && group?.created_by === user.id;

  const join = async () => {
    if (!user) { navigation.navigate('Auth', { mode: 'signin' }); return; }
    setBusy(true);
    try {
      await joinGroup({ groupId: id });
      haptic.success();
      await load();
    } catch (e: any) {
      Alert.alert('Could not join', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const leave = () => {
    Alert.alert('Leave group?', group?.is_private ? 'You will need the invite code to join again.' : undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          try {
            await leaveGroup(id);
            if (group?.is_private) navigation.goBack();
            else await load();
          } catch (e: any) {
            Alert.alert('Could not leave', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Delete group?', 'All posts and events in this group will be deleted. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteGroup(id);
            haptic.success();
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Could not delete', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const removeMember = (m: Member) => {
    Alert.alert(`Remove ${m.username}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('group_members').delete().match({ group_id: id, user_id: m.user_id });
          if (error) Alert.alert('Could not remove', error.message);
          else setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
        },
      },
    ]);
  };

  const shareInvite = () => {
    if (!group?.invite_code) return;
    Share.share({ message: `Join "${group.name}" on Ummati 🤲\nOpen Community → Groups → Join with code: ${group.invite_code}` }).catch(() => {});
  };

  const compose = async () => {
    if (!(await gate.ensureCanPost())) return;
    navigation.navigate('ComposePost', { category: 'discuss', groupId: id, groupName: group?.name });
  };

  const showEvent = (e: CommunityEvent) => {
    Alert.alert(e.title, `${formatEventDate(e.starts_at)}\n📍 ${e.location_name}${e.description ? `\n\n${e.description}` : ''}\n\n${e.rsvp_count} going`);
  };

  const tint = group?.tint ?? colors.primarySoft;

  const topBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <BrutalPressable onPress={() => navigation.goBack()} fill={PAPER} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.iconBtn}>
        <ChevronLeft color={INK} size={22} strokeWidth={2.6} />
      </BrutalPressable>
      {group?.is_member ? (
        <BrutalPressable onPress={() => setShowMenu(true)} fill={PAPER} radius={14} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.iconBtn}>
          <MoreHorizontal color={INK} size={20} strokeWidth={2.6} />
        </BrutalPressable>
      ) : null}
    </View>
  );

  if (loading || !group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.hero, { backgroundColor: tint, borderColor: colors.ink }]}>{topBar}</View>
        {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : (
          <View style={styles.center}>
            <Lock color={colors.textMuted} size={30} />
            <Text style={[styles.missingTitle, { color: colors.text }]}>Group not available</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>It may be private or deleted. Ask a member for the invite code.</Text>
          </View>
        )}
      </View>
    );
  }

  const header = (
    <View>
      <View style={[styles.hero, { backgroundColor: tint, borderColor: colors.ink }]}>
        {topBar}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.heroBody}>
          <View style={[styles.privacy, outline({ ink: INK }, 1.5), { backgroundColor: PAPER }]}>
            {group.is_private ? <Lock color={INK} size={11} strokeWidth={2.6} /> : <Globe color={INK} size={11} strokeWidth={2.6} />}
            <Text style={styles.privacyText}>{group.is_private ? 'PRIVATE' : 'PUBLIC'} GROUP</Text>
          </View>
          <Text style={styles.name}>{group.name}</Text>
          {group.description ? <Text style={styles.desc}>{group.description}</Text> : null}
          <Pressable onPress={() => setShowMembers(true)} style={styles.membersRow}>
            <View style={styles.faces}>
              {members.slice(0, 4).map((m, i) => (
                <View key={m.user_id} style={{ marginLeft: i ? -10 : 0 }}>
                  <Avatar name={m.username} color={m.avatar_color} size={28} />
                </View>
              ))}
            </View>
            <Text style={styles.membersText}>{group.member_count} {group.member_count === 1 ? 'member' : 'members'} · {group.post_count} posts</Text>
          </Pressable>

          <View style={styles.actions}>
            {group.is_member ? (
              <>
                <BrutalPressable fill={colors.primary} style={styles.actionBtn} onPress={compose}>
                  <Plus color={colors.onPrimary} size={18} strokeWidth={2.8} />
                  <Text style={[styles.actionText, { color: colors.onPrimary }]}>Post</Text>
                </BrutalPressable>
                {group.invite_code ? (
                  <BrutalPressable fill={PAPER} style={styles.actionBtn} onPress={shareInvite}>
                    <Share2 color={INK} size={17} strokeWidth={2.6} />
                    <Text style={styles.actionTextInk}>Invite · {group.invite_code}</Text>
                  </BrutalPressable>
                ) : null}
              </>
            ) : (
              <BrutalPressable fill={colors.primary} style={styles.actionBtn} onPress={join} disabled={busy}>
                <Users color={colors.onPrimary} size={18} strokeWidth={2.6} />
                <Text style={[styles.actionText, { color: colors.onPrimary }]}>{busy ? 'Joining…' : 'Join group'}</Text>
              </BrutalPressable>
            )}
          </View>
        </Animated.View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={[styles.section, { color: colors.text }]}>Upcoming events</Text>
        {group.is_member ? (
          <PressableScale onPress={() => navigation.navigate('CreateEvent', { groupId: id })} style={[styles.smallBtn, outline(colors), { backgroundColor: colors.accentSoft }]}>
            <Plus color={colors.ink} size={14} strokeWidth={2.8} />
            <Text style={[styles.smallBtnText, { color: colors.ink }]}>New event</Text>
          </PressableScale>
        ) : null}
      </View>
      {events.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.events}>
          {events.map((e) => (
            <BrutalPressable key={e.id} onPress={() => showEvent(e)} fill={colors.surface} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.eventCard}>
              <View style={styles.eventRow}>
                <Calendar color={colors.text} size={14} strokeWidth={2.5} />
                <Text style={[styles.eventDate, { color: colors.textSecondary }]} numberOfLines={1}>{formatEventDate(e.starts_at)}</Text>
              </View>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>{e.title}</Text>
              <View style={styles.eventRow}>
                <MapPin color={colors.textMuted} size={12} />
                <Text style={[styles.eventLoc, { color: colors.textMuted }]} numberOfLines={1}>{e.location_name}</Text>
              </View>
              <Text style={[styles.eventGoing, { color: colors.text }]}>{e.rsvp_count} going{e.my_rsvp ? ' · including you' : ''}</Text>
            </BrutalPressable>
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.noEvents, { color: colors.textMuted }]}>No upcoming events.</Text>
      )}
      <Text style={[styles.section, styles.pad, { color: colors.text }]}>Group feed</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedList
        key={group.is_member ? 'member' : 'guest'}
        query={{ groupId: id }}
        header={header}
        cacheKey={`ummati_group_feed_${id}`}
        bottomInset={insets.bottom}
        emptyTitle="No posts yet"
        emptyText={group.is_member ? 'Start the conversation — share something with your group.' : 'Join to post in this group.'}
      />

      <Sheet visible={showMembers} onClose={() => setShowMembers(false)} title="Members" subtitle={`${members.length} in ${group.name}`}>
        <ScrollView style={styles.memberList}>
          {members.map((m) => (
            <View key={m.user_id} style={styles.memberRow}>
              <Pressable style={styles.memberTap} onPress={() => { setShowMembers(false); navigation.navigate('UserProfile', { userId: m.user_id }); }}>
                <Avatar name={m.username} color={m.avatar_color} size={36} />
                <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>{m.username}</Text>
                {m.role === 'admin' ? (
                  <View style={[styles.adminPill, outline(colors, 1.5), { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.adminText, { color: colors.ink }]}>ADMIN</Text>
                  </View>
                ) : null}
              </Pressable>
              {isAdmin && m.user_id !== user?.id && m.role !== 'admin' ? (
                <PressableScale onPress={() => removeMember(m)} style={[styles.removeBtn, outline(colors, 1.5), { backgroundColor: colors.surfaceAlt }]}>
                  <UserMinus color={colors.text} size={16} />
                </PressableScale>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </Sheet>

      <OptionsSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        title={group.name}
        options={[
          { label: 'Members', Icon: Users, onPress: () => setShowMembers(true) },
          { label: 'Share invite code', Icon: Share2, onPress: shareInvite, hidden: !group.invite_code },
          { label: 'Leave group', Icon: LogOut, onPress: leave, hidden: isCreator },
          { label: 'Delete group', Icon: Trash2, destructive: true, onPress: remove, hidden: !isCreator },
        ]}
      />
      {gate.modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pad: { paddingHorizontal: 18 },
  loader: { marginTop: 40 },
  center: { alignItems: 'center', padding: 30, gap: 10 },
  missingTitle: { fontSize: 19, fontWeight: '900' },
  muted: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  hero: { borderBottomWidth: brutal.border, paddingBottom: 18 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heroBody: { paddingHorizontal: 18, marginTop: 16 },
  privacy: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11 },
  privacyText: { color: INK, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8 },
  name: { color: INK, fontSize: 27, fontWeight: '900', letterSpacing: -0.4, marginTop: 10 },
  desc: { color: INK, fontSize: 14.5, lineHeight: 20, marginTop: 6, opacity: 0.85 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  faces: { flexDirection: 'row' },
  membersText: { color: INK, fontSize: 13.5, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flexDirection: 'row', gap: 6, height: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '900' },
  actionTextInk: { color: INK, fontSize: 14, fontWeight: '900' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 22 },
  section: { fontSize: 18, fontWeight: '900', marginTop: 4, marginBottom: 12 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 15, marginBottom: 8 },
  smallBtnText: { fontSize: 12.5, fontWeight: '900' },
  events: { paddingHorizontal: 18, gap: 12, paddingBottom: 18 },
  eventCard: { width: 210, padding: 12, gap: 6 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventDate: { fontSize: 12, fontWeight: '800', flexShrink: 1 },
  eventTitle: { fontSize: 15, fontWeight: '900', lineHeight: 19 },
  eventLoc: { fontSize: 12, flexShrink: 1 },
  eventGoing: { fontSize: 12, fontWeight: '800' },
  noEvents: { paddingHorizontal: 18, fontSize: 13.5, marginBottom: 18 },
  memberList: { maxHeight: 420 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  memberTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberName: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  adminPill: { paddingHorizontal: 7, height: 20, borderRadius: 10, justifyContent: 'center' },
  adminText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  removeBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
