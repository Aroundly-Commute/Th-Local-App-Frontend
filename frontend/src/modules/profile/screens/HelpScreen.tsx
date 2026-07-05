import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ChevronDown, ChevronUp, Mail, Shield, HelpCircle, AlertTriangle, Send } from 'lucide-react-native';
import { lightTheme, spacing } from '../../../core/theme/theme';
import { tap, success as successHaptic } from '../../../core/utils/haptics';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { Alert } from '../../../core/components/CustomAlert';
import { styles } from './Help.styles';

const FAQS = [
  {
    q: 'How does hyper-local carpooling work?',
    a: 'Aroundly matches drivers who have empty seats with riders heading in the same direction within your local society or workplace. Drivers post rides, and riders can request a seat.',
  },
  {
    q: 'Is there a cost for sharing rides?',
    a: 'Riders share fuel costs with drivers. The cost is calculated transparently based on distance and vehicle type, and is visible before booking.',
  },
  {
    q: 'How are society and workplace verified?',
    a: 'Aroundly uses local community and corporate email domain checks to verify user associations, ensuring high trust in hyper-local carpools.',
  },
  {
    q: 'How do I register my vehicle details?',
    a: 'Navigate to your Profile screen, tap "My Vehicles," and complete the registration. Once saved, you can immediately begin offering rides.',
  },
  {
    q: 'What is the cancellation policy?',
    a: 'You can cancel a ride up to 30 minutes before the start time. We recommend coordinating directly with your match via chat before cancelling.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const t = lightTheme;

  const [activeTab, setActiveTab] = useState<'faq' | 'safety' | 'contact'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Contact Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFaqToggle = (index: number) => {
    tap();
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleContactSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      tap();
      Alert.alert('Missing Fields', 'Please fill in both the subject and description fields.');
      return;
    }

    tap();
    setLoading(true);

    try {
      // Simulate API submit
      await new Promise((resolve) => setTimeout(resolve, 1500));
      successHaptic();
      Alert.alert('Message Sent', 'Thank you for reaching out! We have received your query and will reply within 24 hours.', [
        {
          text: 'OK',
          onPress: () => {
            setSubject('');
            setMessage('');
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message. Please try again or email support@aroundly.in');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      {Platform.OS === 'web' && (
        <Head>
          <title>Help & Support - Aroundly</title>
          <meta name="description" content="Get support for Aroundly. Find frequently asked questions (FAQs), safety guidelines, and customer contact options." />
          <link rel="canonical" href="https://www.aroundly.in/help" />
          <meta property="og:title" content="Help & Support - Aroundly" />
          <meta property="og:url" content="https://www.aroundly.in/help" />
          <meta property="twitter:title" content="Help & Support - Aroundly" />
          <meta property="twitter:url" content="https://www.aroundly.in/help" />
        </Head>
      )}
      <ScreenHeader title="Help & Support" onBack={handleBack} />

      {/* Tabs Selector */}
      <View style={[styles.tabBar, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        {(['faq', 'safety', 'contact'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.7}
            onPress={() => {
              tap();
              setActiveTab(tab);
            }}
            style={[
              styles.tabItem,
              activeTab === tab && { borderBottomColor: t.primary, borderBottomWidth: 3 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? t.textPrimary : t.textSecondary },
                activeTab === tab && { fontWeight: '700' },
              ]}
            >
              {tab === 'faq' ? 'FAQs' : tab === 'safety' ? 'Safety' : 'Contact Us'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* FAQs TAB */}
        {activeTab === 'faq' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {FAQS.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <View
                    key={idx}
                    style={[styles.faqItem, { backgroundColor: t.surface, borderColor: t.border }]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleFaqToggle(idx)}
                      style={styles.faqHeader}
                    >
                      <Text style={[styles.faqQuestion, { color: t.textPrimary }]}>{faq.q}</Text>
                      {isExpanded ? (
                        <ChevronUp color={t.textSecondary} size={18} />
                      ) : (
                        <ChevronDown color={t.textSecondary} size={18} />
                      )}
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={[styles.faqAnswerContainer, { borderTopColor: t.border }]}>
                        <Text style={[styles.faqAnswer, { color: t.textSecondary }]}>{faq.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SAFETY TAB */}
        {activeTab === 'safety' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Safety Guidelines</Text>
            
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.safetyHeader}>
                <Shield color={t.success} size={22} />
                <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Verification Badges</Text>
              </View>
              <Text style={[styles.cardText, { color: t.textSecondary }]}>
                Always commute with verified users. Check for verified badges and user ratings on the match details screen before confirming bookings.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
              <View style={styles.safetyHeader}>
                <AlertTriangle color={t.warning} size={22} />
                <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Report Incident</Text>
              </View>
              <Text style={[styles.cardText, { color: t.textSecondary }]}>
                If you encounter inappropriate behavior or safety concerns, immediately report the user profile or raise an alert inside the active ride details view.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
              <View style={styles.safetyHeader}>
                <HelpCircle color={t.primary} size={22} />
                <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Community Guidelines</Text>
              </View>
              <Text style={[styles.cardText, { color: t.textSecondary }]}>
                Respect local speed limits, coordinate timings via chat early, and maintain cleanliness inside co-shared vehicles.
              </Text>
            </View>
          </View>
        )}

        {/* CONTACT US TAB */}
        {activeTab === 'contact' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Send Support Request</Text>
            <Text style={[styles.sectionDesc, { color: t.textSecondary }]}>
              Have a problem with a booking, app issue, or suggestion? Submit details below, and our team will get in touch.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Subject</Text>
                <View style={[styles.inputFieldWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <TextInput
                    placeholder="e.g. Booking cancellation issue"
                    placeholderTextColor={t.textSecondary}
                    value={subject}
                    onChangeText={setSubject}
                    style={[styles.inputField, { color: t.textPrimary }]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Description</Text>
                <View style={[styles.inputFieldWrapper, styles.messageWrapper, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <TextInput
                    placeholder="Provide details about your query here..."
                    placeholderTextColor={t.textSecondary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={4}
                    style={[styles.inputField, styles.messageInputField, { color: t.textPrimary }]}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleContactSubmit}
                disabled={loading}
                style={[styles.cta, { backgroundColor: t.primary }]}
              >
                {loading ? (
                  <ActivityIndicator color={t.primaryContrast} />
                ) : (
                  <>
                    <Send size={16} color={t.primaryContrast} strokeWidth={2} />
                    <Text style={[styles.ctaText, { color: t.primaryContrast }]}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Direct Channels */}
            <View style={[styles.directChannels, { borderColor: t.border }]}>
              <Text style={[styles.channelTitle, { color: t.textPrimary }]}>Or email us directly at</Text>
              <View style={styles.channelRow}>
                <Mail size={16} color={t.primary} />
                <Text style={[styles.channelValue, { color: t.textSecondary }]}>support@aroundly.in</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
