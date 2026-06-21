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
import { Mail, Lock, Car, Phone } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success, errorH } from '../../src/core/utils/haptics';

import auth from '../../src/core/auth/firebaseAdapter';
import { translateFirebaseError } from '../../src/core/utils/firebaseErrorHandler';

let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (e) {
    // Gracefully handle dynamic loading fallback
  }
}

export default function Login() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { login, loginWithGoogle, setIsAuthenticating } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Configure native Google Sign-in credentials on boot
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '233722731121-brn0chd58jfffn5ecq5qe493a58eg4r6.apps.googleusercontent.com',
      });
    }
  }, []);

  const onLogin = async () => {
    if (!email || !password) {
      setErr('Please enter both email and password');
      errorH();
      return;
    }

    tap();
    setLoading(true);
    setErr('');

    try {
      await login(email.trim(), password);
      success();
      router.replace('/');
    } catch (e: any) {
      errorH();
      console.warn('[AUTH] Firebase login failed:', e);
      setErr(translateFirebaseError(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    tap();
    setLoading(true);
    setErr('');

    console.log("=========================================");
    console.log("       FRONTEND GOOGLE LOGIN TRIGGER     ");
    console.log("=========================================");
    console.log("EXPO_PUBLIC_BACKEND_URL:", process.env.EXPO_PUBLIC_BACKEND_URL);
    console.log("EXPO_PUBLIC_APP_ENV:", process.env.EXPO_PUBLIC_APP_ENV);
    console.log("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
    console.log("GoogleSignin Module loaded?:", !!GoogleSignin);
    console.log("=========================================");

    try {
      setIsAuthenticating(true);
      let firebaseIdToken = '';
      let name = 'Google User';
      let userEmail = 'google.user@gmail.com';

      if (Platform.OS === 'web') {
        console.log('[AUTH] Triggering web Google Sign-in popup...');
        const { signInWithPopup, GoogleAuthProvider } = require('firebase/auth');
        const { webAuth } = require('../../src/core/auth/firebaseAdapter.web');
        const provider = new GoogleAuthProvider();

        // Force account chooser prompt
        provider.setCustomParameters({ prompt: 'select_account' });

        console.log('[AUTH] Calling Firebase signInWithPopup...');
        const userCredential = await signInWithPopup(webAuth, provider);
        console.log('[AUTH] Firebase signInWithPopup succeeded. User:', userCredential.user?.email);

        firebaseIdToken = await userCredential.user.getIdToken();
        name = userCredential.user.displayName || 'Google User';
        userEmail = userCredential.user.email || 'google.user@gmail.com';
      } else {
        if (!GoogleSignin) {
          throw new Error('Native Google Sign-in module is not loaded');
        }
        console.log('[AUTH] Triggering native Google Sign-in...');

        // 1. Check for Play Services on Android
        console.log('[AUTH] Checking Play Services...');
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        console.log('[AUTH] Play Services are available.');

        // 2. Open Google Accounts overlay
        console.log('[AUTH] Calling GoogleSignin.signIn()...');
        const signInResult = await GoogleSignin.signIn();
        console.log('[AUTH] GoogleSignin.signIn() success. Result keys:', Object.keys(signInResult || {}));
        if (signInResult.data) {
          console.log('[AUTH] GoogleSignin data keys:', Object.keys(signInResult.data));
          console.log('[AUTH] Google User email:', signInResult.data.user?.email);
        }

        const idToken = signInResult.data?.idToken;
        console.log('[AUTH] Google ID Token present?:', !!idToken, idToken ? `(Length: ${idToken.length})` : '');

        if (!idToken) {
          throw new Error('Google Sign-in failed to return an ID Token');
        }

        console.log('[AUTH] Firebase authenticating Google credential...');

        // 3. Build credential and log into Firebase client SDK
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        console.log('[AUTH] Calling Firebase signInWithCredential...');
        const userCredential = await auth().signInWithCredential(googleCredential);
        console.log('[AUTH] Firebase signInWithCredential success. User:', userCredential.user?.email);

        // 4. Extract secure JWT token
        firebaseIdToken = await userCredential.user.getIdToken();
        name = userCredential.user.displayName || 'Google User';
        userEmail = userCredential.user.email || 'google.user@gmail.com';
      }

      console.log('[AUTH] Syncing Google session with PostgreSQL...');
      console.log(`[AUTH] Calling loginWithGoogle with name: "${name}", email: "${userEmail}", token length: ${firebaseIdToken?.length}`);

      // 5. Synchronize with our Postgres database
      await loginWithGoogle(firebaseIdToken, name, userEmail);
      console.log('[AUTH] Google Sign-in and backend sync completed successfully!');

      success();
      router.replace('/');
    } catch (e: any) {
      errorH();
      console.error('[AUTH] Google Sign-in failed! Detailed exception log:');
      console.error('Error message:', e?.message || e);
      console.error('Error code/status:', e?.code || e?.status);
      if (e?.response) {
        console.error('Axios error details:');
        console.error('  Response Status:', e.response.status);
        console.error('  Response Data:', JSON.stringify(e.response.data));
        console.error('  Response Headers:', JSON.stringify(e.response.headers));
      }
      setErr(translateFirebaseError(e));
    } finally {
      setIsAuthenticating(false);
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Image
              source={require('../../assets/images/app_Icon_less_padding.png')}
              style={{ width: 250, height: 200, resizeMode: 'contain' }}
            />
            <Text style={[styles.tagline, { color: t.textSecondary, textAlign: 'center', marginTop: 16 }]}>Travel Together, Save Together.</Text>
          </View>

          <View style={{ gap: 12 }}>
            <Text style={[styles.h1, { color: t.textPrimary }]}>Welcome back</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>Sign in to continue to your account</Text>

            <View style={{ gap: 10, marginTop: spacing.md }}>
              <View style={[styles.input, { backgroundColor: t.muted }]}>
                <Mail color={t.textSecondary} size={16} />
                <TextInput
                  testID="login-email"
                  editable={!loading}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={t.textSecondary}
                  style={[styles.field, { color: t.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={[styles.input, { backgroundColor: t.muted }]}>
                <Lock color={t.textSecondary} size={16} />
                <TextInput
                  testID="login-password"
                  editable={!loading}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={t.textSecondary}
                  secureTextEntry
                  style={[styles.field, { color: t.textPrimary }]}
                />
              </View>
            </View>

            {err ? <Text style={[styles.err, { color: t.error }]} testID="login-error">{err}</Text> : null}

            <TouchableOpacity
              testID="login-submit"
              onPress={onLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: t.primary }]}
            >
              {loading
                ? <ActivityIndicator color={t.primaryContrast} />
                : <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Sign In</Text>}
            </TouchableOpacity>

            {/* Divider Line */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
              <Text style={[styles.dividerText, { color: t.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
            </View>

            {/* Premium Social Button: Google Sign-in */}
            <TouchableOpacity
              testID="login-google"
              onPress={onGoogleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.socialBtn, { borderColor: t.border, borderWidth: 1 }]}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#EA4335' }}>G</Text>
              <Text style={[styles.socialBtnText, { color: t.textPrimary }]}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Premium Social Button: Phone OTP Login */}
            <TouchableOpacity
              testID="login-phone"
              onPress={() => { tap(); router.push('/(auth)/phone-login'); }}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.socialBtn, { borderColor: t.border, borderWidth: 1 }]}
            >
              <Phone size={15} color={t.textPrimary} />
              <Text style={[styles.socialBtnText, { color: t.textPrimary }]}>Continue with Phone Number</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="goto-signup"
              disabled={loading}
              onPress={() => { tap(); router.push('/(auth)/signup'); }}
              style={{ marginTop: spacing.md, opacity: loading ? 0.6 : 1 }}
            >
              <Text style={[styles.link, { color: t.textSecondary }]}>
                New here? <Text style={{ color: t.textPrimary, fontWeight: '700' }}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  brand: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 26, fontWeight: '700', letterSpacing: -0.8, marginTop: 12 },
  tagline: { fontSize: 14, marginTop: 4 },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  sub: { fontSize: 14 },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 50, borderRadius: radius.md,
  },
  field: { flex: 1, fontSize: 15 },
  cta: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ctaText: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 13 },
  err: { fontSize: 12, fontWeight: '600' },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: radius.md,
    marginTop: 8,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
