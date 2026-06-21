import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SeoTextProps {
  t: any;
}

export function SeoText({ t }: SeoTextProps) {
  return (
    <View style={[styles.seoCopySection, { backgroundColor: t.surfaceElevated }]}>
      <View style={styles.seoContent}>
        <Text style={[styles.seoH2, { color: t.textPrimary }]}>Aroundly: India's Premium Carpool & Split Fare Cab Sharing Platform</Text>
        <Text style={[styles.seoParagraph, { color: t.textSecondary }]}>
          In today's urban commute environment across major Indian metropolises like Bengaluru, Delhi, Mumbai, Pune, and Gurgaon, travel expenses are skyrocketing. Aroundly offers an integrated commuting software app designed to tackle these cost and environment concerns. By combining **corporate carpooling, daily car sharing, bus-metro public transport timing**, and our signature **Cab Buddy split fare matching**, we empower users to commute smarter.
        </Text>
        <Text style={[styles.seoParagraph, { color: t.textSecondary }]}>
          When two random people search for a ride to cyber hubs or office sectors, Aroundly matches them to share the fare. Searching for a **carpool near me**, **cab sharing app Bangalore**, or **taxi split bill app India**? Aroundly is your all-in-one answer. Sign in today using Google or your phone number to find a verified buddy, share cab rides, and start saving!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seoCopySection: {
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  seoContent: {
    maxWidth: 1000,
    alignSelf: 'center',
  },
  seoH2: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  seoParagraph: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
});
