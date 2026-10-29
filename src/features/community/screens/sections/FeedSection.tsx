// Main feed ('all') and the "Ask a scholar" feed ('ask'), both on top of the shared FeedList.
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BadgeCheck, Bookmark, Calendar, CircleHelp, LayoutGrid, MessageCircle, PenLine, Plus } from 'lucide-react-native';
import type { RootStackParamList } from '../../../../core/navigation/RootNavigator';
import { useAuth } from '../../../../core/hooks/useAuth';
import { useAppTheme } from '../../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../../core/theme/palettes';
import { BrutalPressable, haptic } from '../../../../core/components/ui';
import type { FeedQuery } from '../../api/feed';
import type { Post } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { FeedList } from '../../components/FeedList';
import type { SectionProps } from './types';

const INK = '#1C1A17';

type AllFilter = 'all' | 'discuss' | 'event' | 'saved';
type AskFilter = 'all' | 'answered' | 'open';

const ALL_FILTERS: { key: AllFilter; label: string; Icon: typeof Bookmark; tint: string }[] = [
  { key: 'all', label: 'All', Icon: LayoutGrid, tint: tints.green },
  { key: 'discuss', label: 'Discuss', Icon: MessageCircle, tint: tints.green },
  { key: 'event', label: 'Events talk', Icon: Calendar, tint: tints.blue },
  { key: 'saved', label: 'Saved', Icon: Bookmark, tint: tints.gold },
];

const ASK_FILTERS: { key: AskFilter; label: string; Icon: typeof Bookmark; tint: string }[] = [
  { key: 'all', label: 'All questions', Icon: CircleHelp, tint: tints.orange },
  { key: 'answered', label: 'Answered', Icon: BadgeCheck, tint: tints.gold },
  { key: 'open', label: 'Awaiting answer', Icon: MessageCircle, tint: tints.blue },
];

const answeredOnly = (p: Post) => p.answered;
const openOnly = (p: Post) => !p.answered;

export function FeedSection({ variant, header, bottomInset }: SectionProps & { variant: 'all' | 'ask' }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const [allFilter, setAllFilter] = useState<AllFilter>('all');
  const [askFilter, setAskFilter] = useState<AskFilter>('all');
  const ask = variant === 'ask';

  const query: Omit<FeedQuery, 'before'> = ask
    ? { category: 'ask' }
    : allFilter === 'saved' ? { saved: true }
      : allFilter === 'all' ? {} : { category: allFilter };

  const filter = ask ? (askFilter === 'answered' ? answeredOnly : askFilter === 'open' ? openOnly : undefined) : undefined;
  const compose = useCallback(() => {
    haptic.light();
    navigation.navigate('ComposePost', { category: ask ? 'ask' : allFilter === 'event' ? 'event' : 'discuss' });
  }, [navigation, ask, allFilter]);

  const chips = ask ? ASK_FILTERS : ALL_FILTERS;
  const activeKey = ask ? askFilter : allFilter;

  const listHeader = (
    <View>
      {header}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {chips.map((c) => {
          const on = c.key === activeKey;
          return (
            <BrutalPressable
              key={c.key}
              hapticOnPress={false}
              onPress={() => {
                haptic.select();
                if (ask) setAskFilter(c.key as AskFilter);
                else setAllFilter(c.key as AllFilter);
              }}
              radius={16}
              offset={on ? brutal.shadowSmall : 0}
              borderWidth={brutal.borderThin}
              fill={on ? c.tint : colors.surface}
              style={styles.chip}
            >
              <c.Icon color={on ? INK : colors.textSecondary} size={14} strokeWidth={2.5} />
              <Text style={[styles.chipText, { color: on ? INK : colors.text }]}>{c.label}</Text>
            </BrutalPressable>
          );
        })}
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.pad}>
        {ask ? (
          <View style={[styles.askNote, { backgroundColor: colors.accentSoft, borderColor: colors.ink }]}>
            <BadgeCheck color={INK} size={18} strokeWidth={2.4} />
            <Text style={styles.askNoteText}>Questions are answered by verified scholars. Their replies are pinned with a gold badge.</Text>
          </View>
        ) : null}
        <BrutalPressable onPress={compose} radius={22} style={styles.prompt}>
          <Avatar name={user?.username} color={user?.avatar_color} size={36} />
          <Text style={[styles.promptText, { color: colors.textMuted }]} numberOfLines={1}>
            {ask ? 'Ask a question about the deen…' : 'Share a reminder with the Ummah…'}
          </Text>
          <View style={[styles.promptIcon, { backgroundColor: colors.primary, borderColor: colors.ink }]}>
            <PenLine color={colors.onPrimary} size={16} strokeWidth={2.5} />
          </View>
        </BrutalPressable>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.flex}>
      <FeedList
        query={query}
        header={listHeader}
        cacheKey={`ummati_feed_cache_${variant}_${ask ? 'ask' : allFilter}`}
        bottomInset={bottomInset}
        live={!ask && allFilter === 'all'}
        filter={filter}
        emptyTitle={ask ? 'No questions yet' : allFilter === 'saved' ? 'No saved posts' : 'Nothing here yet'}
        emptyText={
          ask ? 'Have a question about the deen? Ask it and a scholar will answer, insha\'Allah.'
            : allFilter === 'saved' ? 'Tap the bookmark on any post to keep it here.'
              : 'Be the first to share a beneficial reminder.'
        }
      />
      <Animated.View entering={FadeInDown.delay(250).duration(350)} style={[styles.fabWrap, { bottom: bottomInset }]}>
        <BrutalPressable onPress={compose} fill={colors.primary} radius={27} style={styles.fab}>
          <Plus color={colors.onPrimary} size={20} strokeWidth={3} />
          <Text style={[styles.fabText, { color: colors.onPrimary }]}>{ask ? 'Ask a question' : 'Post'}</Text>
        </BrutalPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 18 },
  chips: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36 },
  chipText: { fontSize: 13, fontWeight: '800' },
  askNote: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 2, padding: 12, marginBottom: 14 },
  askNoteText: { flex: 1, color: INK, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, marginBottom: 18 },
  promptText: { flex: 1, fontSize: 15, fontWeight: '600' },
  promptIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  fabWrap: { position: 'absolute', right: 20 },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, height: 54 },
  fabText: { fontSize: 15.5, fontWeight: '900' },
});
