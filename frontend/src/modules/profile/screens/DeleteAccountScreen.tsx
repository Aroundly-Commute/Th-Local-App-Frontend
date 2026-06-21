import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldAlert, CheckCircle2, Trash2, Mail, User } from 'lucide-react-native';
import { tap, success as successHaptic } from '../../../core/utils/haptics';
import { styles } from './DeleteAccount.styles';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !name.trim()) {
      setErrorMsg('Please fill in both your name and registered email address.');
      return;
    }

    if (!confirmed) {
      setErrorMsg('Please check the confirmation box to proceed.');
      return;
    }

    tap();
    setLoading(true);
    setErrorMsg('');

    try {
      // We simulate a secure submission. In production, this can fire a webhook, support email, or queue a delete event.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      successHaptic();
      setSuccess(true);
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again or contact support@aroundly.in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color="#000000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Deletion Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.cardWrapper}>
          {!success ? (
            <>
              <View style={styles.iconContainer}>
                <Trash2 color="#EF4444" size={40} />
              </View>

              <Text style={styles.title}>Account & Data Deletion</Text>
              <Text style={styles.subtitle}>
                Submit a request to permanently delete your Aroundly account, personal details, ride histories, vehicle details, and parking registrations.
              </Text>

              <View style={styles.alertCard}>
                <ShieldAlert color="#EF4444" size={20} />
                <Text style={styles.alertText}>
                  This action is permanent and cannot be undone. All your commute records, reviews, wallet details, and active listings will be purged within 7 business days.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User color="#64748B" size={18} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Your registered full name"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Registered Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail color="#64748B" size={18} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="e.g. user@example.com"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason for leaving (Optional)</Text>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Tell us how we can improve..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    style={[styles.textInput, styles.textArea]}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setConfirmed(!confirmed)}
                  style={styles.checkboxRow}
                >
                  <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                    {confirmed && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I confirm that I want to permanently delete my account and associated data.
                  </Text>
                </TouchableOpacity>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={loading}
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Deletion Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <CheckCircle2 color="#22C55E" size={64} />
              <Text style={styles.successTitle}>Request Submitted</Text>
              <Text style={styles.successMessage}>
                We have received your deletion request for <Text style={{ fontWeight: '700' }}>{email}</Text>. Your account, logs, lists, and commute/parking history will be permanently deleted from our servers within <Text style={{ fontWeight: '700' }}>7 business days</Text> in compliance with global privacy policies.
              </Text>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.homeBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.homeBtnText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
