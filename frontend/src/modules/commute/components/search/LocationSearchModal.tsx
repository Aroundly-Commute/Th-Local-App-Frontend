import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search as SearchIcon, ChevronLeft, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../../../core/api/api';
import { spacing, radius, Theme } from '../../../../core/theme/theme';
import { tap, success, errorH } from '../../../../core/utils/haptics';
import { Alert } from '../../../../core/components/CustomAlert';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  placeholder: string;
  onSelect: (name: string, lat: number, lng: number) => void;
  t: Theme;
}

export function LocationSearchModal({
  visible,
  onClose,
  value,
  placeholder,
  onSelect,
  t,
}: LocationSearchModalProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value, visible]);

  const search = async (text: string) => {
    if (!text || text.length < 3) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await api.get(`/locations/suggest?q=${encodeURIComponent(text)}`);
      setPredictions(resp.data);
    } catch (e) {
      console.error(e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(text), 400);
  };

  const handleSelect = async (item: any) => {
    setLoading(true);
    try {
      const resp = await api.get(`/locations/details?place_id=${item.id}`);
      if (resp.data && !resp.data.error) {
        const { lat, lng } = resp.data;
        onSelect(item.place_name, lat, lng);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    try {
      tap();
      
      // 1. Check if `@current_location_data` exists in AsyncStorage
      const cachedStr = await AsyncStorage.getItem('@current_location_data');
      if (cachedStr) {
        try {
          const cachedData = JSON.parse(cachedStr);
          if (cachedData && cachedData.address && cachedData.latitude && cachedData.longitude) {
            onSelect(cachedData.address, cachedData.latitude, cachedData.longitude);
            success();
            onClose();
            return;
          }
        } catch (e) {
          console.warn('Failed to parse cached location data:', e);
        }
      }

      // 2. If not present, check foreground permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus !== 'granted') {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        if (requestStatus !== 'granted') {
          errorH();
          Alert.alert(
            'Permission Required',
            'Location permission is missing. Please grant location permission in your device settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Grant Permission',
                onPress: () => {
                  Linking.openSettings().catch((err) =>
                    console.error('Failed to open settings:', err)
                  );
                },
              },
            ]
          );
          return;
        }
      }

      // 3. Permission is granted, fetch the current position
      setLocLoading(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      let placeName = 'Current Location';
      try {
        if (Platform.OS === 'web') {
          const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              placeName = data.results[0].formatted_address;
            }
          }
        } else {
          const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            const namePart = addr.name || addr.street || '';
            const districtPart = addr.district || addr.subregion || '';
            const cityPart = addr.city || addr.region || '';
            const parts = [namePart, districtPart, cityPart].filter(Boolean);
            placeName = parts.join(', ') || 'Current Location';
          }
        }
      } catch (e) {
        // Fallback
      }

      // Cache it for next time
      await AsyncStorage.setItem('@current_location', placeName);
      await AsyncStorage.setItem(
        '@current_location_data',
        JSON.stringify({ address: placeName, latitude, longitude })
      );

      onSelect(placeName, latitude, longitude);
      success();
      onClose();
    } catch (err: any) {
      errorH();
      Alert.alert('Error', 'Failed to get current location: ' + err.message);
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'bottom']}>
        {/* Header with back and search input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <ChevronLeft color={t.textPrimary} size={24} />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: t.muted,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <SearchIcon color={t.textSecondary} size={16} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={handleChange}
              placeholder={placeholder}
              placeholderTextColor={t.textSecondary}
              style={{ flex: 1, color: t.textPrimary, fontSize: 15, marginLeft: 8, padding: 0 }}
            />
            {query ? (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setPredictions([]);
                }}
              >
                <X color={t.textSecondary} size={16} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.md }}>
          {/* Current Location option */}
          <TouchableOpacity
            onPress={handleCurrentLocation}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: t.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color={t.primary} />
              ) : (
                <MapPin color={t.primary} size={16} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                {locLoading ? 'Locating...' : 'Use Current Location'}
              </Text>
              <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                Pin your coordinates from your GPS
              </Text>
            </View>
          </TouchableOpacity>

          {/* Loading spinner for predictions */}
          {loading && <ActivityIndicator size="small" color={t.primary} style={{ marginVertical: 16 }} />}

          {/* Search Suggestions */}
          {predictions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: t.border,
                gap: 12,
              }}
              onPress={() => handleSelect(item)}
            >
              <MapPin size={16} color={t.textSecondary} />
              <Text style={{ fontSize: 14, color: t.textPrimary, flex: 1 }} numberOfLines={2}>
                {item.place_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
