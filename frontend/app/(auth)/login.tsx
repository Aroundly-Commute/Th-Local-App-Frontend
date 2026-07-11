import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
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

import { useRouter, useFocusEffect } from 'expo-router';
import { Mail, Lock, Car, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showEmailFields, setShowEmailFields] = useState(false);

  // Configure native Google Sign-in credentials on boot
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '233722731121-brn0chd58jfffn5ecq5qe493a58eg4r6.apps.googleusercontent.com',
      });
    }
  }, []);

  // Clear errors when the login screen gains focus
  useFocusEffect(
    useCallback(() => {
      setErr('');
    }, [])
  );

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
          throw new Error('Google Sign-In is currently unavailable. Please try again.');
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
          throw new Error('Google Sign-In was not successful. Please try again.');
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
              style={{ width: 200, height: 160, resizeMode: 'contain' }}
            />
          </View>

          <View style={{ gap: 12 }}>
            {!showEmailFields ? (
              <>
                <Text style={[styles.h1, { color: t.textPrimary }]}>Welcome back</Text>
                <Text style={[styles.sub, { color: t.textSecondary }]}>Sign in to continue to your account</Text>

                <View style={{ gap: 10, marginTop: spacing.md }}>
                  {/* Premium Social Button: Google Sign-in */}
                  <TouchableOpacity
                    testID="login-google"
                    onPress={onGoogleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={[
                      styles.socialBtn,
                      {
                        borderColor: '#000000',
                        borderWidth: 1,
                        borderRadius: 100,
                        backgroundColor: '#FFFFFF',
                      }
                    ]}
                  >
                    <Svg viewBox="12 10 20 20" width={18} height={18}>
                      <Path d="M31.6 20.2273C31.6 19.5182 31.5364 18.8364 31.4182 18.1818H22V22.05H27.3818C27.15 23.3 26.4455 24.3591 25.3864 25.0682V27.5773H28.6182C30.5091 25.8364 31.6 23.2727 31.6 20.2273Z" fill="#4285F4"/>
                      <Path d="M22 30C24.7 30 26.9636 29.1045 28.6181 27.5773L25.3863 25.0682C24.4909 25.6682 23.3454 26.0227 22 26.0227C19.3954 26.0227 17.1909 24.2636 16.4045 21.9H13.0636V24.4909C14.7091 27.7591 18.0909 30 22 30Z" fill="#34A853"/>
                      <Path d="M16.4045 21.9C16.2045 21.3 16.0909 20.6591 16.0909 20C16.0909 19.3409 16.2045 18.7 16.4045 18.1V15.5091H13.0636C12.3864 16.8591 12 18.3864 12 20C12 21.6136 12.3864 23.1409 13.0636 24.4909L16.4045 21.9Z" fill="#FBBC04"/>
                      <Path d="M22 13.9773C23.4681 13.9773 24.7863 14.4818 25.8227 15.4727L28.6909 12.6045C26.9591 10.9909 24.6954 10 22 10C18.0909 10 14.7091 12.2409 13.0636 15.5091L16.4045 18.1C17.1909 15.7364 19.3954 13.9773 22 13.9773Z" fill="#E94235"/>
                    </Svg>
                    <Text style={[styles.socialBtnText, { color: '#1F1F1F' }]}>Continue with Google</Text>
                  </TouchableOpacity>

                  {/* Premium Social Button: Phone OTP Login */}
                  <TouchableOpacity
                    testID="login-phone"
                    onPress={() => { tap(); router.push('/(auth)/phone-login'); }}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={[
                      styles.socialBtn,
                      {
                        borderColor: '#000000',
                        borderWidth: 1,
                        borderRadius: 100,
                      }
                    ]}
                  >
                    <Phone size={15} color={t.textPrimary} fill={t.textPrimary} />
                    <Text style={[styles.socialBtnText, { color: t.textPrimary }]}>Continue with Phone Number</Text>
                  </TouchableOpacity>

                  {/* Premium Social Button: Email Login */}
                  <TouchableOpacity
                    testID="login-email-option"
                    onPress={() => { tap(); setErr(''); setShowEmailFields(true); }}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={[
                      styles.socialBtn,
                      {
                        borderColor: '#000000',
                        borderWidth: 1,
                        borderRadius: 100,
                      }
                    ]}
                  >
                    <Mail size={15} color={t.textPrimary} />
                    <Text style={[styles.socialBtnText, { color: t.textPrimary }]}>Continue with Email</Text>
                  </TouchableOpacity>
                </View>

                {err ? <Text style={[styles.err, { color: t.error }]} testID="login-error">{err}</Text> : null}
              </>
            ) : (
              <>
                <Text style={[styles.h1, { color: t.textPrimary }]}>Sign In with Email</Text>
                <Text style={[styles.sub, { color: t.textSecondary }]}>Enter your credentials to access your account</Text>

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
                      secureTextEntry={!showPassword}
                      style={[styles.field, { color: t.textPrimary }]}
                    />
                    <TouchableOpacity
                      onPress={() => { tap(); setShowPassword(!showPassword); }}
                      style={{ padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff color={t.textSecondary} size={18} />
                      ) : (
                        <Eye color={t.textSecondary} size={18} />
                      )}
                    </TouchableOpacity>
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

                <TouchableOpacity
                  onPress={() => { tap(); setErr(''); setShowEmailFields(false); }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 12,
                    gap: 6
                  }}
                >
                  <ArrowLeft size={16} color={t.textSecondary} />
                  <Text style={{ fontSize: 14, color: t.textSecondary, fontWeight: '600' }}>Back to login options</Text>
                </TouchableOpacity>
              </>
            )}

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
