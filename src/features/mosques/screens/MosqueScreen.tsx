import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { ArrowLeft, MapPin, Plus, Edit } from 'lucide-react-native';
import { useAuth } from '../../../core/hooks/useAuth';
import { useLocation } from '../../../core/hooks/useLocation';
import { Theme } from '../../../core/theme/theme';
import { supabase } from '../../../core/config/SupabaseClient';
import { useNavigation } from '@react-navigation/native';

interface Mosque {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
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

export function MosqueScreen() {
  const { user } = useAuth();
  const { latitude, longitude, loading: locationLoading } = useLocation();

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

  // New Mosque Form Inputs
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [addingState, setAddingState] = useState(false);

  // Update Timings Form Inputs
  const [fajr, setFajr] = useState('');
  const [dhuhr, setDhuhr] = useState('');
  const [asr, setAsr] = useState('');
  const [maghrib, setMaghrib] = useState('');
  const [isha, setIsha] = useState('');
  const [jummah, setJummah] = useState('');
  const [updatingState, setUpdatingState] = useState(false);

  // Fetch mosques & inner timings from Supabase
  const loadMosques = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch mosques
      const { data: mosquesData, error: mosquesError } = await supabase
        .from('mosques')
        .select('*');

      if (mosquesError) throw mosquesError;

      // Fetch timings
      const { data: timingsData, error: timingsError } = await supabase
        .from('mosque_timings')
        .select('*');

      if (timingsError) throw timingsError;

      // Merge and calculate distances
      const merged: Mosque[] = (mosquesData || []).map((mosque: any) => {
        const timings = (timingsData || []).find((t: any) => t.mosque_id === mosque.id);
        const distance = calculateDistance(latitude, longitude, mosque.latitude, mosque.longitude);
        
        return {
          id: mosque.id,
          name: mosque.name,
          address: mosque.address,
          latitude: mosque.latitude,
          longitude: mosque.longitude,
          distance,
          timings: timings ? {
            fajr: timings.fajr,
            dhuhr: timings.dhuhr,
            asr: timings.asr,
            maghrib: timings.maghrib,
            isha: timings.isha,
            jummah: timings.jummah,
          } : undefined
        };
      });

      // Sort by proximity
      merged.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setMosques(merged);
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

  // Insert a new mosque in Supabase
  const handleAddMosque = async () => {
    if (!newName.trim() || !newAddress.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all inputs.');
      return;
    }
    
    setAddingState(true);
    try {
      // 1. Insert mosque
      const { data: mosque, error: mosqueError } = await supabase
        .from('mosques')
        .insert({
          name: newName.trim(),
          address: newAddress.trim(),
          latitude: latitude,
          longitude: longitude,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (mosqueError) throw mosqueError;

      // 2. Initialize default timings
      const { error: timingError } = await supabase
        .from('mosque_timings')
        .insert({
          mosque_id: mosque.id,
          fajr: '05:15',
          dhuhr: '13:30',
          asr: '17:00',
          maghrib: '19:15',
          isha: '20:45',
          jummah: '13:30',
          updated_by: user?.id || null,
        });

      if (timingError) throw timingError;

      Alert.alert('Success', 'Thank you for adding this mosque!');
      setShowAddModal(false);
      setNewName('');
      setNewAddress('');
      loadMosques();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save mosque to directory.');
    } finally {
      setAddingState(false);
    }
  };

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

  // Update timings in database
  const handleUpdateTimings = async () => {
    if (!selectedMosque) return;
    
    setUpdatingState(true);
    try {
      const { error } = await supabase
        .from('mosque_timings')
        .upsert(
          {
            mosque_id: selectedMosque.id,
            fajr,
            dhuhr,
            asr,
            maghrib,
            isha,
            jummah,
            updated_by: user?.id || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'mosque_id' }
        );

      if (error) throw error;

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

  // Format timings safely
  const renderTimingBlock = (label: string, time: string | undefined) => (
    <View style={styles.timeBlock}>
      <Text style={styles.timeBlockLabel}>{label}</Text>
      <Text style={styles.timeBlockVal}>{time || '--:--'}</Text>
    </View>
  );

  const renderMosqueCard = ({ item }: { item: Mosque }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBox}>
          <MapPin color={Theme.colors.primary} size={20} />
          <Text style={styles.mosqueName} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={styles.distanceText}>{item.distance} km away</Text>
      </View>
      
      <Text style={styles.mosqueAddr} numberOfLines={2}>{item.address}</Text>

      {/* Timings row grid */}
      <View style={styles.timingsRow}>
        {renderTimingBlock('Fajr', item.timings?.fajr)}
        {renderTimingBlock('Dhuhr', item.timings?.dhuhr)}
        {renderTimingBlock('Asr', item.timings?.asr)}
        {renderTimingBlock('Maghrib', item.timings?.maghrib)}
        {renderTimingBlock('Isha', item.timings?.isha)}
        {renderTimingBlock('Jummah', item.timings?.jummah)}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.updateCardBtn} onPress={() => openUpdateModal(item)}>
        <Edit color={Theme.colors.primary} size={16} />
        <Text style={styles.updateCardBtnText}>Update Jamat Times</Text>
      </TouchableOpacity>
    </View>
  );

  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Mosques Directory</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.backBtn}>
          <Plus color={Theme.colors.primary} size={24} />
        </TouchableOpacity>
      </View>

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
              <Text style={styles.loadingText}>Fetching database directory...</Text>
            </View>
          ) : (
            <FlatList
              data={mosques}
              renderItem={renderMosqueCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MapPin color={Theme.colors.textMuted} size={48} />
                  <Text style={styles.emptyText}>No mosques registered nearby yet.</Text>
                  <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addFirstBtnText}>Add First Mosque</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* 1. Add Mosque Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Mosque Nearby</Text>
            <Text style={styles.modalDesc}>
              This will register a new mosque at your current coordinates: ({latitude.toFixed(4)}, {longitude.toFixed(4)}).
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Mosque Name (e.g. Masjid Al-Rahman)"
              placeholderTextColor={Theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Mosque Address / Area details"
              placeholderTextColor={Theme.colors.textMuted}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleAddMosque}
                disabled={addingState}
              >
                {addingState ? (
                  <ActivityIndicator color={Theme.colors.white} />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Register Mosque</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Update Timings Modal */}
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
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  mosqueName: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  distanceText: {
    color: Theme.colors.accent,
    fontSize: 13,
    fontWeight: 'bold',
  },
  mosqueAddr: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    paddingLeft: 28,
  },
  timingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeBlockLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  timeBlockVal: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  updateCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    gap: 6,
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
  addFirstBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
  },
  addFirstBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  modalDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    height: 48,
    paddingHorizontal: 12,
    color: Theme.colors.text,
    fontSize: 15,
    marginBottom: 16,
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
});
