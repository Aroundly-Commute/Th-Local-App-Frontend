import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Car, ChevronLeft, Shield, CheckCircle2, UserCheck, Plus } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { Alert } from '../../src/core/components/CustomAlert';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';

export default function Vehicles() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user, login } = useAuth(); // login or me call can refresh user details

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState<'CAR' | 'BIKE'>('CAR');
  const [capacity, setCapacity] = useState<number>(5);
  const [fuelType, setFuelType] = useState<'CNG' | 'PETROL' | 'DIESEL'>('PETROL');

  const [existingVehicle, setExistingVehicle] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/vehicle');
        if (data) {
          setExistingVehicle(data);
          setVehicleNumber(data.vehicleNumber || '');
          setType(data.type === 'BIKE' ? 'BIKE' : 'CAR');
          setCapacity(data.capacity || (data.type === 'BIKE' ? 2 : 5));
          setFuelType((data.fuelType?.toUpperCase() || 'PETROL') as any);
        }
      } catch (err) {
        console.error('Failed to fetch vehicle:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When type changes, auto-set appropriate capacities
  const handleTypeChange = (newType: 'CAR' | 'BIKE') => {
    tap();
    setType(newType);
    if (newType === 'BIKE') {
      setCapacity(2);
      setFuelType('PETROL'); // Bikes generally default to Petrol
    } else {
      setCapacity(5);
    }
  };

  const handleSave = async () => {
    if (!vehicleNumber.trim()) {
      errorH();
      Alert.alert('Validation Error', 'Please enter your vehicle license plate number.');
      return;
    }

    setSaving(true);
    tap();
    try {
      const payload = {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        type,
        capacity,
        fuelType,
      };

      const { data } = await api.post('/auth/vehicle', payload);
      setExistingVehicle(data);
      success();
      Alert.alert('Success', 'Your vehicle details have been saved successfully!');
      
      // Go back
      router.back();
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save vehicle details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        <TouchableOpacity onPress={() => { tap(); router.back(); }} style={styles.backBtn}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>My Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
          
          {existingVehicle ? (
            <View style={[styles.activeCard, { backgroundColor: t.isDark ? '#0f1f17' : '#EAF5EC', borderColor: t.success }]}>
              <CheckCircle2 color={t.success} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.success, fontWeight: '800', fontSize: 15 }}>Active Registered Vehicle</Text>
                <Text style={{ color: t.textPrimary, fontSize: 13, marginTop: 4, fontWeight: '600' }}>
                  {existingVehicle.vehicleNumber} • {existingVehicle.type} • {existingVehicle.capacity} Seater ({existingVehicle.fuelType})
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.activeCard, { backgroundColor: t.isDark ? '#231515' : '#FDF3F3', borderColor: t.error }]}>
              <Car color={t.error} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.error, fontWeight: '800', fontSize: 15 }}>No Vehicle Registered</Text>
                <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 2 }}>
                  Please register your vehicle details below to start offering rides and estimating fares.
                </Text>
              </View>
            </View>
          )}

          {/* Section 1: Vehicle Type */}
          <Text style={[styles.label, { color: t.textSecondary, marginTop: spacing.lg }]}>VEHICLE TYPE</Text>
          <View style={[styles.segmentContainer, { backgroundColor: t.muted }]}>
            <TouchableOpacity
              onPress={() => handleTypeChange('CAR')}
              activeOpacity={0.8}
              style={[styles.segmentBtn, type === 'CAR' && { backgroundColor: t.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }]}
            >
              <Car color={type === 'CAR' ? t.primary : t.textSecondary} size={18} />
              <Text style={[styles.segmentLabel, { color: type === 'CAR' ? t.textPrimary : t.textSecondary, fontWeight: type === 'CAR' ? '700' : '500' }]}>Car</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTypeChange('BIKE')}
              activeOpacity={0.8}
              style={[styles.segmentBtn, type === 'BIKE' && { backgroundColor: t.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }]}
            >
              {/* Simple Custom Bike representation */}
              <Text style={{ fontSize: 15, marginRight: 6 }}>🏍️</Text>
              <Text style={[styles.segmentLabel, { color: type === 'BIKE' ? t.textPrimary : t.textSecondary, fontWeight: type === 'BIKE' ? '700' : '500' }]}>Bike</Text>
            </TouchableOpacity>
          </View>

          {/* Section 2: Seating Capacity */}
          <Text style={[styles.label, { color: t.textSecondary, marginTop: spacing.xl }]}>SEATING CAPACITY (seats)</Text>
          {type === 'CAR' ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { tap(); setCapacity(5); }}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  { borderColor: capacity === 5 ? t.primary : t.border, backgroundColor: t.surface },
                ]}
              >
                <Text style={[styles.optionValue, { color: capacity === 5 ? t.primary : t.textPrimary }]}>5</Text>
                <Text style={[styles.optionLabel, { color: t.textSecondary }]}>Standard Sedan/Hatchback</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { tap(); setCapacity(7); }}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  { borderColor: capacity === 7 ? t.primary : t.border, backgroundColor: t.surface },
                ]}
              >
                <Text style={[styles.optionValue, { color: capacity === 7 ? t.primary : t.textPrimary }]}>7</Text>
                <Text style={[styles.optionLabel, { color: t.textSecondary }]}>Premium SUV/MPV</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.optionCard, { borderColor: t.border, backgroundColor: t.surface, alignSelf: 'flex-start', width: '48%' }]}>
              <Text style={[styles.optionValue, { color: t.primary }]}>2</Text>
              <Text style={[styles.optionLabel, { color: t.textSecondary }]}>Driver + Rider</Text>
            </View>
          )}

          {/* Section 3: Fuel Type */}
          <Text style={[styles.label, { color: t.textSecondary, marginTop: spacing.xl }]}>FUEL TYPE</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {type === 'CAR' && (
              <TouchableOpacity
                onPress={() => { tap(); setFuelType('CNG'); }}
                activeOpacity={0.8}
                style={[
                  styles.fuelChip,
                  {
                    borderColor: fuelType === 'CNG' ? t.primary : t.border,
                    backgroundColor: fuelType === 'CNG' ? t.isDark ? '#142a1d' : '#E8F5E9' : t.surface,
                  },
                ]}
              >
                <Text style={[styles.fuelText, { color: fuelType === 'CNG' ? t.primary : t.textPrimary }]}>CNG</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => { tap(); setFuelType('PETROL'); }}
              activeOpacity={0.85}
              style={[
                styles.fuelChip,
                {
                  borderColor: fuelType === 'PETROL' ? t.primary : t.border,
                  backgroundColor: fuelType === 'PETROL' ? t.isDark ? '#142a1d' : '#E8F5E9' : t.surface,
                },
              ]}
            >
              <Text style={[styles.fuelText, { color: fuelType === 'PETROL' ? t.primary : t.textPrimary }]}>Petrol</Text>
            </TouchableOpacity>
            {type === 'CAR' && (
              <TouchableOpacity
                onPress={() => { tap(); setFuelType('DIESEL'); }}
                activeOpacity={0.8}
                style={[
                  styles.fuelChip,
                  {
                    borderColor: fuelType === 'DIESEL' ? t.primary : t.border,
                    backgroundColor: fuelType === 'DIESEL' ? t.isDark ? '#142a1d' : '#E8F5E9' : t.surface,
                  },
                ]}
              >
                <Text style={[styles.fuelText, { color: fuelType === 'DIESEL' ? t.primary : t.textPrimary }]}>Diesel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Section 4: Vehicle Plate Number */}
          <Text style={[styles.label, { color: t.textSecondary, marginTop: spacing.xl }]}>LICENSE PLATE NUMBER</Text>
          <View style={[styles.inputContainer, { backgroundColor: t.muted, borderColor: t.border }]}>
            <TextInput
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. DL 3C AY 9876"
              placeholderTextColor={t.textSecondary}
              autoCapitalize="characters"
              style={[styles.input, { color: t.textPrimary }]}
            />
          </View>

          <Text style={[styles.hint, { color: t.textTertiary, marginTop: 8 }]}>
            🔒 Your vehicle number is encrypted and only shared with verified passengers once they request a ride.
          </Text>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
            style={[styles.saveBtn, { backgroundColor: t.primary, marginTop: 40 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Vehicle Details</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.xs + 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    gap: 2,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm + 2,
  },
  segmentLabel: {
    fontSize: 13,
  },
  optionCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: 4,
  },
  optionValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  fuelChip: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
  },
  fuelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputContainer: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hint: {
    fontSize: 11,
    lineHeight: 14,
  },
  saveBtn: {
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
