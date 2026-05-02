import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ImageBackground, ScrollView, useColorScheme, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, Lock, Leaf } from 'lucide-react-native';
import { useAuth } from '../../src/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success, errorH } from '../../src/haptics';

export default function Login() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('sarah.driver@ecoride.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onLogin = async () => {
    tap();
    setLoading(true); setErr('');
    try {
      await login(email.trim(), password);
      success();
      router.replace('/(tabs)');
    } catch (e: any) {
      errorH();
      setErr(e?.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/15828802/pexels-photo-15828802.jpeg' }}
        style={styles.bg}
      >
        <LinearGradient
          colors={['transparent', 'rgba(11,20,17,0.6)', '#0B1411']}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.logo}><Leaf color="#fff" size={20} /></View>
            <Text style={styles.brand}>EcoRide</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={[styles.sheet, { backgroundColor: t.surface }]}>
            <Text style={[styles.h1, { color: t.textPrimary }]}>Drive Green.{'\n'}Save Green.</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>
              Share rides, cut emissions, and earn rewards.
            </Text>

            <View style={[styles.input, { backgroundColor: t.background, borderColor: t.border }]}>
              <Mail color={t.textSecondary} size={18} />
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
            <View style={[styles.input, { backgroundColor: t.background, borderColor: t.border }]}>
              <Lock color={t.textSecondary} size={18} />
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

            {err ? <Text style={[styles.err, { color: t.error }]} testID="login-error">{err}</Text> : null}

            <TouchableOpacity
              testID="login-submit"
              onPress={onLogin}
              disabled={loading}
              style={[styles.cta, { backgroundColor: t.primary }]}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={t.primaryContrast} />
                : <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity testID="goto-signup" onPress={() => { tap(); router.push('/(auth)/signup'); }}>
              <Text style={[styles.link, { color: t.textSecondary }]}>
                New here? <Text style={{ color: t.primary, fontWeight: '700' }}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 60 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sheet: {
    borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, marginTop: 240,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 38 },
  sub: { fontSize: 15, marginBottom: spacing.sm },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, height: 52,
  },
  field: { flex: 1, fontSize: 16 },
  cta: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  ctaText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  link: { textAlign: 'center', marginTop: 4, fontSize: 14 },
  err: { fontSize: 13, fontWeight: '600' },
});
