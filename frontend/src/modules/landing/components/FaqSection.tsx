import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HelpCircle } from 'lucide-react-native';

interface FaqSectionProps {
  t: any;
}

export function FaqSection({ t }: FaqSectionProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is a 'Cab Buddy'?",
      a: "Cab Buddy is a smart ride-sharing matching algorithm. If you want to travel to a destination (e.g. from Sector 62 to Cyber City) and do not want to bear full cab fares alone, Cab Buddy pairs you with another verified traveler heading on the exact same route. You can coordinate, book a cab, and split the final bill."
    },
    {
      q: "Is it safe to ride with random people?",
      a: "Safety is our priority. Every user on Aroundly must verify their email, mobile phone number, and Google profile. We offer safety filters (like 'Same Gender Matches Only' and corporate company verification) so you only share rides with people you feel comfortable with."
    },
    {
      q: "How are payments split?",
      a: "Aroundly computes the overlapping mileage and provides a direct split-fare recommendation. Once you reach your destination, you can split the payment using in-app wallet settlements or peer-to-peer UPI transfers instantly."
    }
  ];

  return (
    <View id="faq" style={[styles.section, { backgroundColor: t.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionPreTitle, { color: t.textSecondary }]}>QUESTIONS & ANSWERS</Text>
        <Text style={[styles.sectionTitleText, { color: t.textPrimary }]}>Frequently Asked Questions</Text>
      </View>

      <View style={styles.faqList}>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            style={[styles.faqItem, { borderColor: t.border }]}
            activeOpacity={0.85}
          >
            <View style={styles.faqQuestionRow}>
              <Text style={[styles.faqQuestion, { color: t.textPrimary }]}>{faq.q}</Text>
              <HelpCircle size={18} color={t.textTertiary} />
            </View>
            {expandedFaq === index && (
              <Text style={[styles.faqAnswer, { color: t.textSecondary }]}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    marginBottom: 60,
  },
  sectionPreTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  faqList: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  faqItem: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
});
