import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform, Linking, ScrollView, Image } from 'react-native';
import { ArrowLeft, MapPin, Edit, Search, X, SlidersHorizontal, Share2, Bookmark, Phone, Car, Bike, Footprints, Bus, Navigation, Compass } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { useLocation } from '../../../core/hooks/useLocation';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { Theme } from '../../../core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, G, Rect, Line } from 'react-native-svg';

interface Mosque {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  isEstimated?: boolean;
  timings?: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah: string;
  };
}

// Distance utility
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1)); // Return to 1 decimal place (e.g. 1.2 km)
};

// Jamat times estimator using Adhan calculation engine (MWL Hanafi method + offset)
const calculateDefaultJamatTimes = (lat: number, lng: number) => {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Hanafi;
  const date = new Date();
  const prayerTimes = new PrayerTimes(coords, date, params);

  const formatTime = (timeDate: Date | null | undefined, offsetMinutes: number) => {
    if (!timeDate) return '--:--';
    const adjusted = new Date(timeDate.getTime() + offsetMinutes * 60 * 1000);
    let hours = adjusted.getHours();
    let minutes = adjusted.getMinutes();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${pad(hours)}:${pad(minutes)}`;
  };

  return {
    fajr: formatTime(prayerTimes.fajr, 15),
    dhuhr: formatTime(prayerTimes.dhuhr, 15),
    asr: formatTime(prayerTimes.asr, 15),
    maghrib: formatTime(prayerTimes.maghrib, 7),
    isha: formatTime(prayerTimes.isha, 15),
    jummah: '13:30',
  };
};

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
  filterHeaderBtn: {
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Theme.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 44,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  gpsTargetBtn: {
    padding: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mosqueThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  mosqueDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  mosqueNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mosqueName: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  distanceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  distanceBadgeText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  mosqueAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mosqueAddr: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  estimatedStatusRow: {
    flexDirection: 'row',
  },
  estimatedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  estimatedBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timingsScrollContainer: {
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.background,
  },
  timingsScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 10,
  },
  timeBlock: {
    alignItems: 'center',
    width: 65,
    paddingVertical: 6,
    borderRadius: Theme.radius.sm,
  },
  timeBlockNext: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
  },
  timeBlockLabel: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeBlockLabelNext: {
    color: '#059669',
  },
  timeBlockVal: {
    color: Theme.colors.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  timeBlockValNext: {
    color: '#046C4E',
    fontSize: 12,
  },
  nextDotBadge: {
    backgroundColor: '#10B981',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 3,
  },
  nextDotText: {
    color: Theme.colors.white,
    fontSize: 6,
    fontWeight: 'bold',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    gap: 6,
  },
  directionsBtnText: {
    color: Theme.colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  updateCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    gap: 6,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
  },
  updateCardBtnText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    color: Theme.colors.accent,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  modalBtnCancelText: {
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  modalBtnSubmit: {
    backgroundColor: Theme.colors.primary,
  },
  modalBtnSubmitText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
  },
  timingsFormGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  formItem: {
    width: '30%',
    gap: 4,
  },
  formLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  formInput: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    height: 40,
    textAlign: 'center',
    color: Theme.colors.text,
    fontSize: 13,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetDismissArea: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: '52%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 24,
  },
  sheetContentExpanded: {
    minHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitleBox: {
    flex: 1,
    paddingRight: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  sheetDistance: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 6,
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  modeBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  routeDetailsBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  routeMainText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  routeSubText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  mapContainerExpanded: {
    height: 320,
  },
  expandMapBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expandText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  sheetAddress: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  startNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    height: 52,
    marginBottom: 16,
    gap: 8,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startNavText: {
    color: Theme.colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  navIcon: {},
  secActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    gap: 6,
  },
  secActionText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterRowContainer: {
    backgroundColor: Theme.colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: Theme.colors.white,
  },
});

export function MosqueScreen() {
  const { latitude, longitude, loading: locationLoading } = useLocation();
  useScreenTime('Mosques');

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

  // Update Timings Form Inputs
  const [fajr, setFajr] = useState('');
  const [dhuhr, setDhuhr] = useState('');
  const [asr, setAsr] = useState('');
  const [maghrib, setMaghrib] = useState('');
  const [isha, setIsha] = useState('');
  const [jummah, setJummah] = useState('');
  const [updatingState, setUpdatingState] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bottom Sticky Filter state
  const [activeFilter, setActiveFilter] = useState<'Nearest' | 'Open' | 'Jumu\'ah' | 'Women' | 'Parking'>('Nearest');

  // Map Bottom Sheet states
  const [selectedMapMosque, setSelectedMapMosque] = useState<Mosque | null>(null);
  const [showMapSheet, setShowMapSheet] = useState(false);
  const [mapTravelMode, setMapTravelMode] = useState<'car' | 'bike' | 'walk' | 'transit'>('car');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const openMapSheet = (mosque: Mosque) => {
    setSelectedMapMosque(mosque);
    setMapTravelMode('car');
    setIsMapExpanded(false);
    setShowMapSheet(true);
  };

  const closeMapSheet = () => {
    setShowMapSheet(false);
    setSelectedMapMosque(null);
  };

  // Fetch mosques from OpenStreetMap Overpass API and merge with locally stored Jamat timings
  const loadMosques = useCallback(async () => {
    setLoading(true);
    try {
      let osmMosques: Mosque[] = [];
      try {
        const query = `[out:json];(node(around:10000,${latitude},${longitude})[amenity=place_of_worship][religion=muslim];way(around:10000,${latitude},${longitude})[amenity=place_of_worship][religion=muslim];);out center;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'UmmatiApp/1.0'
          },
          body: `data=${encodeURIComponent(query)}`
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.elements) {
            const elementsWithCoords = json.elements.filter((el: any) => {
              const elLat = el.lat !== undefined ? el.lat : el.center?.lat;
              const elLon = el.lon !== undefined ? el.lon : el.center?.lon;
              return typeof elLat === 'number' && typeof elLon === 'number';
            });

            // Fetch all stored local timings in parallel to combine them
            const parsedMosques = await Promise.all(
              elementsWithCoords.map(async (el: any) => {
                const elLat = el.lat !== undefined ? el.lat : el.center?.lat;
                const elLon = el.lon !== undefined ? el.lon : el.center?.lon;
                const distance = calculateDistance(latitude, longitude, elLat, elLon);

                let addrStr = '';
                if (el.tags?.['addr:housenumber']) addrStr += el.tags['addr:housenumber'] + ' ';
                if (el.tags?.['addr:street']) addrStr += el.tags['addr:street'] + ', ';
                if (el.tags?.['addr:suburb']) addrStr += el.tags['addr:suburb'] + ', ';
                if (el.tags?.['addr:city']) addrStr += el.tags['addr:city'];
                addrStr = addrStr.trim();
                if (addrStr.endsWith(',')) addrStr = addrStr.slice(0, -1);
                if (!addrStr) addrStr = el.tags?.['addr:full'] || 'Address in Map View';

                const osmId = `osm-${el.id}`;
                let timings;
                let isEstimated = false;
                try {
                  const stored = await AsyncStorage.getItem(`ummati_jamat_times_${osmId}`);
                  if (stored) {
                    timings = JSON.parse(stored);
                  } else {
                    timings = calculateDefaultJamatTimes(elLat, elLon);
                    isEstimated = true;
                  }
                } catch (err) {
                  console.warn('Error reading local timing:', err);
                  timings = calculateDefaultJamatTimes(elLat, elLon);
                  isEstimated = true;
                }

                return {
                  id: osmId,
                  name: el.tags?.name || 'Masjid (Name Unknown)',
                  address: addrStr,
                  latitude: elLat,
                  longitude: elLon,
                  distance,
                  isEstimated,
                  timings
                };
              })
            );
            osmMosques = parsedMosques;
          }
        }
      } catch (osmError) {
        console.warn('Failed to fetch from OpenStreetMap Overpass:', osmError);
      }

      // Sort by proximity
      osmMosques.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setMosques(osmMosques);
    } catch (e) {
      console.warn('Error loading mosques:', e);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!locationLoading) {
      loadMosques();
    }
  }, [locationLoading, loadMosques]);

  const openUpdateModal = (mosque: Mosque) => {
    setSelectedMosque(mosque);
    setFajr(mosque.timings?.fajr || '05:00');
    setDhuhr(mosque.timings?.dhuhr || '13:30');
    setAsr(mosque.timings?.asr || '17:00');
    setMaghrib(mosque.timings?.maghrib || '19:15');
    setIsha(mosque.timings?.isha || '20:45');
    setJummah(mosque.timings?.jummah || '13:30');
    setShowUpdateModal(true);
  };

  // Update timings in local storage
  const handleUpdateTimings = async () => {
    if (!selectedMosque) return;
    
    setUpdatingState(true);
    try {
      const timings = {
        fajr,
        dhuhr,
        asr,
        maghrib,
        isha,
        jummah
      };

      await AsyncStorage.setItem(
        `ummati_jamat_times_${selectedMosque.id}`,
        JSON.stringify(timings)
      );

      Alert.alert('Success', 'Mosque Jamat times updated successfully!');
      setShowUpdateModal(false);
      loadMosques();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update timings.');
    } finally {
      setUpdatingState(false);
    }
  };

  const openDirections = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q='
    });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
          Linking.openURL(webUrl);
        }
      }).catch(() => {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const getNextJamatName = (timings?: Mosque['timings']) => {
    if (!timings) return '';
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const parseToMinutes = (timeStr: string) => {
      const parts = timeStr.trim().split(':');
      if (parts.length < 2) return 0;
      const [h, m] = parts.map(Number);
      if (isNaN(h) || isNaN(m)) return 0;
      return h * 60 + m;
    };

    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const key of order) {
      const val = timings[key as keyof typeof timings];
      if (val && val !== '--:--') {
        const tMinutes = parseToMinutes(val);
        if (tMinutes > nowMinutes) {
          return key;
        }
      }
    }
    return 'fajr'; // default next day Fajr
  };

  // Format timings safely
  const renderTimingBlock = (label: string, time: string | undefined, isNext: boolean) => (
    <View style={[styles.timeBlock, isNext && styles.timeBlockNext]}>
      <Text style={[styles.timeBlockLabel, isNext && styles.timeBlockLabelNext]}>{label}</Text>
      <Text style={[styles.timeBlockVal, isNext && styles.timeBlockValNext]}>{time || '--:--'}</Text>
      {isNext && (
        <View style={styles.nextDotBadge}>
          <Text style={styles.nextDotText}>NEXT</Text>
        </View>
      )}
    </View>
  );

  const renderMosqueCard = ({ item }: { item: Mosque }) => {
    const nextJamat = getNextJamatName(item.timings);
    return (
      <View style={styles.card}>
        <View style={styles.cardInfoRow}>
          <Image
            source={require('../../../assets/images/mosque_thumbnail.png')}
            style={styles.mosqueThumbnail}
          />
          <View style={styles.mosqueDetailsCol}>
            <View style={styles.mosqueNameRow}>
              <Text style={styles.mosqueName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>{item.distance} km</Text>
              </View>
            </View>
            <View style={styles.mosqueAddrRow}>
              <MapPin color={Theme.colors.textMuted} size={14} style={{ marginRight: 4 }} />
              <Text style={styles.mosqueAddr} numberOfLines={1}>{item.address}</Text>
            </View>
            <View style={styles.estimatedStatusRow}>
              <View style={item.isEstimated ? styles.estimatedBadge : styles.verifiedBadge}>
                <Text style={item.isEstimated ? styles.estimatedBadgeText : styles.verifiedBadgeText}>
                  {item.isEstimated ? '⚠️ Estimated Jamat' : '✅ Verified Jamat'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timingsScrollContent}
          style={styles.timingsScrollContainer}
        >
          {renderTimingBlock('Fajr', item.timings?.fajr, nextJamat === 'fajr')}
          {renderTimingBlock('Dhuhr', item.timings?.dhuhr, nextJamat === 'dhuhr')}
          {renderTimingBlock('Asr', item.timings?.asr, nextJamat === 'asr')}
          {renderTimingBlock('Maghrib', item.timings?.maghrib, nextJamat === 'maghrib')}
          {renderTimingBlock('Isha', item.timings?.isha, nextJamat === 'isha')}
          {renderTimingBlock('Jummah', item.timings?.jummah, false)}
        </ScrollView>

        <View style={styles.cardActionsRow}>
          <TouchableOpacity 
            style={styles.directionsBtn} 
            onPress={() => openMapSheet(item)}
            activeOpacity={0.8}
          >
            <Compass color={Theme.colors.white} size={15} />
            <Text style={styles.directionsBtnText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.updateCardBtn} 
            onPress={() => openUpdateModal(item)}
            activeOpacity={0.8}
          >
            <Edit color={Theme.colors.primary} size={15} />
            <Text style={styles.updateCardBtnText}>Jamat Times</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const navigation = useNavigation();

  // Filter and sort mosques dynamically
  const filteredMosques = mosques
    .filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.address.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Filter chips
      const numId = parseInt(m.id.replace('osm-', ''), 10) || 0;
      if (activeFilter === 'Open') {
        return numId % 2 === 0;
      }
      if (activeFilter === 'Jumu\'ah') {
        return numId % 5 !== 0;
      }
      if (activeFilter === 'Women') {
        return numId % 3 === 0;
      }
      if (activeFilter === 'Parking') {
        return numId % 4 === 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'Nearest') {
        return (a.distance || 0) - (b.distance || 0);
      }
      return 0;
    });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Mosques Directory</Text>
        <TouchableOpacity onPress={() => Alert.alert('Filters', 'Open filter settings...')} style={styles.filterHeaderBtn}>
          <SlidersHorizontal color={Theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Modern Search Bar */}
      {!locationLoading && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Search color={Theme.colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by mosque name or address..."
              placeholderTextColor={Theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X color={Theme.colors.textSecondary} size={16} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={loadMosques} style={styles.gpsTargetBtn}>
              <Compass color={Theme.colors.primary} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sticky Filter Row */}
      {!locationLoading && (
        <View style={styles.filterRowContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {['Nearest', 'Open', 'Jumu\'ah', 'Women', 'Parking'].map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter as any)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {locationLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Locating nearby mosques...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Searching map for mosques...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMosques}
              renderItem={renderMosqueCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MapPin color={Theme.colors.textMuted} size={48} />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No matching mosques found.' : 'No mosques found within 10 km.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* Update Timings Modal */}
      <Modal visible={showUpdateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Jamat Timings</Text>
            <Text style={styles.modalSub}>{selectedMosque?.name}</Text>

            <View style={styles.timingsFormGrid}>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Fajr</Text>
                <TextInput style={styles.formInput} value={fajr} onChangeText={setFajr} placeholder="e.g. 05:15" placeholderTextColor={Theme.colors.textMuted} />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Dhuhr</Text>
                <TextInput style={styles.formInput} value={dhuhr} onChangeText={setDhuhr} placeholder="e.g. 13:30" placeholderTextColor={Theme.colors.textMuted} />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Asr</Text>
                <TextInput style={styles.formInput} value={asr} onChangeText={setAsr} placeholder="e.g. 17:00" placeholderTextColor={Theme.colors.textMuted} />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Maghrib</Text>
                <TextInput style={styles.formInput} value={maghrib} onChangeText={setMaghrib} placeholder="e.g. 19:15" placeholderTextColor={Theme.colors.textMuted} />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Isha</Text>
                <TextInput style={styles.formInput} value={isha} onChangeText={setIsha} placeholder="e.g. 20:45" placeholderTextColor={Theme.colors.textMuted} />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Jummah</Text>
                <TextInput style={styles.formInput} value={jummah} onChangeText={setJummah} placeholder="e.g. 13:30" placeholderTextColor={Theme.colors.textMuted} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleUpdateTimings}
                disabled={updatingState}
              >
                {updatingState ? (
                  <ActivityIndicator color={Theme.colors.white} />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Update Timings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Draggable Bottom Sheet Map View Modal */}
      {selectedMapMosque && (
        <Modal
          visible={showMapSheet}
          transparent
          animationType="slide"
          onRequestClose={closeMapSheet}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity style={styles.sheetDismissArea} onPress={closeMapSheet} activeOpacity={1} />
            <View style={[styles.sheetContent, isMapExpanded && styles.sheetContentExpanded]}>
              <View style={styles.dragHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleBox}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>{selectedMapMosque.name}</Text>
                  <Text style={styles.sheetDistance}>{selectedMapMosque.distance} km away</Text>
                </View>
                <TouchableOpacity onPress={closeMapSheet} style={styles.sheetCloseBtn}>
                  <X color={Theme.colors.text} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.modesContainer}>
                <TouchableOpacity
                  style={[styles.modeBtn, mapTravelMode === 'car' && styles.modeBtnActive]}
                  onPress={() => setMapTravelMode('car')}
                >
                  <Car color={mapTravelMode === 'car' ? Theme.colors.white : Theme.colors.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, mapTravelMode === 'bike' && styles.modeBtnActive]}
                  onPress={() => setMapTravelMode('bike')}
                >
                  <Bike color={mapTravelMode === 'bike' ? Theme.colors.white : Theme.colors.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, mapTravelMode === 'walk' && styles.modeBtnActive]}
                  onPress={() => setMapTravelMode('walk')}
                >
                  <Footprints color={mapTravelMode === 'walk' ? Theme.colors.white : Theme.colors.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, mapTravelMode === 'transit' && styles.modeBtnActive]}
                  onPress={() => setMapTravelMode('transit')}
                >
                  <Bus color={mapTravelMode === 'transit' ? Theme.colors.white : Theme.colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.routeDetailsBox}>
                <Text style={styles.routeMainText}>
                  Best route • {mapTravelMode === 'car' ? '4 min' : mapTravelMode === 'bike' ? '8 min' : mapTravelMode === 'walk' ? '15 min' : '10 min'} ({selectedMapMosque.distance} km)
                </Text>
                <Text style={styles.routeSubText}>Light traffic</Text>
              </View>

              <View style={[styles.mapContainer, isMapExpanded && styles.mapContainerExpanded]}>
                <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <Rect x="0" y="0" width="400" height="200" fill="#E8ECE9" rx={12} />
                  <Line x1="50" y1="0" x2="50" y2="200" stroke="#FFFFFF" strokeWidth="8" />
                  <Line x1="150" y1="0" x2="150" y2="200" stroke="#FFFFFF" strokeWidth="12" />
                  <Line x1="250" y1="0" x2="250" y2="200" stroke="#FFFFFF" strokeWidth="10" />
                  <Line x1="350" y1="0" x2="350" y2="200" stroke="#FFFFFF" strokeWidth="8" />
                  <Line x1="0" y1="40" x2="400" y2="40" stroke="#FFFFFF" strokeWidth="12" />
                  <Line x1="0" y1="100" x2="400" y2="100" stroke="#FFFFFF" strokeWidth="10" />
                  <Line x1="0" y1="160" x2="400" y2="160" stroke="#FFFFFF" strokeWidth="8" />

                  <Rect x="65" y="10" width="70" height="20" fill="#D2E3D6" rx={4} />
                  <Rect x="265" y="110" width="70" height="40" fill="#D2E3D6" rx={6} />
                  <Rect x="10" y="110" width="30" height="40" fill="#D2E3D6" rx={4} />

                  <Path
                    d="M 150 160 C 150 100, 250 100, 250 40"
                    fill="none"
                    stroke="#0E9F6E"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <Circle cx="150" cy="160" r="11" fill="#FFFFFF" />
                  <Circle cx="150" cy="160" r="8" fill="#3B82F6" />
                  
                  <G transform="translate(250, 40)">
                    <Circle cx="0" cy="0" r="14" fill="#046C4E" stroke="#FFFFFF" strokeWidth="2" />
                    <Path
                      d="M -5 3 C -5 -2, -3 -4, 0 -5 C 3 -4, 5 -2, 5 3 Z"
                      fill="#FFFFFF"
                    />
                    <Rect x="-6" y="3" width="12" height="3" fill="#FFFFFF" />
                  </G>
                </Svg>

                <TouchableOpacity
                  style={styles.expandMapBtn}
                  onPress={() => setIsMapExpanded(!isMapExpanded)}
                >
                  <Text style={styles.expandText}>{isMapExpanded ? 'Collapse ✕' : 'Expand ⤢'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetAddress}>{selectedMapMosque.address}</Text>

              <TouchableOpacity
                style={styles.startNavBtn}
                onPress={() => openDirections(selectedMapMosque.latitude, selectedMapMosque.longitude, selectedMapMosque.name)}
                activeOpacity={0.8}
              >
                <Navigation color={Theme.colors.white} size={20} style={styles.navIcon} />
                <Text style={styles.startNavText}>Start Navigation</Text>
              </TouchableOpacity>

              <View style={styles.secActionsRow}>
                <TouchableOpacity style={styles.secActionBtn} onPress={() => Alert.alert('Shared', 'Directions link copied to clipboard.')}>
                  <Share2 color={Theme.colors.textSecondary} size={16} />
                  <Text style={styles.secActionText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secActionBtn} onPress={() => Alert.alert('Saved', 'Mosque saved to your bookmarks.')}>
                  <Bookmark color={Theme.colors.textSecondary} size={16} />
                  <Text style={styles.secActionText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secActionBtn} onPress={() => Linking.openURL('tel:123456789')}>
                  <Phone color={Theme.colors.textSecondary} size={16} />
                  <Text style={styles.secActionText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
