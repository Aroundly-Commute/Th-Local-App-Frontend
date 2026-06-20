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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { User, Phone, Save, Building2, Briefcase, Mail, Lock, FileText } from 'lucide-react-native';
import { useAuth } from '../src/core/auth/auth';
import { lightTheme, spacing, radius } from '../src/core/theme/theme';
import { tap, success, errorH } from '../src/core/utils/haptics';
import { api } from '../src/core/api/api';
import { ScreenHeader } from '../src/core/components/ScreenHeader';
import { VerifiedAvatar } from '../src/core/components/VerifiedAvatar';
import { Alert } from '../src/core/components/CustomAlert';
import { validatePhoneNumber } from '../src/core/utils/validation';

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
  const { user, refresh } = useAuth();

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

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.xs,
  },
  avatarGridItem: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
  bioWrapper: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
  },
  bioInputField: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
