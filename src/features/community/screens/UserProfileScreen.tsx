// Public profile: avatar, role, bio, level/streak (if shared) and the member's posts.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flame, MessageCircle, Star, UserCheck, UserX } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuth } from '../../../core/hooks/useAuth';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalPressable, Card, ScreenHeader, haptic, outline } from '../../../core/components/ui';
import { levelFor } from '../../../core/services/progress';
import { blockUser, fetchPublicProfile, unblockUser } from '../api/moderation';
import type { PublicProfile } from '../api/types';
import { Avatar, RoleBadge } from '../components/Avatar';
import { FeedList } from '../components/FeedList';

const INK = '#1C1A17';

export function UserProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'UserProfile'>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { userId } = route.params;
  const isMe = user?.id === userId;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProfile(await fetchPublicProfile(userId));
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = () => {
    if (!profile) return;
    const blocking = !profile.is_blocked;
    const go = async () => {
      setBusy(true);
      try {
        if (blocking) await blockUser(profile.id);
        else await unblockUser(profile.id);
        haptic.success();
        setProfile({ ...profile, is_blocked: blocking });
      } catch (e: any) {
        Alert.alert('Something went wrong', e?.message ?? 'Please try again.');
      } finally {
        setBusy(false);
      }
    };
    if (!blocking) { go(); return; }
    Alert.alert(`Block ${profile.username}?`, "You won't see their posts, comments or duas. They won't be told.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: go },
    ]);
  };

  const lvl = profile?.total_xp != null ? levelFor(profile.total_xp) : null;
  const joined = profile ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '';

  const header = (
    <View>
      <ScreenHeader title={profile?.username ?? 'Profile'} subtitle={profile ? `Member since ${joined}` : undefined} onBack={() => navigation.goBack()} />
      {profile ? (
        <Animated.View entering={FadeInDown.duration(350)} style={styles.pad}>
          <Card style={styles.card}>
            <View style={styles.top}>
              <Avatar name={profile.username} color={profile.avatar_color} size={70} />
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{profile.username}</Text>
                  <RoleBadge role={profile.role} />
                </View>
                {profile.bio ? <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text> : null}
              </View>
            </View>

            <View style={styles.stats}>
              {lvl ? (
                <View style={[styles.stat, outline(colors), { backgroundColor: tints.gold }]}>
                  <Star color={INK} size={16} strokeWidth={2.5} />
                  <Text style={styles.statValue}>Lv {lvl.level}</Text>
                  <Text style={styles.statLabel}>{profile.total_xp} XP</Text>
                </View>
              ) : null}
              {profile.streak_count != null ? (
                <View style={[styles.stat, outline(colors), { backgroundColor: tints.orange }]}>
                  <Flame color={INK} size={16} strokeWidth={2.5} />
                  <Text style={styles.statValue}>{profile.streak_count}</Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </View>
              ) : null}
              <View style={[styles.stat, outline(colors), { backgroundColor: tints.green }]}>
                <MessageCircle color={INK} size={16} strokeWidth={2.5} />
                <Text style={styles.statValue}>{profile.post_count}</Text>
                <Text style={styles.statLabel}>posts</Text>
              </View>
            </View>

            {!isMe && user ? (
              <BrutalPressable
                onPress={toggleBlock}
                disabled={busy}
                fill={profile.is_blocked ? colors.surface : colors.danger}
                offset={brutal.shadowSmall}
                style={styles.blockBtn}
              >
                {profile.is_blocked ? <UserCheck color={colors.text} size={18} strokeWidth={2.5} /> : <UserX color={INK} size={18} strokeWidth={2.5} />}
                <Text style={[styles.blockText, { color: profile.is_blocked ? colors.text : INK }]}>
                  {profile.is_blocked ? 'Unblock' : 'Block'}
                </Text>
              </BrutalPressable>
            ) : null}
          </Card>
          <Text style={[styles.section, { color: colors.text }]}>{isMe ? 'Your posts' : 'Posts'}</Text>
        </Animated.View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
        <Text style={[styles.missing, { color: colors.textSecondary }]}>This profile is not available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Blocked authors are filtered server-side; remount on (un)block to refetch */}
      <FeedList
        key={profile.is_blocked ? 'blocked' : 'open'}
        query={{ authorId: userId }}
        header={header}
        emptyTitle={profile.is_blocked ? 'You blocked this member' : 'No posts yet'}
        emptyText={
          profile.is_blocked ? 'Unblock them to see their posts again.'
            : isMe ? 'Share your first reminder with the community.' : "They haven't posted anything yet."
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 18, paddingTop: 18 },
  loader: { marginTop: 40 },
  missing: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  card: { borderRadius: 24 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 21, fontWeight: '900', flexShrink: 1 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 2 },
  statValue: { color: INK, fontSize: 17, fontWeight: '900' },
  statLabel: { color: INK, fontSize: 11, fontWeight: '800', opacity: 0.75 },
  blockBtn: { flexDirection: 'row', gap: 8, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  blockText: { fontSize: 15, fontWeight: '900' },
  section: { fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 12 },
});
