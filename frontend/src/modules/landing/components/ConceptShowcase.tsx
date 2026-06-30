import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface ConceptShowcaseProps {
  isDesktop: boolean;
}

export function ConceptShowcase({ isDesktop }: ConceptShowcaseProps) {
  return (
    <View id="cab-buddy" style={[styles.conceptSection, { backgroundColor: '#0F2240' }]}>
      <View style={[styles.conceptContent, isDesktop ? styles.row : styles.column]}>
        <View style={[styles.conceptLeft, isDesktop ? { width: '45%' } : { width: '100%', marginBottom: 30 }]}>
          <Image
            source={require('../../../../assets/images/app-image.webp')}
            style={styles.conceptImage}
          />
        </View>
        <View style={[styles.conceptRight, isDesktop ? { width: '55%', paddingLeft: 40 } : { width: '100%' }]}>
          <Text style={styles.conceptPreTitle}>THE CAB BUDDY CONCEPT</Text>
          <Text style={styles.conceptTitle}>How two random strangers save ₹10,000+ monthly</Text>
          <Text style={styles.conceptDesc}>
            Cab Buddy is a revolutionary taxi-sharing system designed for commuters in high-traffic Indian metro areas. When you want to travel to a destination, instead of booking an expensive single-passenger cab, Aroundly scans your neighborhood for matches.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepListItem}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepItemTitle}>Enter Your Destination</Text>
                <Text style={styles.stepItemDesc}>Type where you want to go. The app instantly begins locating users on similar trajectories.</Text>
              </View>
            </View>

            <View style={styles.stepListItem}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepItemTitle}>Get Paired & Chat</Text>
                <Text style={styles.stepItemDesc}>Connect with your verified Cab Buddy via in-app chat. Filter matches by rating, company, or gender.</Text>
              </View>
            </View>

            <View style={styles.stepListItem}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepItemTitle}>Ride & Split Fares</Text>
                <Text style={styles.stepItemDesc}>Book your cab (Ola, Uber, or local taxi), ride together safely, and split the final bill 50/50 instantly.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  conceptSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  conceptContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  conceptLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptImage: {
    width: '100%',
    maxWidth: 320,
    height: 380,
    resizeMode: 'contain',
  },
  conceptRight: {
    justifyContent: 'center',
  },
  conceptPreTitle: {
    color: '#00E5CC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  conceptTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 18,
  },
  conceptDesc: {
    color: '#A0B2C6',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 30,
  },
  stepsList: {
    gap: 20,
  },
  stepListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#142E58',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: {
    color: '#00E5CC',
    fontWeight: '700',
    fontSize: 14,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepItemDesc: {
    color: '#A0B2C6',
    fontSize: 13,
    lineHeight: 20,
  },
});
