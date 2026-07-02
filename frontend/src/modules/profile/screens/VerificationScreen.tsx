import React, { useState, useEffect, useRef } from 'react';
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
import {
  ShieldCheck,
  Building2,
  Mail,
  KeyRound,
  ChevronLeft,
  Send,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react-native';
import { useAuth } from '../../../core/auth/auth';
import { lightTheme } from '../../../core/theme/theme';
import { tap, success, errorH } from '../../../core/utils/haptics';
import { api } from '../../../core/api/api';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { Alert } from '../../../core/components/CustomAlert';
import { styles } from './Verification.styles';

export default function VerificationScreen() {
  const t = lightTheme;
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(0);

  const hiddenInputRef = useRef<TextInput>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // If user changes to step 2, auto focus OTP field
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 250);
    }
  }, [step]);

  if (!user) return null;

  // Simple client-side public domains check
  const isPublicEmail = (emailStr: string): boolean => {
    const publicDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'aol.com',
      'zoho.com',
      'yandex.com',
      'mail.com',
      'gmx.com',
      'protonmail.com',
      'proton.me',
      'live.com',
    ];
    const domain = emailStr.trim().toLowerCase().split('@')[1];
    return publicDomains.includes(domain);
  };

  const handleSendCode = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your corporate email address');
      errorH();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address');
      errorH();
      return;
    }

    if (isPublicEmail(cleanEmail)) {
      setErrorMsg('Please use a corporate/work email. Public domains (Gmail, Yahoo, etc.) are not supported.');
      errorH();
      return;
    }

    tap();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/verification/send', { email: cleanEmail });
      success();
      setStep(2);
      setTimer(60); // 60s resend cooldown
      setSuccessMsg('OTP code sent successfully to your corporate email!');
    } catch (err: any) {
      errorH();
      console.error('[VERIFICATION] Send Code Error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit code');
      errorH();
      return;
    }

    tap();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/verification/verify', {
        email: email.trim(),
        code: cleanOtp,
      });
      success();
      await refresh();
      Alert.alert(
        'Verification Successful',
        'Your corporate email has been successfully verified! You now have a verified professional badge.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/profile'),
          },
        ]
      );
    } catch (err: any) {
      errorH();
      console.error('[VERIFICATION] Verify Code Error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0 || resendLoading) return;

    tap();
    setResendLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/verification/send', { email: email.trim() });
      success();
      setTimer(60);
      setOtpCode('');
      setSuccessMsg('A new verification code has been dispatched.');
    } catch (err: any) {
      errorH();
      console.error('[VERIFICATION] Resend Error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <ScreenHeader title="Account Verification" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          {user.is_verified ? (
            /* VERIFIED STATE */
            <View style={[styles.verifiedCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <ShieldCheck color={t.success} size={48} />
              </View>
              <Text style={[styles.verifiedTitle, { color: t.textPrimary }]}>Verified Professional</Text>
              
              <Text style={[styles.verifiedDesc, { color: t.textSecondary }]}>
                Your corporate status is verified. You now enjoy verified status across Aroundly, enhancing trust and match priority.
              </Text>
              
              <View style={[styles.emailBadge, { backgroundColor: t.surfaceElevated }]}>
                <Building2 size={16} color={t.success} />
                <Text style={[styles.emailBadgeText, { color: t.textPrimary }]}>{user.corporate_email || user.email}</Text>
              </View>

              <View style={[styles.infoBanner, { backgroundColor: t.successBg, borderColor: t.success }]}>
                <ShieldCheck size={18} color={t.success} style={{ marginTop: 2 }} />
                <Text style={[styles.infoText, { color: t.textPrimary }]}>
                  Your organization details have been securely locked. To change your verified email, contact our customer support.
                </Text>
              </View>
            </View>
          ) : (
            /* UNVERIFIED WIZARD */
            <View style={styles.inputGroup}>
              {step === 1 ? (
                /* STEP 1: Email Request */
                <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <ShieldAlert color={t.warning} size={22} />
                    <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Verify Corporate Identity</Text>
                  </View>
                  <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
                    Get verified on Aroundly to unlock trust perks, get matched faster, and access corporate carpooling filters. Enter your work/corporate email to verify.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Corporate Email</Text>
                    <View style={[styles.inputFieldWrapper, { borderColor: t.border, backgroundColor: t.surface }]}>
                      <Mail color={t.textSecondary} size={18} />
                      <TextInput
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          setErrorMsg('');
                        }}
                        placeholder="e.g. alex@google.com"
                        placeholderTextColor={t.textTertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                        style={[styles.inputField, { color: t.textPrimary }]}
                      />
                    </View>
                  </View>

                  {errorMsg ? (
                    <Text style={[styles.errorMsg, { color: t.error }]}>{errorMsg}</Text>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={loading}
                    onPress={handleSendCode}
                    style={[styles.cta, { backgroundColor: t.primary }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={t.primaryContrast} />
                    ) : (
                      <>
                        <Send size={16} color={t.primaryContrast} />
                        <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Send Verification Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* STEP 2: OTP Verification */
                <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <KeyRound color={t.success} size={22} />
                    <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Enter Verification Code</Text>
                  </View>
                  <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
                    A 6-digit OTP code has been dispatched to <Text style={{ fontWeight: '700' }}>{email}</Text>. Please retrieve and enter it below.
                  </Text>

                  {/* 6 Digit OTP Inputs row */}
                  <View style={styles.otpContainer}>
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const char = otpCode[idx] || '';
                      const isFocused = otpCode.length === idx;
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          onPress={() => hiddenInputRef.current?.focus()}
                          style={[
                            styles.otpBox,
                            {
                              borderColor: isFocused ? t.primary : t.border,
                              backgroundColor: isFocused ? t.surfaceElevated : t.surface,
                            }
                          ]}
                        >
                          <Text style={[styles.otpText, { color: t.textPrimary }]}>{char}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TextInput
                      ref={hiddenInputRef}
                      value={otpCode}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        if (cleaned.length <= 6) {
                          setOtpCode(cleaned);
                          setErrorMsg('');
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={styles.hiddenInput}
                      caretHidden
                      editable={!loading}
                    />
                  </View>

                  {timer > 0 ? (
                    <Text style={[styles.timerText, { color: t.textSecondary }]}>
                      Resend code in <Text style={{ color: t.success, fontWeight: '700' }}>{timer}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      disabled={resendLoading}
                      onPress={handleResendCode}
                      style={styles.secondaryAction}
                    >
                      {resendLoading ? (
                        <ActivityIndicator size="small" color={t.textPrimary} />
                      ) : (
                        <Text style={[styles.secondaryActionText, { color: t.textPrimary }]}>Resend Code</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {errorMsg ? (
                    <Text style={[styles.errorMsg, { color: t.error }]}>{errorMsg}</Text>
                  ) : null}
                  {successMsg ? (
                    <Text style={[styles.successMsg, { color: t.success }]}>{successMsg}</Text>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={loading}
                    onPress={handleVerifyCode}
                    style={[styles.cta, { backgroundColor: t.primary }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={t.primaryContrast} />
                    ) : (
                      <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Verify Code</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => {
                      tap();
                      setStep(1);
                      setOtpCode('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    style={styles.secondaryAction}
                  >
                    <Text style={[styles.secondaryActionText, { color: t.textSecondary }]}>Change Email Address</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
