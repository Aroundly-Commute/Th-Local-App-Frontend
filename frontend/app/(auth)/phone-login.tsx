import React, { useState, useRef, useEffect } from 'react';
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
  PermissionsAndroid,
  DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { translateFirebaseError } from '../../src/core/utils/firebaseErrorHandler';
import { validatePhoneNumber } from '../../src/core/utils/validation';

export default function PhoneLogin() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();

  // Screen UI Modes: 'phone' (input phone) or 'otp' (input code)
  const [mode, setMode] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stores the native Firebase Confirmation transaction object
  const [confirmResult, setConfirmResult] = useState<any>(null);

  // 6-digit OTP code array
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<Array<TextInput | null>>([]);

  // Countdown timer for OTP resend
  const [timer, setTimer] = useState(59);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  // Request SMS permissions on Android
  const requestSmsPermission = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const hasReceive = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
      const hasRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);

      if (!hasReceive || !hasRead) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
        ]);
      }
    } catch (err) {
      console.warn('[SMS] Permission request error:', err);
    }
  };

  useEffect(() => {
    if (mode === 'otp') {
      requestSmsPermission();
    }
  }, [mode]);

  useEffect(() => {
    let interval: any;
    if (mode === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  // Handles requesting the Firebase SMS OTP
  const onRequestOtp = async () => {
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone && formattedPhone.length === 0) {
      setErr('Please enter a phone number');
      errorH();
      return;
    }

    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    if (!validatePhoneNumber(formattedPhone)) {
      setErr('Please enter a valid phone number');
      errorH();
      return;
    }

    tap();
    setLoading(true);
    setErr('');
    setSuccessMsg('');

    try {
      console.log(`[AUTH] Initiating native Firebase Phone SMS to: ${formattedPhone}...`);

      // Call Firebase Client Phone SDK
      const confirmation = await sendPhoneOtp(formattedPhone);
      setConfirmResult(confirmation);

      setMode('otp');
      setTimer(59);
      setSuccessMsg('SMS verification code successfully!');
      success();
    } catch (e: any) {
      errorH();
      console.error('[AUTH] Firebase Phone Auth dispatch failed:', e);
      setErr(translateFirebaseError(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length < 6) {
      setErr('Please enter the complete 6-digit verification code');
      errorH();
      return;
    }

    if (!confirmResult) {
      setErr('No active verification transaction found. Please restart.');
      errorH();
      return;
    }

    tap();
    setLoading(true);
    setErr('');

    try {
      console.log(`[AUTH] Verifying code: ${code} with Firebase...`);

      // Verify OTP code natively via Firebase Client SDK
      await verifyPhoneOtp(confirmResult, code);
      success();

      console.log('[AUTH] Phone login and database sync complete!');
      router.replace('/');
    } catch (e: any) {
      errorH();
      console.error('[AUTH] Firebase verification check failed:', e);
      setErr(translateFirebaseError(e));
    } finally {
      setLoading(false);
    }
  };

  // Handles confirming the OTP digits
  const onVerifyOtp = () => verifyCode(otp.join(''));

  // Listen to incoming SMS when OTP mode is active
  useEffect(() => {
    if (mode !== 'otp') return;

    const subscription = DeviceEventEmitter.addListener('onSmsReceived', (event) => {
      console.log('[SMS] Received SMS event:', event);
      const message = event.messageBody;
      const match = message.match(/\b\d{6}\b/);
      if (match) {
        const otpCode = match[0];
        console.log('[SMS] Extracted OTP code:', otpCode);
        setOtp(otpCode.split(''));
        verifyCode(otpCode);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [mode, confirmResult]);

  // Auto focus shift as user types digit character
  const handleOtpChange = (text: string, index: number) => {
    const numericVal = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numericVal;
    setOtp(newOtp);

    if (numericVal.length > 0 && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Auto backspace shift cursor focus
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
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

          {/* Header Back Button */}
          <TouchableOpacity
            onPress={() => { tap(); router.back(); }}
            style={[styles.backBtn, { backgroundColor: t.muted }]}
          >
            <ArrowLeft color={t.textPrimary} size={20} />
          </TouchableOpacity>



          {mode === 'phone' ? (
            // PHONE INPUT LAYOUT
            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <Text style={[styles.h1, { color: t.textPrimary }]}>Verification</Text>
              <Text style={[styles.sub, { color: t.textSecondary }]}>
                We will send you a passwordless One-Time Password (OTP) to securely sign into your carpool profile.
              </Text>

              <View style={[styles.inputContainer, { backgroundColor: t.muted, borderColor: t.border }]}>
                <View style={styles.countryBadge}>
                  <Phone color={t.textSecondary} size={16} />
                  <Text style={[styles.countryText, { color: t.textPrimary }]}>+91</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: t.border }]} />
                <TextInput
                  testID="phone-input"
                  editable={!loading}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="Mobile Number"
                  placeholderTextColor={t.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[styles.field, { color: t.textPrimary }]}
                  autoFocus
                />
              </View>

              {err ? <Text style={[styles.err, { color: t.error }]}>{err}</Text> : null}

              <TouchableOpacity
                testID="send-otp-submit"
                onPress={onRequestOtp}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.cta, { backgroundColor: t.primary }]}
              >
                {loading ? (
                  <ActivityIndicator color={t.primaryContrast} />
                ) : (
                  <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // OTP CODE VERIFICATION LAYOUT
            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <Text style={[styles.h1, { color: t.textPrimary }]}>Enter OTP Code</Text>
              <Text style={[styles.sub, { color: t.textSecondary }]}>
                A 6-digit verification code has been dispatched to{' '}
                <Text style={{ fontWeight: '700', color: t.textPrimary }}>
                  {phoneNumber.startsWith('+') ? phoneNumber : `+91 ${phoneNumber}`}
                </Text>
              </Text>

              {/* 6 individual OTP input boxes */}
              <View style={styles.otpInputRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => { otpInputsRef.current[idx] = ref; }}
                    editable={!loading}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: t.muted,
                        borderColor: digit ? t.primary : t.border,
                        color: t.textPrimary
                      }
                    ]}
                  />
                ))}
              </View>

              {err ? <Text style={[styles.err, { color: t.error }]}>{err}</Text> : null}
              {successMsg ? <Text style={[styles.successText, { color: t.success }]}>{successMsg}</Text> : null}

              <TouchableOpacity
                testID="verify-otp-submit"
                onPress={onVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.cta, { backgroundColor: t.primary, marginTop: spacing.sm }]}
              >
                {loading ? (
                  <ActivityIndicator color={t.primaryContrast} />
                ) : (
                  <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Verify & Login</Text>
                )}
              </TouchableOpacity>

              {/* Countdown and Resend Controls */}
              <View style={styles.resendRow}>
                {timer > 0 ? (
                  <Text style={[styles.timerText, { color: t.textSecondary }]}>
                    Resend code in <Text style={{ fontWeight: '700', color: t.textPrimary }}>{timer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={onRequestOtp}
                    disabled={loading}
                    style={styles.resendBtn}
                  >
                    <RefreshCw size={14} color={t.primary} />
                    <Text style={[styles.resendText, { color: t.primary }]}>Resend Code</Text>
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
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sandboxAlert: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  sandboxAlertText: {
    fontSize: 12,
    lineHeight: 18,
  },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  sub: { fontSize: 14, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: spacing.sm,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  field: {
    flex: 1,
    fontSize: 16,
  },
  cta: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  ctaText: { fontSize: 15, fontWeight: '700' },
  err: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  successText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: spacing.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  timerText: {
    fontSize: 13,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
