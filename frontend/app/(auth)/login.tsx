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
  ActivityIndicator 
} from 'react-native';

import { useRouter } from 'expo-router';
import { Mail, Lock, Car, Phone } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success, errorH } from '../../src/core/utils/haptics';

import auth from '../../src/core/auth/firebaseAdapter';

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
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('sarah.driver@ecoride.app');
  const [password, setPassword] = useState('password123');
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
      router.replace('/(tabs)');
    } catch (e: any) {
      errorH();
      console.warn('[AUTH] Firebase login failed:', e);
      setErr(e?.message || 'Invalid email or password');
    } finally { 
      setLoading(false); 
    }
  };

  const onGoogleLogin = async () => {
    tap();
    setLoading(true); 
    setErr('');
    
    try {
      let firebaseIdToken = '';
      let name = 'Google User';
      let userEmail = 'google.user@gmail.com';

      if (Platform.OS === 'web') {
        console.log('[AUTH] Triggering web Google Sign-in popup...');
        const { signInWithPopup, GoogleAuthProvider } = require('firebase/auth');
        const { webAuth } = require('../../src/core/auth/firebaseAdapter.web');
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(webAuth, provider);
        
        firebaseIdToken = await userCredential.user.getIdToken();
        name = userCredential.user.displayName || 'Google User';
        userEmail = userCredential.user.email || 'google.user@gmail.com';
      } else {
        if (!GoogleSignin) {
          throw new Error('Native Google Sign-in module is not loaded');
        }
        console.log('[AUTH] Triggering native Google Sign-in...');
        
        // 1. Check for Play Services on Android
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        // 2. Open Google Accounts overlay
        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult.data?.idToken;
        
        if (!idToken) {
          throw new Error('Google Sign-in failed to return an ID Token');
        }

        console.log('[AUTH] Firebase authenticating Google credential...');
        
        // 3. Build credential and log into Firebase client SDK
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        
        // 4. Extract secure JWT token
        firebaseIdToken = await userCredential.user.getIdToken();
        name = userCredential.user.displayName || 'Google User';
        userEmail = userCredential.user.email || 'google.user@gmail.com';
      }

      console.log('[AUTH] Syncing Google session with PostgreSQL...');
      
      // 5. Synchronize with our Postgres database
      await loginWithGoogle(firebaseIdToken, name, userEmail);
      
      success();
      router.replace('/(tabs)');
    } catch (e: any) {
      errorH();
      console.error('[AUTH] Google Sign-in failed:', e);
      setErr(e?.message || 'Google Sign-in was cancelled or failed.');
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
          <View style={{ flex: 1 }}>
            <View style={[styles.brand, { backgroundColor: t.textPrimary }]}>
              <Car color={t.background} size={22} strokeWidth={2.2} />
            </View>
            <Text style={[styles.brandName, { color: t.textPrimary }]}>GoPool</Text>
            <Text style={[styles.tagline, { color: t.textSecondary }]}>Smart carpooling for the modern commuter.</Text>
          </View>

          <View style={{ gap: 12 }}>
            <Text style={[styles.h1, { color: t.textPrimary }]}>Welcome back</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>Sign in to continue to your account</Text>

            <View style={{ gap: 10, marginTop: spacing.md }}>
              <View style={[styles.input, { backgroundColor: t.muted }]}>
                <Mail color={t.textSecondary} size={16} />
                <TextInput
                  testID="login-email"
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

            <TouchableOpacity testID="goto-signup" onPress={() => { tap(); router.push('/(auth)/signup'); }}
              style={{ marginTop: spacing.md }}>
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
