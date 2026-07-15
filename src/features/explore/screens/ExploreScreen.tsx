import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, Dimensions } from 'react-native';
import { Compass, BookOpen, Clock, Heart, PlayCircle, Calendar, Smile, Search, X } from 'lucide-react-native';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2; // 40 horizontal padding, 12 gap

export function ExploreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'multimedia', label: 'Multimedia' },
    { id: 'kids', label: 'Kids' },
    { id: 'utilities', label: 'Utilities' },
  ];

  const exploreItems = [
    {
      title: '6 Kalimas',
      description: 'Declaration of faith with translation & audio recitations',
      icon: <BookOpen color={Theme.colors.primary} size={28} />,
      route: 'Kalimas' as const,
      category: 'knowledge',
      badge: 'Essential',
      iconBg: 'rgba(14, 159, 110, 0.1)',
    },
    {
      title: '99 Names of Allah',
      description: 'Read and listen to the beautiful names and meanings',
      icon: <Heart color="#EC4899" size={28} />,
      route: 'NamesOfAllah' as const,
      category: 'knowledge',
      badge: 'Names',
      iconBg: 'rgba(236, 72, 153, 0.1)',
    },
    {
      title: 'Daily Duas',
      description: 'Collection of prayers and supplications for every occasion',
      icon: <Clock color="#3B82F6" size={28} />,
      route: 'Duas' as const,
      category: 'knowledge',
      badge: 'Supplication',
      iconBg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Live Kaaba & Madina',
      description: 'Watch 24/7 live video streamings from Holy Mosques',
      icon: <PlayCircle color="#EF4444" size={28} />,
      route: 'LiveStreams' as const,
      category: 'multimedia',
      badge: 'LIVE',
      iconBg: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Naat & Mankabat',
      description: 'Listen to beautiful audio praises of Prophet Muhammad (PBUH)',
      icon: <Compass color={Theme.colors.accent} size={28} />,
      route: 'Naats' as const,
      category: 'multimedia',
      badge: 'Audio',
      iconBg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Islamic Calendar',
      description: 'Check dynamic Hijri months, important dates, and holidays',
      icon: <Calendar color="#10B981" size={28} />,
      route: 'Calendar' as const,
      category: 'utilities',
      badge: 'Hijri',
      iconBg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Kids Islamic Corner',
      description: 'Stories, step-by-step guides for Wudu & Salah, and quizzes',
      icon: <Smile color="#FF9F43" size={28} />,
      route: 'KidsSection' as const,
      category: 'kids',
      badge: 'INTERACTIVE',
      iconBg: 'rgba(255, 159, 67, 0.1)',
    },
  ];

  const filteredItems = exploreItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredItem = filteredItems[0];
  const gridItems = filteredItems.slice(1);

  return (
    <View style={styles.container}>
      {/* Top Glow Background */}
      <View style={styles.topGlow} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Islam</Text>
        <Text style={styles.subtitle}>Discover prayers, live streams, and Islamic knowledge tools</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search color={Theme.colors.textMuted} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools, prayers..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon} activeOpacity={0.7}>
              <X color={Theme.colors.textMuted} size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                ]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive ? styles.categoryTextActive : styles.categoryTextInactive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Explore Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color={Theme.colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No Tools Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or category filter</Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFilterBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Featured Section */}
            {featuredItem && (
              <View style={styles.featuredSection}>
                <Text style={styles.sectionLabel}>FEATURED TOOL</Text>
                <TouchableOpacity
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate(featuredItem.route)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.featuredTopBar,
                    featuredItem.badge === 'LIVE' ? styles.featuredTopBarLive : styles.featuredTopBarDefault
                  ]} />

                  <View style={styles.featuredRow}>
                    <View style={[styles.cardIconBox, { backgroundColor: featuredItem.iconBg }]}>
                      {featuredItem.icon}
                    </View>
                    <View style={styles.featuredTextBox}>
                      <View style={styles.featuredHeaderRow}>
                        <Text style={styles.featuredBadge}>
                          {featuredItem.badge}
                        </Text>
                      </View>
                      <Text style={styles.featuredTitle}>{featuredItem.title}</Text>
                      <Text style={styles.featuredDesc}>{featuredItem.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Grid Section */}
            {gridItems.length > 0 && (
              <View style={styles.gridSection}>
                <Text style={styles.sectionLabel}>ALL TOOLS</Text>
                <View style={styles.gridContainer}>
                  {gridItems.map((item) => (
                    <TouchableOpacity
                      key={item.title}
                      style={styles.gridCard}
                      onPress={() => navigation.navigate(item.route)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.gridCardHeader}>
                        <View style={[styles.cardIconBoxSmall, { backgroundColor: item.iconBg }]}>
                          {React.cloneElement(item.icon, { size: 20 })}
                        </View>
                        {item.badge && (
                          <Text
                            style={[
                              styles.gridBadge,
                              item.badge === 'LIVE' ? styles.gridBadgeLive :
                              item.badge === 'INTERACTIVE' ? styles.gridBadgeInteractive :
                              styles.gridBadgeDefault
                            ]}
                          >
                            {item.badge}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.gridCardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.gridCardDesc} numberOfLines={2}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#E6F4EA', // Light mint green top glow matching home screen glow concept
    opacity: 0.5,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 16,
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
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 48,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
    height: '100%',
    padding: 0,
  },
  clearIcon: {
    padding: 4,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.round,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryPillInactive: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  categoryTextActive: {
    color: Theme.colors.white,
  },
  categoryTextInactive: {
    color: Theme.colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Safe distance from bottom navigation bar
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 6,
  },
  featuredSection: {
    marginBottom: 20,
  },
  featuredCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  featuredTopBarLive: {
    backgroundColor: '#EF4444',
  },
  featuredTopBarDefault: {
    backgroundColor: Theme.colors.primary,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIconBox: {
    width: 60,
    height: 60,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconBoxSmall: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredTextBox: {
    flex: 1,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  featuredBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    backgroundColor: 'rgba(14, 159, 110, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 2,
  },
  featuredDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  gridSection: {
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    textTransform: 'uppercase',
  },
  gridBadgeLive: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  gridBadgeInteractive: {
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  gridBadgeDefault: {
    color: Theme.colors.textSecondary,
    backgroundColor: 'rgba(71, 85, 105, 0.06)',
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  clearFilterBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Theme.radius.sm,
    marginTop: 8,
  },
  clearFilterBtnText: {
    color: Theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

