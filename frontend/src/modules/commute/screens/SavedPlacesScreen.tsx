import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Briefcase, MapPin, Trash2, Plus } from 'lucide-react-native';
import { api } from '../../../core/api/api';
import { lightTheme, spacing, radius } from '../../../core/theme/theme';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { LocationSearchModal } from '../components/search/LocationSearchModal';
import { tap, success, errorH } from '../../../core/utils/haptics';
import { Alert } from '../../../core/components/CustomAlert';

interface SavedPlace {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export default function SavedPlacesScreen() {
  const t = lightTheme;
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [selectedType, setSelectedType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [label, setLabel] = useState('Home');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Fetch saved places from backend
  const { data: places = [], isLoading } = useQuery<SavedPlace[]>({
    queryKey: ['saved-places'],
    queryFn: async () => {
      const { data } = await api.get('/saved-places');
      return data;
    },
  });

  // Create saved place mutation
  const createMutation = useMutation({
    mutationFn: async (newPlace: { label: string; address: string; latitude?: number; longitude?: number }) => {
      const { data } = await api.post('/saved-places', newPlace);
      return data;
    },
    onSuccess: () => {
      success();
      queryClient.invalidateQueries({ queryKey: ['saved-places'] });
      setSelectedType('Home');
      setLabel('Home');
      setAddress('');
      setLatitude(undefined);
      setLongitude(undefined);
    },
    onError: () => {
      errorH();
      Alert.alert('Error', 'Failed to save address. Please try again.');
    },
  });

  // Delete saved place mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/saved-places/${id}`);
    },
    onSuccess: () => {
      success();
      queryClient.invalidateQueries({ queryKey: ['saved-places'] });
    },
    onError: () => {
      errorH();
      Alert.alert('Error', 'Failed to delete saved place.');
    },
  });

  const handleAddPlace = async () => {
    tap();
    const cleanLabel = label.trim();
    const cleanAddress = address.trim();

    if (!cleanLabel) {
      Alert.alert('Label Required', 'Please enter a name for this place (e.g. Home, Work).');
      return;
    }
    if (!cleanAddress) {
      Alert.alert('Address Required', 'Please search and select a valid address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        label: cleanLabel,
        address: cleanAddress,
        latitude,
        longitude,
      });
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlace = (id: string, name: string) => {
    tap();
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            tap();
            deleteMutation.mutate(id);
          },
        },
      ]
    );
  };

  const getPlaceIcon = (placeLabel: string) => {
    const norm = placeLabel.toLowerCase().trim();
    if (norm === 'home') {
      return <Home size={18} color={t.primary} />;
    }
    if (norm === 'work' || norm === 'office' || norm === 'tcs') {
      return <Briefcase size={18} color={t.primary} />;
    }
    return <MapPin size={18} color={t.primary} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScreenHeader title="Saved Places" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Saved List Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Your Saved Places</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 20 }} />
          ) : places.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
              <MapPin size={24} color={t.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                No saved places yet. Add your Home, Work or frequent places below.
              </Text>
            </View>
          ) : (
            <View style={styles.placesList}>
              {places.map((place) => (
                <View
                  key={place.id}
                  style={[
                    styles.placeCard,
                    { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={async () => {
                      tap();
                      await AsyncStorage.setItem('@active_location', place.address);
                      router.back();
                    }}
                    activeOpacity={0.7}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: t.muted }]}>
                      {getPlaceIcon(place.label)}
                    </View>
                    <View style={styles.placeInfo}>
                      <Text style={[styles.placeLabel, { color: t.textPrimary }]}>{place.label}</Text>
                      <Text style={[styles.placeAddress, { color: t.textSecondary }]} numberOfLines={2}>
                        {place.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePlace(place.id, place.label)}
                    activeOpacity={0.7}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color={t.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Section */}
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: t.border, paddingTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Add New Place</Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Place Type</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.xs }}>
                {(['Home', 'Work', 'Other'] as const).map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        tap();
                        setSelectedType(type);
                        if (type === 'Home' || type === 'Work') {
                          setLabel(type);
                        } else {
                          setLabel('');
                        }
                      }}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: isSelected ? t.primary : t.border,
                        backgroundColor: isSelected ? t.primary : t.surfaceElevated,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      {type === 'Home' ? (
                        <Home size={14} color={isSelected ? '#FFFFFF' : t.textSecondary} />
                      ) : type === 'Work' ? (
                        <Briefcase size={14} color={isSelected ? '#FFFFFF' : t.textSecondary} />
                      ) : (
                        <MapPin size={14} color={isSelected ? '#FFFFFF' : t.textSecondary} />
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: isSelected ? '#FFFFFF' : t.textPrimary,
                        }}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedType === 'Other' && (
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="e.g. Gym, College, Parent's house"
                  placeholderTextColor={t.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      color: t.textPrimary,
                      backgroundColor: t.surfaceElevated,
                      borderColor: t.border,
                      marginTop: spacing.xs,
                    },
                  ]}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Search Address</Text>
              <TouchableOpacity
                onPress={() => {
                  tap();
                  setShowSearchModal(true);
                }}
                activeOpacity={0.8}
                style={{
                  height: 48,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surfaceElevated,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MapPin size={16} color={t.textSecondary} />
                <Text
                  style={{
                    color: address ? t.textPrimary : t.textSecondary,
                    fontSize: 14,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {address || 'Search and select address...'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAddPlace}
              disabled={isSubmitting}
              activeOpacity={0.8}
              style={[
                styles.saveButton,
                { backgroundColor: t.primary },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Place</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <LocationSearchModal
      visible={showSearchModal}
      value={address}
      placeholder="Search address..."
      t={t}
      onClose={() => setShowSearchModal(false)}
      onSelect={(name, lat, lng) => {
        setAddress(name);
        setLatitude(lat);
        setLongitude(lng);
      }}
    />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyCard: {
    padding: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  placesList: {
    gap: 10,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
  placeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  deleteButton: {
    padding: 8,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveButton: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
