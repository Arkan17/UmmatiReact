import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';

const ISLAMIC_EVENTS = [
  { name: 'Islamic New Year (1 Muharram)', desc: 'Marks the start of the Hijri year', date: 'Jul 26, 2026' },
  { name: 'Ashura (10 Muharram)', desc: 'Commemorates the day Musa (AS) crossed the Red Sea', date: 'Aug 4, 2026' },
  { name: 'Mawlid al-Nabi (12 Rabi\' al-Awwal)', desc: 'Birthday of Prophet Muhammad (PBUH)', date: 'Oct 5, 2026' },
  { name: 'Laylat al-Qadr (27 Ramadan)', desc: 'The Night of Power, Quran first revealed', date: 'Feb 15, 2027' },
  { name: 'Eid al-Fitr (1 Shawwal)', desc: 'Festival celebrating the end of Ramadan fast', date: 'Feb 19, 2027' },
  { name: 'Hajj Pilgrimage (8-12 Dhu al-Hijjah)', desc: 'Annual pilgrimage to Makkah', date: 'Apr 25, 2027' },
  { name: 'Day of Arafah (9 Dhu al-Hijjah)', desc: 'Most important day of Hajj', date: 'Apr 26, 2027' },
  { name: 'Eid al-Adha (10 Dhu al-Hijjah)', desc: 'Festival of Sacrifice honoring Ibrahim (AS)', date: 'Apr 27, 2027' },
];

export function CalendarScreen() {
  const navigation = useNavigation();
  const [gregDate, setGregDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');

  // Simple astronomical tabular Islamic calendar conversion
  const calculateHijriDate = (date: Date) => {
    const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
    const l = Math.floor(jd) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    let l_rest = l - 10631 * n + 354;
    const j = Math.floor((10985 - l_rest) / 5316) * Math.floor((50 - l_rest) / 5600) + Math.floor(l_rest / 5600);
    l_rest = l_rest - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 30) * 178121 + 30;
    const h_y = 30 * n + j - 30;
    const h_m = Math.floor((24 * l_rest) / 709);
    const h_d = l_rest - Math.floor((709 * h_m) / 24);
    
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' ath-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    return `${h_d} ${hijriMonths[h_m - 1]} ${h_y} AH`;
  };

  useEffect(() => {
    const now = new Date();
    setGregDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setHijriDate(calculateHijriDate(now));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Islamic Calendar</Text>
        <View style={styles.placeholderWidth} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Today's Dual Calendar Widget */}
        <View style={styles.todayCard}>
          <Calendar color={Theme.colors.accent} size={32} style={styles.calendarIcon} />
          <View style={styles.todayTextBox}>
            <Text style={styles.todayLabel}>Today's Date</Text>
            <Text style={styles.todayHijri}>{hijriDate}</Text>
            <Text style={styles.todayGreg}>{gregDate}</Text>
          </View>
        </View>

        {/* Upcoming Islamic Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionHeader}>Upcoming Hijri Dates & Holidays</Text>
          
          <View style={styles.timeline}>
            {ISLAMIC_EVENTS.map((event, idx) => (
              <View key={event.name} style={styles.timelineItem}>
                {/* Visual node line */}
                <View style={styles.timelineVisual}>
                  <View style={styles.timelineNode} />
                  {idx < ISLAMIC_EVENTS.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                
                {/* Event info card */}
                <View style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                  <Text style={styles.eventDesc}>{event.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  placeholderWidth: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    margin: 20,
    padding: 20,
    gap: 16,
  },
  calendarIcon: {},
  todayTextBox: {
    gap: 4,
    flex: 1,
  },
  todayLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  todayHijri: {
    color: Theme.colors.accent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  todayGreg: {
    color: Theme.colors.text,
    fontSize: 14,
  },
  eventsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  timelineVisual: {
    alignItems: 'center',
    width: 16,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.border,
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Theme.colors.border,
    marginTop: 6,
  },
  eventCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 14,
    gap: 6,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventName: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  eventDate: {
    color: Theme.colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
