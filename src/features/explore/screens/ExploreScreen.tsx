import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Compass, BookOpen, Clock, Heart, PlayCircle, Calendar } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ExploreScreen() {
  const navigation = useNavigation<NavigationProp>();

  const exploreItems = [
    {
      title: '6 Kalimas',
      description: 'Declaration of Islamic faith with translation and recitation audio',
      icon: <BookOpen color={Theme.colors.primary} size={28} />,
      route: 'Kalimas' as const,
    },
    {
      title: '99 Names of Allah',
      description: 'Read and listen to the beautiful names of Allah and their meanings',
      icon: <Heart color="#EC4899" size={28} />,
      route: 'NamesOfAllah' as const,
    },
    {
      title: 'Daily Duas',
      description: 'Collection of prayers and supplications for every daily occasion',
      icon: <Clock color="#3B82F6" size={28} />,
      route: 'Duas' as const,
    },
    {
      title: 'Live Kaaba & Madina',
      description: 'Watch 24/7 live video streamings from Masjid al-Haram & Al-Masjid an-Nabawi',
      icon: <PlayCircle color="#EF4444" size={28} />,
      route: 'LiveStreams' as const,
    },
    {
      title: 'Naat & Mankabat',
      description: 'Listen to beautiful audio recitations praising Prophet Muhammad (PBUH)',
      icon: <Compass color={Theme.colors.accent} size={28} />,
      route: 'Naats' as const,
    },
    {
      title: 'Islamic Calendar',
      description: 'Check dynamic Hijri months, important dates, and upcoming holidays',
      icon: <Calendar color="#10B981" size={28} />,
      route: 'Calendar' as const,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Islam</Text>
        <Text style={styles.subtitle}>Discover prayers, live streams, and Islamic knowledge tools</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {exploreItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.cardIconBox}>{item.icon}</View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 18,
    marginBottom: 16,
    gap: 16,
  },
  cardIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextBox: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
