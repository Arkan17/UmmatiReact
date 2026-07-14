import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, BookOpen, AlertCircle, RefreshCw } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SurahListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSurahList = async (forceRefresh = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cached = await AsyncStorage.getItem('ummati_cached_surah_list');
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        setSurahs(parsed);
        setFilteredSurahs(parsed);
        setLoading(false);
        return;
      }

      // Fetch from AlQuran Cloud
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const json = await response.json();

      if (json.code === 200 && json.data) {
        setSurahs(json.data);
        setFilteredSurahs(json.data);
        await AsyncStorage.setItem('ummati_cached_surah_list', JSON.stringify(json.data));
      } else {
        setErrorMsg('Invalid API response structure.');
      }
    } catch (e: any) {
      console.warn('Error fetching Surahs:', e);
      setErrorMsg('Failed to connect to Quran API. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurahList();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredSurahs(surahs);
      return;
    }
    
    const lowerText = text.toLowerCase();
    const filtered = surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(lowerText) ||
        s.englishNameTranslation.toLowerCase().includes(lowerText) ||
        s.name.includes(text) ||
        s.number.toString() === text
    );
    setFilteredSurahs(filtered);
  };

  const renderSurahCard = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('QuranReading', {
          surahNumber: item.number,
          surahName: item.englishName,
          translationName: item.englishNameTranslation,
        })
      }
    >
      <View style={styles.cardLeft}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.surahNameEng}>{item.englishName}</Text>
          <Text style={styles.surahSubText}>
            {item.revelationType === 'Meccan' ? '🕋' : '🕌'} • {item.numberOfAyahs} Ayahs
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.surahNameAr}>{item.name}</Text>
        <Text style={styles.surahTransEng}>{item.englishNameTranslation}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>The Holy Quran</Text>
        <Text style={styles.subtitle}>Read and contemplate the words of Allah</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color={Theme.colors.textMuted} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Surah name or number..."
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
      </View>

      {/* List / Loader / Error */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Quran Index...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <AlertCircle color={Theme.colors.error} size={48} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadSurahList(true)}>
            <RefreshCw color={Theme.colors.white} size={16} />
            <Text style={styles.refreshBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahCard}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen color={Theme.colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No Surahs found matching "{searchQuery}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    gap: 8,
  },
  refreshBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 16,
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  numberText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  metaBox: {
    gap: 4,
  },
  surahNameEng: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  surahSubText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  surahNameAr: {
    color: Theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Georgia',
  },
  surahTransEng: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
