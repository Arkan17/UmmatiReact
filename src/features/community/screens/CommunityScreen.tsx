// Community hub (bottom tab): hero header with a rotating daily reminder, notification bell and
// a section switcher. Each section renders its own list with this header on top.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, BookOpenCheck, Calendar, HandHeart, HelpCircle, MessageCircle, ShieldCheck, Trophy, Users } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { brutal, tints } from '../../../core/theme/palettes';
import { BrutalPressable, GlassCard, HeaderButton, ScreenHeader, haptic } from '../../../core/components/ui';
import { useMyRole } from '../hooks/useCommunityGate';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { todaysReminder } from '../utils/reminders';
import { ChallengesSection } from './sections/ChallengesSection';
import { DuaWallSection } from './sections/DuaWallSection';
import { EventsSection } from './sections/EventsSection';
import { FeedSection } from './sections/FeedSection';
import { GroupsSection } from './sections/GroupsSection';
import { KhatamSection } from './sections/KhatamSection';

type SectionKey = 'feed' | 'ask' | 'duas' | 'khatam' | 'events' | 'groups' | 'challenges';

const SECTIONS: { key: SectionKey; label: string; Icon: typeof Bell; tint: string; subtitle: string }[] = [
  { key: 'feed', label: 'Feed', Icon: MessageCircle, tint: tints.green, subtitle: 'Connect. Share. Grow.' },
  { key: 'duas', label: 'Dua Wall', Icon: HandHeart, tint: tints.rose, subtitle: 'Pray for one another' },
  { key: 'khatam', label: 'Khatam', Icon: BookOpenCheck, tint: tints.teal, subtitle: 'Finish the Quran together' },
  { key: 'challenges', label: 'Challenges', Icon: Trophy, tint: tints.gold, subtitle: 'Grow together this week' },
  { key: 'events', label: 'Events', Icon: Calendar, tint: tints.blue, subtitle: 'Gatherings near you' },
  { key: 'groups', label: 'Groups', Icon: Users, tint: tints.violet, subtitle: 'Halaqas, masjids & families' },
  { key: 'ask', label: 'Ask', Icon: HelpCircle, tint: tints.orange, subtitle: 'Questions answered by scholars' },
];

const INK = '#1C1A17';

export function CommunityScreen() {
  useScreenTime('Community');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const role = useMyRole();
  const { count: unread } = useUnreadNotifications();
  const [section, setSection] = useState<SectionKey>('feed');
  const active = SECTIONS.find((s) => s.key === section)!;
  const reminder = todaysReminder();
  // Floating tab bar height (see RootNavigator) + breathing room
  const bottomInset = Math.max(insets.bottom, 12) + 68 + 16;

  const header = (
    <View>
      <ScreenHeader
        title="Community"
        subtitle={active.subtitle}
        right={
          <View style={styles.headerBtns}>
            {role === 'admin' ? (
              <HeaderButton onPress={() => navigation.navigate('Moderation')}>
                <ShieldCheck color={colors.onSky} size={19} />
              </HeaderButton>
            ) : null}
            <HeaderButton onPress={() => navigation.navigate('CommunityNotifications')}>
              <Bell color={colors.onSky} size={19} />
              {unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.ink }]}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </HeaderButton>
          </View>
        }
      >
        {section === 'feed' ? (
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <GlassCard style={styles.reminder}>
              <Text style={[styles.reminderLabel, { color: colors.onSkyMuted }]}>TODAY'S REMINDER</Text>
              <Text style={[styles.reminderText, { color: colors.onSky }]}>“{reminder.text}”</Text>
              <Text style={[styles.reminderSource, { color: colors.onSkyMuted }]}>— {reminder.source}</Text>
            </GlassCard>
          </Animated.View>
        ) : null}
      </ScreenHeader>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SECTIONS.map((s) => {
          const on = s.key === section;
          return (
            <BrutalPressable
              key={s.key}
              hapticOnPress={false}
              onPress={() => { haptic.select(); setSection(s.key); }}
              radius={20}
              offset={on ? brutal.shadowSmall : 0}
              borderWidth={brutal.borderThin}
              fill={on ? s.tint : colors.surface}
              style={styles.chip}
            >
              <View style={[styles.chipIcon, { backgroundColor: on ? colors.surface : s.tint, borderColor: colors.ink }]}>
                <s.Icon color={INK} size={13} strokeWidth={2.6} />
              </View>
              <Text style={[styles.chipText, { color: on ? INK : colors.text }]}>{s.label}</Text>
            </BrutalPressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const props = { header, bottomInset };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {section === 'feed' && <FeedSection key="feed" variant="all" {...props} />}
      {section === 'ask' && <FeedSection key="ask" variant="ask" {...props} />}
      {section === 'duas' && <DuaWallSection {...props} />}
      {section === 'khatam' && <KhatamSection {...props} />}
      {section === 'challenges' && <ChallengesSection {...props} />}
      {section === 'events' && <EventsSection {...props} />}
      {section === 'groups' && <GroupsSection {...props} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtns: { flexDirection: 'row', gap: 10 },
  badge: { position: 'absolute', top: -7, right: -7, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  badgeText: { color: INK, fontSize: 10.5, fontWeight: '900' },
  reminder: { marginTop: 16 },
  reminderLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  reminderText: { fontSize: 15.5, lineHeight: 22, fontWeight: '700', marginTop: 6 },
  reminderSource: { fontSize: 12.5, fontWeight: '700', marginTop: 6 },
  chips: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6, gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 14, height: 42 },
  chipIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: '900' },
});
