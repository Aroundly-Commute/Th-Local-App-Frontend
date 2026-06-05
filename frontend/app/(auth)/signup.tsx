import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Image
} from 'react-native';

import { useRouter } from 'expo-router';
import { Mail, Lock, User as UserIcon, ChevronLeft, ShieldAlert, MailCheck } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success, errorH } from '../../src/core/utils/haptics';

import auth from '../../src/core/auth/firebaseAdapter';
import { translateFirebaseError } from '../../src/core/utils/firebaseErrorHandler';

export default function Signup() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  // Details Entry State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Email Verification UI State
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Phase 1: Submit email/password registration to Firebase
  const onSignup = async () => {
    setErr('');
    if (!email || !password || !name) {
      setErr('Please fill in all the details');
      errorH();
      return;
    }

    if (password.length < 6) {
      setErr('Password must be at least 6 characters long');
      errorH();
      return;
    }

    tap();
    setLoading(true);

    try {
      console.log(`[AUTH] Dispatching email registration to Firebase: ${email}...`);

      // Calls our upgraded auth context which creates Firebase account & sends email verification
      await signup(email.trim(), password, name.trim(), role);

      success();
      setIsVerifyingEmail(true);
      setResendTimer(59);
    } catch (e: any) {
      errorH();
      console.error('[AUTH] Email signup exception:', e);
      setErr(translateFirebaseError(e));
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Check if user completed email inbox verification
  const checkEmailVerificationStatus = async () => {
    tap();
    setLoading(true);
    setErr('');

    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        // Reload Firebase user profile to fetch fresh verification state
        await currentUser.reload();

        const isVerified = currentUser.emailVerified;
        console.log(`[AUTH] Email verification status check: ${isVerified}`);

        if (isVerified) {
          success();
          console.log('[AUTH] Email verified successfully! Syncing session...');

          // Get secure session ID token
          const token = await currentUser.getIdToken();

          // Sync profile details into Postgres cleanly
          await loginWithGoogle(token, name, email);

          router.replace('/');
        } else {
          errorH();
          setErr('Your email is not verified yet. Please check your inbox and tap the link.');
        }
      } else {
        setErr('No active authentication session found. Please try logging in.');
      }
    } catch (e: any) {
      errorH();
      console.error('[AUTH] Email status check exception:', e);
      setErr(translateFirebaseError(e));
    } finally {
      setLoading(false);
    }
  };

  // Action: Resend verification link
  const onResendLink = async () => {
    tap();
    setLoading(true);
    setErr('');

    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.sendEmailVerification();
        setResendTimer(59);
        success();
        console.log('[AUTH] Resent Firebase email verification link.');
      } else {
        setErr('Authentication session expired. Please restart registration.');
      }
    } catch (e: any) {
      errorH();
      setErr(translateFirebaseError(e));
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
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">

          {/* Header Back Button */}
          <TouchableOpacity
            testID="signup-back"
            onPress={() => { tap(); router.back(); }}
            style={styles.back}
          >
            <ChevronLeft color={t.textPrimary} size={24} />
          </TouchableOpacity>

          {!isVerifyingEmail ? (
            // REGISTRATION DETAILS UI LAYOUT
            <View style={{ gap: spacing.sm, alignItems: 'stretch' }}>
              <View style={{ alignItems: 'center' }}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={{ width: 180, height: 80, resizeMode: 'contain', marginBottom: 8 }}
                />
                <Text style={[styles.h1, { color: t.textPrimary, textAlign: 'center' }]}>Join the green movement</Text>
                <Text style={[styles.sub, { color: t.textSecondary, textAlign: 'center', marginBottom: spacing.md }]}>
                  Save money. Cut emissions. Meet your community.
                </Text>
              </View>

              <View style={[styles.input, { backgroundColor: t.surface, borderColor: t.border }]}>
                <UserIcon color={t.textSecondary} size={18} />
                <TextInput
                  testID="signup-name"
                  editable={!loading}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={t.textSecondary}
                  style={[styles.field, { color: t.textPrimary }]}
                />
              </View>
              <View style={[styles.input, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Mail color={t.textSecondary} size={18} />
                <TextInput
                  testID="signup-email"
                  editable={!loading}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={t.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.field, { color: t.textPrimary }]}
                />
              </View>
              <View style={[styles.input, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Lock color={t.textSecondary} size={18} />
                <TextInput
                  testID="signup-password"
                  editable={!loading}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min 6)"
                  placeholderTextColor={t.textSecondary}
                  secureTextEntry
                  style={[styles.field, { color: t.textPrimary }]}
                />
              </View>

              {err ? <Text style={[styles.err, { color: t.error }]} testID="signup-error">{err}</Text> : null}

              <TouchableOpacity
                testID="signup-submit"
                onPress={onSignup}
                disabled={loading}
                style={[styles.cta, { backgroundColor: t.primary, width: '100%' }]}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={t.primaryContrast} />
                ) : (
                  <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Create Account</Text>
                )}
              </TouchableOpacity>

              <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
                By signing up, you agree to our{' '}
                <Text
                  style={{ color: t.primary, fontWeight: '700', textDecorationLine: 'underline' }}
                  onPress={() => { tap(); router.push('/privacy' as any); }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          ) : (
            // EMAIL VERIFICATION OTP PENDING UI LAYOUT
            <View style={styles.verifyContainer}>
              <View style={[styles.verifyIconWrapper, { backgroundColor: t.muted }]}>
                <MailCheck color={t.primary} size={48} />
              </View>

              <Text style={[styles.verifyTitle, { color: t.textPrimary }]}>Verify Your Email</Text>
              <Text style={[styles.verifyDescription, { color: t.textSecondary }]}>
                A secure activation link has been sent to your email inbox:{'\n'}
                <Text style={{ fontWeight: '700', color: t.textPrimary }}>{email.trim()}</Text>
              </Text>

              <View style={[styles.alertCard, { backgroundColor: t.muted, borderColor: t.border }]}>
                <ShieldAlert color={t.textPrimary} size={18} />
                <Text style={[styles.alertCardText, { color: t.textSecondary }]}>
                  Please click the link inside the verification email before pressing the button below to activate your account.
                </Text>
              </View>

              {err ? <Text style={[styles.err, { color: t.error, textAlign: 'center' }]}>{err}</Text> : null}

              <TouchableOpacity
                onPress={checkEmailVerificationStatus}
                disabled={loading}
                style={[styles.cta, { backgroundColor: t.primary, width: '100%', marginTop: spacing.md }]}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={t.primaryContrast} />
                ) : (
                  <Text style={[styles.ctaText, { color: t.primaryContrast }]}>I've Verified My Email</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendWrapper}>
                {resendTimer > 0 ? (
                  <Text style={[styles.timerText, { color: t.textSecondary }]}>
                    Resend link in <Text style={{ fontWeight: '700', color: t.textPrimary }}>{resendTimer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={onResendLink} disabled={loading} style={styles.resendBtn}>
                    <Text style={{ color: t.primary, fontWeight: '700', fontSize: 14 }}>Resend Verification Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -1, marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: spacing.lg },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: spacing.md,
  },
  field: { flex: 1, fontSize: 16 },
  cta: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  ctaText: { fontSize: 16, fontWeight: '700' },
  err: { fontSize: 13, fontWeight: '600', marginTop: spacing.md },
  verifyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  verifyIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  verifyDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  alertCardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  resendWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  timerText: {
    fontSize: 13,
  },
  resendBtn: {
    padding: 8,
  },
});
