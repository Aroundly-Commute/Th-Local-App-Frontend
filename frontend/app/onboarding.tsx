import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Phone, Info } from 'lucide-react-native';
import { useAuth } from '../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../src/core/theme/theme';
import { tap, success, errorH } from '../src/core/utils/haptics';
import { api } from '../src/core/api/api';
import { Alert } from '../src/core/components/CustomAlert';
import { validatePhoneNumber } from '../src/core/utils/validation';

export default function OnboardingScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>((user?.gender as any) || 'Male');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNameChange = (text: string) => {
    const cleaned = text.replace(/[^A-Za-z\s]/g, '');
    if (cleaned.length <= 50) {
      setName(cleaned);
    }
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/(?!^\+)[^\d]/g, '');
    const maxLength = cleaned.startsWith('+') ? 13 : 10;
    if (cleaned.length <= maxLength) {
      setPhoneNumber(cleaned);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      errorH();
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your mobile number');
      errorH();
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMsg('Please enter a valid mobile number');
      errorH();
      return;
    }

    tap();
    setLoading(true);
    setErrorMsg('');

    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }

      // 1. Call API to update profile on backend database
      await api.patch('/auth/profile', {
        name: name.trim(),
        phoneNumber: formattedPhone,
        gender,
      });

      // 2. Save onboarding completed state to local storage
      await AsyncStorage.setItem(`onboarded_${user?.id || 'default'}`, 'true');

      success();
      await refresh();
      router.replace('/(tabs)');
    } catch (err: any) {
      errorH();
      console.error('[ONBOARDING] Update error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save onboarding details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Welcome to Aroundly!</Text>
            <Text style={[styles.subtitle, { color: t.textSecondary }]}>
              Let's complete your profile settings so you can start pooling with your community.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputFieldWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                <User color={t.textSecondary} size={18} />
                <TextInput
                  editable={!loading}
                  placeholder="Enter your name"
                  placeholderTextColor={t.textSecondary}
                  value={name}
                  onChangeText={handleNameChange}
                  style={[styles.inputField, { color: t.textPrimary }]}
                />
              </View>
            </View>

            {/* Mobile Number Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Mobile Number</Text>
              <View style={[styles.inputFieldWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Phone color={t.textSecondary} size={18} />
                <TextInput
                  editable={!loading}
                  placeholder="Enter mobile number"
                  placeholderTextColor={t.textSecondary}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  style={[styles.inputField, { color: t.textPrimary }]}
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Gender</Text>
              <View style={styles.genderContainer}>
                {(['Male', 'Female', 'Other'] as const).map((g) => {
                  const active = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      disabled={loading}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setGender(g);
                      }}
                      style={[
                        styles.genderBtn,
                        active
                          ? { backgroundColor: t.primary, borderColor: t.primary }
                          : { backgroundColor: t.surface, borderColor: t.border },
                        loading && { opacity: 0.6 }
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          { color: active ? t.primaryContrast : t.textSecondary },
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {errorMsg ? <Text style={[styles.error, { color: t.error }]}>{errorMsg}</Text> : null}

            {/* Save Profile CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={loading}
              style={[styles.cta, { backgroundColor: t.primary, opacity: loading ? 0.6 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color={t.primaryContrast} />
              ) : (
                <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Save and Enter</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
