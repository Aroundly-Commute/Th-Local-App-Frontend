import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';

import { useRouter } from 'expo-router';
import { Mail, Lock, User as UserIcon, ChevronLeft, Car, UserCheck } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success, errorH } from '../../src/core/utils/haptics';

export default function Signup() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onSignup = async () => {
    tap();
    setErr('');
    if (!email || !password || !name) { setErr('Please fill all fields'); return; }
    setLoading(true);
    try {
      await signup(email.trim(), password, name, role);
      success();
      router.replace('/(tabs)');
    } catch (e: any) {
      errorH();
      setErr(e?.response?.data?.detail || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="signup-back" onPress={() => { tap(); router.back(); }} style={styles.back}>
            <ChevronLeft color={t.textPrimary} size={24} />
          </TouchableOpacity>

          <Text style={[styles.h1, { color: t.textPrimary }]}>Join the green movement</Text>
          <Text style={[styles.sub, { color: t.textSecondary }]}>
            Save money. Cut emissions. Meet your community.
          </Text>

          <View style={[styles.input, { backgroundColor: t.surface, borderColor: t.border }]}>
            <UserIcon color={t.textSecondary} size={18} />
            <TextInput testID="signup-name" value={name} onChangeText={setName}
              placeholder="Full name" placeholderTextColor={t.textSecondary}
              style={[styles.field, { color: t.textPrimary }]} />
          </View>
          <View style={[styles.input, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Mail color={t.textSecondary} size={18} />
            <TextInput testID="signup-email" value={email} onChangeText={setEmail}
              placeholder="Email" placeholderTextColor={t.textSecondary} autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.field, { color: t.textPrimary }]} />
          </View>
          <View style={[styles.input, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Lock color={t.textSecondary} size={18} />
            <TextInput testID="signup-password" value={password} onChangeText={setPassword}
              placeholder="Password (min 6)" placeholderTextColor={t.textSecondary} secureTextEntry
              style={[styles.field, { color: t.textPrimary }]} />
          </View>

          <Text style={[styles.label, { color: t.textSecondary }]}>I want to</Text>
          <View style={styles.roleRow}>
            <RoleCard
              testID="role-passenger"
              active={role === 'passenger'}
              onPress={() => { tap(); setRole('passenger'); }}
              theme={t}
              icon={<UserCheck color={role === 'passenger' ? t.primaryContrast : t.primary} size={22} />}
              label="Find rides"
              hint="Save money, save the planet"
            />
            <RoleCard
              testID="role-driver"
              active={role === 'driver'}
              onPress={() => { tap(); setRole('driver'); }}
              theme={t}
              icon={<Car color={role === 'driver' ? t.primaryContrast : t.primary} size={22} />}
              label="Offer rides"
              hint="Earn, share, reduce traffic"
            />
          </View>

          {err ? <Text style={[styles.err, { color: t.error }]} testID="signup-error">{err}</Text> : null}

          <TouchableOpacity testID="signup-submit" onPress={onSignup}
            disabled={loading}
            style={[styles.cta, { backgroundColor: t.primary }]}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={t.primaryContrast} />
              : <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Create account</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({ active, onPress, theme: t, icon, label, hint, testID }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.85}
      style={[styles.role, {
        backgroundColor: active ? t.primary : t.surface,
        borderColor: active ? t.primary : t.border,
      }]}>
      {icon}
      <Text style={[styles.roleTitle, { color: active ? t.primaryContrast : t.textPrimary }]}>{label}</Text>
      <Text style={[styles.roleHint, { color: active ? t.primaryContrast : t.textSecondary, opacity: active ? 0.85 : 1 }]}>{hint}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -1, marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: spacing.lg },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, height: 52, marginBottom: spacing.md,
  },
  field: { flex: 1, fontSize: 16 },
  label: { fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '700', marginVertical: spacing.sm },
  roleRow: { flexDirection: 'row', gap: 12 },
  role: { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 8 },
  roleTitle: { fontSize: 16, fontWeight: '700' },
  roleHint: { fontSize: 12 },
  cta: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  ctaText: { fontSize: 16, fontWeight: '700' },
  err: { fontSize: 13, fontWeight: '600', marginTop: spacing.md },
});
