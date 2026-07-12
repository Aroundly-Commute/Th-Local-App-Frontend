import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Phone } from 'lucide-react-native';
import { useAuth } from '../../../core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../../core/theme/theme';
import { tap, success, errorH } from '../../../core/utils/haptics';
import { api } from '../../../core/api/api';
import { validatePhoneNumber } from '../../../core/utils/validation';
import { translateFirebaseError } from '../../../core/utils/firebaseErrorHandler';
import { styles } from './Onboarding.styles';

export default function OnboardingScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user, refresh, sendPhoneOtp, linkPhoneOtp } = useAuth();

  // If the user's stored name looks like a phone number or placeholder, start with empty
  const isNamePhoneNumber = user?.name && (/^\+?\d+$/.test(user.name.trim()) || user.name.startsWith('Aroundler'));
  const [name, setName] = useState(isNamePhoneNumber ? '' : (user?.name || ''));
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>((user?.gender as any) || 'Male');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [confirmResult, setConfirmResult] = useState<any>(null);

  const cleanCurrentPhone = (user?.phoneNumber || '').trim();
  const cleanInputPhone = (() => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('+') ? trimmed : `+91${trimmed}`;
  })();
  const needsVerification = cleanInputPhone !== cleanCurrentPhone;

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
      setIsOtpSent(false);
      setOtpError('');
    }
  };

  const handleSendOtp = async () => {
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone) return;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }
    if (!validatePhoneNumber(formattedPhone)) {
      setErrorMsg('Please enter a valid mobile number');
      errorH();
      return;
    }

    tap();
    setVerifying(true);
    setOtpError('');
    setErrorMsg('');

    try {
      // 1. Check in our Postgres database first if the number is already taken by another account
      const checkRes = await api.get(`/auth/check-phone?phoneNumber=${encodeURIComponent(formattedPhone)}`);
      if (checkRes.data && checkRes.data.exists) {
        throw new Error('This phone number is already registered with another account');
      }

      // 2. Dispatch real Firebase OTP
      const confirmation = await sendPhoneOtp(formattedPhone);
      setConfirmResult(confirmation);
      setIsOtpSent(true);
      success();
    } catch (err: any) {
      errorH();
      setOtpError(translateFirebaseError(err) || 'Failed to send OTP code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmResult) {
      setOtpError('No active verification transaction found. Please restart.');
      return;
    }

    tap();
    setVerifying(true);
    setOtpError('');
    setErrorMsg('');

    try {
      await linkPhoneOtp(confirmResult, otpCode);
      success();
      setIsOtpSent(false);
      setOtpCode('');
      Alert.alert('Verified', 'Phone number verified and updated successfully!');
    } catch (err: any) {
      console.error('[ONBOARDING] handleVerifyOtp failed:', err);
      errorH();
      setOtpError(translateFirebaseError(err) || 'Invalid or expired OTP verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleSkip = async () => {
    tap();
    try {
      await AsyncStorage.setItem(`onboarded_${user?.id || 'default'}`, 'true');
      success();
      await refresh();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[ONBOARDING] Skip error:', err);
      router.replace('/(tabs)');
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
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }
    if (formattedPhone !== (user?.phoneNumber || '').trim()) {
      setErrorMsg('Please verify your phone number via OTP first');
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
          {/* Only show Skip button if user already has a valid name (e.g. Google/email signup).
              Phone-login users must provide their name — it's mandatory. */}
          {!isNamePhoneNumber && user?.name ? (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: 10 }}>
              <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: t.muted,
                }}
              >
                <Text style={{ fontSize: 13, color: t.textSecondary, fontWeight: '700' }}>Skip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ height: 10 }} />
          )}
          <View style={styles.header}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Image
                source={require('../../../../assets/images/app_Icon_less_padding.png')}
                style={{ width: 140, height: 110, resizeMode: 'contain' }}
              />
            </View>
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
                  editable={!loading && !isOtpSent}
                  placeholder="Enter mobile number"
                  placeholderTextColor={t.textSecondary}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  style={[styles.inputField, { color: t.textPrimary }]}
                />
                {needsVerification && !isOtpSent && (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={verifying || !phoneNumber.trim()}
                    style={{
                      backgroundColor: t.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 100,
                      justifyContent: 'center',
                    }}
                  >
                    {verifying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Verify</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Show OTP sending/verification errors here so they are visible even if OTP box is not shown yet */}
              {needsVerification && otpError ? (
                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '500', marginTop: 6 }}>{otpError}</Text>
              ) : null}

              {/* OTP Entry Field */}
              {needsVerification && isOtpSent && (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ fontSize: 12, color: t.textSecondary }}>
                      A 6-digit verification code has been dispatched to {phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.trim()}`}
                    </Text>
                    <TouchableOpacity onPress={() => { tap(); setIsOtpSent(false); setOtpCode(''); setOtpError(''); setConfirmResult(null); }}>
                      <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700', textDecorationLine: 'underline' }}>Edit Number</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.inputFieldWrapper, { flex: 1, backgroundColor: t.surface, borderColor: t.border }]}>
                      <TextInput
                        placeholder="OTP Code"
                        placeholderTextColor={t.textSecondary}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={[styles.inputField, { color: t.textPrimary }]}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      disabled={verifying || otpCode.length < 6}
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 16,
                        borderRadius: 100,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {verifying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Confirm</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
