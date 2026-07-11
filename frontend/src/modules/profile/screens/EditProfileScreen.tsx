import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { User, Phone, Save, Building2, Briefcase, Mail, Lock, FileText } from 'lucide-react-native';
import { useAuth } from '../../../core/auth/auth';
import { lightTheme, spacing } from '../../../core/theme/theme';
import { tap, success, errorH } from '../../../core/utils/haptics';
import { api } from '../../../core/api/api';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';
import { Alert } from '../../../core/components/CustomAlert';
import { validatePhoneNumber } from '../../../core/utils/validation';
import { translateFirebaseError } from '../../../core/utils/firebaseErrorHandler';
import { styles } from './EditProfile.styles';

const AVATARS = {
  Male: [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Jack',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Charlie',
  ],
  Female: [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Lily',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Maya',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Zoe',
  ],
  Other: [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Sparky',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Buster',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Coco',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Gizmo',
  ],
};

export default function EditProfileScreen() {
  const t = lightTheme;
  const router = useRouter();
  const { user, refresh, sendPhoneOtp, linkPhoneOtp } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(() => {
    const rawGender = user?.gender;
    if (!rawGender) return 'Male';
    const capitalized = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();
    if (capitalized === 'Male' || capitalized === 'Female' || capitalized === 'Other') {
      return capitalized as 'Male' | 'Female' | 'Other';
    }
    return 'Male';
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [society, setSociety] = useState(user?.society || '');
  const [workplace, setWorkplace] = useState(user?.workplace || '');
  const [bio, setBio] = useState(user?.bio || '');
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
      console.error('[EDIT_PROFILE] handleVerifyOtp failed:', err);
      errorH();
      setOtpError(translateFirebaseError(err) || 'Invalid or expired OTP verification code');
    } finally {
      setVerifying(false);
    }
  };


  const handleGenderChange = (selectedGender: 'Male' | 'Female' | 'Other') => {
    tap();
    setGender(selectedGender);
    const defaultAvatar = AVATARS[selectedGender][0];
    setAvatarUrl(defaultAvatar);
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

      await api.patch('/auth/profile', {
        name: name.trim(),
        phoneNumber: formattedPhone,
        gender,
        avatarUrl: avatarUrl,
        society: society.trim(),
        workplace: workplace.trim(),
        bio: bio.trim(),
      });

      success();
      await refresh();
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          },
        },
      ]);
    } catch (err: any) {
      errorH();
      console.error('[EDIT_PROFILE] Save error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Edit Profile" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          {/* Avatar Preview Section */}
          <View style={styles.avatarSection}>
            <VerifiedAvatar uri={avatarUrl || undefined} name={name} verified={user?.is_verified} t={t} size={110} />
          </View>

          <View style={styles.form}>
            {/* Avatar Selector Grid */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Select Avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATARS[gender].map((uri, idx) => {
                  const isSelected = avatarUrl === uri;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setAvatarUrl(uri);
                      }}
                      style={[
                        styles.avatarGridItem,
                        isSelected
                          ? { borderColor: t.success, borderWidth: 3 }
                          : { borderColor: t.border, borderWidth: 1 }
                      ]}
                    >
                      <Image source={{ uri }} style={styles.gridAvatarImage} contentFit="cover" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Email Address (Read-Only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Email Address (Read-Only)</Text>
              <View style={[styles.inputFieldWrapper, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
                <Mail color={t.textTertiary} size={18} />
                <TextInput
                  value={user?.email || 'No email registered'}
                  editable={false}
                  style={[styles.inputField, { color: t.textSecondary }]}
                />
                <Lock color={t.textTertiary} size={16} />
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputFieldWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                <User color={t.textSecondary} size={18} />
                <TextInput
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
                      activeOpacity={0.8}
                      onPress={() => handleGenderChange(g)}
                      style={[
                        styles.genderBtn,
                        active
                          ? { backgroundColor: t.primary, borderColor: t.primary }
                          : { backgroundColor: t.surface, borderColor: t.border },
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

            {/* Bio Input */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Bio</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: t.textTertiary }}>{bio.length}/120</Text>
              </View>
              <View style={[styles.inputFieldWrapper, styles.bioWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                <FileText color={t.textSecondary} size={18} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
                <TextInput
                  placeholder="Share a short bio (e.g. Quiet commuter, loves podcasts...)"
                  placeholderTextColor={t.textSecondary}
                  value={bio}
                  onChangeText={(text) => {
                    if (text.length <= 120) {
                      setBio(text);
                    }
                  }}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputField, styles.bioInputField, { color: t.textPrimary }]}
                />
              </View>
            </View>

            {/* Society / Apartment Input */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Society / Apartment Name</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: t.textTertiary }}>{society.length}/50</Text>
              </View>
              <View style={[styles.inputFieldWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Building2 color={t.textSecondary} size={18} />
                <TextInput
                  placeholder="e.g. Green Valley Society"
                  placeholderTextColor={t.textSecondary}
                  value={society}
                  onChangeText={(text) => {
                    if (text.length <= 50) {
                      setSociety(text);
                    }
                  }}
                  style={[styles.inputField, { color: t.textPrimary }]}
                />
              </View>
            </View>

            {/* Workplace / Office Input */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Workplace / Office</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: t.textTertiary }}>{workplace.length}/50</Text>
              </View>
              <View style={[styles.inputFieldWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Briefcase color={t.textSecondary} size={18} />
                <TextInput
                  placeholder="e.g. Acme Corp, Outer Ring Road"
                  placeholderTextColor={t.textSecondary}
                  value={workplace}
                  onChangeText={(text) => {
                    if (text.length <= 50) {
                      setWorkplace(text);
                    }
                  }}
                  style={[styles.inputField, { color: t.textPrimary }]}
                />
              </View>
            </View>

            {errorMsg ? <Text style={[styles.error, { color: t.error }]}>{errorMsg}</Text> : null}

            {/* Save Changes CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={loading}
              style={[styles.cta, { backgroundColor: t.primary }]}
            >
              {loading ? (
                <ActivityIndicator color={t.primaryContrast} />
              ) : (
                <>
                  <Save size={16} color={t.primaryContrast} />
                  <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
