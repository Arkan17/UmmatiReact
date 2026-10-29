// People I've blocked: their posts, comments, duas and events are hidden from me.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShieldOff, UserCheck } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal } from '../../../core/theme/palettes';
import { BrutalBox, BrutalPressable, Card, ScreenHeader, haptic } from '../../../core/components/ui';
import { fetchBlockedUsers, unblockUser } from '../api/moderation';
import { Avatar } from '../components/Avatar';

type Blocked = { user_id: string; username: string };

export function BlockedUsersScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setUsers(await fetchBlockedUsers());
    } catch (e) {
      console.warn('[blocked] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unblock = (u: Blocked) => {
    Alert.alert(`Unblock ${u.username}?`, "You'll see their posts and comments again.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await unblockUser(u.user_id);
            haptic.success();
            setUsers((prev) => prev.filter((x) => x.user_id !== u.user_id));
          } catch (e: any) {
            Alert.alert('Could not unblock', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Blocked users" subtitle="Hidden from your community feed" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.user_id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 300)).duration(300)}>
              <Card style={styles.row}>
                <Avatar name={item.username} size={42} />
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.username}</Text>
                <BrutalPressable fill={colors.primary} offset={brutal.shadowSmall} borderWidth={brutal.borderThin} style={styles.btn} onPress={() => unblock(item)}>
                  <UserCheck color={colors.onPrimary} size={16} strokeWidth={2.5} />
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>Unblock</Text>
                </BrutalPressable>
              </Card>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
              <BrutalBox fill={colors.primarySoft} radius={24} style={styles.emptyIcon}>
                <ShieldOff color={colors.text} size={30} strokeWidth={2.4} />
              </BrutalBox>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No one is blocked</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You can block someone from the "…" menu on their post or from their profile.
              </Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 18, paddingTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 12 },
  name: { flex: 1, fontSize: 15.5, fontWeight: '900' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 40 },
  btnText: { fontSize: 13.5, fontWeight: '900' },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '900', marginTop: 16 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
});
