import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { verdexColors } from '../../../core/theme/theme';

export function CabBuddySimulator() {
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(true);
  const demoIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isDemoPlaying) {
      demoIntervalRef.current = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 3);
      }, 3500);
    }
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [isDemoPlaying]);

  const selectDemoStep = (step: number) => {
    setIsDemoPlaying(false);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    setDemoStep(step);
  };

  return (
    <View style={styles.simulatorCard}>
      <View style={styles.simHeader}>
        <View style={styles.redDot} />
        <View style={styles.yellowDot} />
        <View style={styles.greenDot} />
        <Text style={styles.simTitle}>Cab Buddy Matcher Simulator</Text>
      </View>

      {/* Demo view based on step */}
      <View style={styles.simBody}>
        {demoStep === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Searching route matches...</Text>
            <View style={styles.matchingBox}>
              <View style={styles.avatarRow}>
                <View style={styles.demoAvatarContainer}>
                  <Text style={styles.avatarInitial}>A</Text>
                  <Text style={styles.avatarLabel}>Ayaan</Text>
                </View>
                <View style={styles.radarPulse}>
                  <ActivityIndicator color={verdexColors.lime} size="small" />
                  <Text style={styles.radarText}>Scanning...</Text>
                </View>
                <View style={styles.demoAvatarContainer}>
                  <Text style={styles.avatarInitial}>A</Text>
                  <Text style={styles.avatarLabel}>Anaya</Text>
                </View>
              </View>
              <View style={styles.routeDetails}>
                <MapPin size={14} color={verdexColors.lime} />
                <Text style={styles.routeText}>Dest: Cyber City, Gurgaon</Text>
              </View>
            </View>
          </View>
        )}

        {demoStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: verdexColors.lime }]}>🎉 Step 2: Cab Buddy Match Found!</Text>
            <View style={styles.matchedBox}>
              <View style={styles.matchStats}>
                <Text style={styles.matchPercent}>94% Overlap</Text>
                <Text style={styles.matchSub}>Highly compatible commuter route</Text>
              </View>
              <View style={styles.ridePathCard}>
                <View style={styles.pathNode}>
                  <View style={styles.nodePoint} />
                  <Text style={styles.nodeText}>Start: Sector 62 / Sector 63</Text>
                </View>
                <View style={styles.pathLine} />
                <View style={styles.pathNode}>
                  <View style={[styles.nodePoint, { backgroundColor: verdexColors.lime }]} />
                  <Text style={styles.nodeText}>End: Cyber City</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {demoStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: '#4DE8D8' }]}>💰 Step 3: Fare Split & Save!</Text>
            <View style={styles.splitBox}>
              <View style={styles.fareComparison}>
                <View style={styles.fareBarSingle}>
                  <Text style={styles.fareBarLabel}>Solo ride cost</Text>
                  <View style={styles.barSolo} />
                  <Text style={styles.fareCost}>₹360</Text>
                </View>
                <View style={styles.fareBarShared}>
                  <Text style={styles.fareBarLabel}>With Cab Buddy</Text>
                  <View style={styles.barShared} />
                  <Text style={[styles.fareCost, { color: verdexColors.lime }]}>₹180 each</Text>
                </View>
              </View>
              <View style={styles.savingsTag}>
                <Text style={styles.savingsText}>You saved 50% on your travel cost!</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Step indicator controls */}
      <View style={styles.simControls}>
        {[0, 1, 2].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => selectDemoStep(s)}
            style={[
              styles.indicatorDot,
              demoStep === s ? styles.indicatorActive : styles.indicatorInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.simHint}>Demo loops automatically. Click dots to control.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  simulatorCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F2240',
    borderRadius: 16,
    borderColor: '#1A4070',
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#142E58',
    paddingBottom: 12,
    marginBottom: 16,
  },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5F56', marginRight: 6 },
  yellowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFBD2E', marginRight: 6 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#27C93F', marginRight: 10 },
  simTitle: { color: '#889EB5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  simBody: {
    minHeight: 180,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'stretch',
  },
  stepTitle: {
    color: '#A0B2C6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  matchingBox: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#142E58',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  demoAvatarContainer: {
    alignItems: 'center',
  },
  avatarInitial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E40af',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
    fontSize: 18,
    fontWeight: '700',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  radarPulse: {
    alignItems: 'center',
  },
  radarText: {
    color: '#00E5CC',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    color: '#A0B2C6',
    fontSize: 12,
  },
  matchedBox: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00B5A0',
  },
  matchStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00E5CC',
  },
  matchSub: {
    fontSize: 11,
    color: '#889EB5',
    marginTop: 2,
  },
  ridePathCard: {
    gap: 2,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nodePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  nodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pathLine: {
    width: 2,
    height: 16,
    backgroundColor: '#142E58',
    marginLeft: 3,
  },
  splitBox: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4DE8D8',
  },
  fareComparison: {
    gap: 12,
    marginBottom: 16,
  },
  fareBarSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareBarShared: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareBarLabel: {
    color: '#A0B2C6',
    fontSize: 11,
    width: 90,
  },
  barSolo: {
    flex: 1,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  barShared: {
    flex: 1,
    height: 8,
    backgroundColor: '#00E5CC',
    borderRadius: 4,
    marginHorizontal: 10,
    width: '50%',
  },
  fareCost: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    width: 70,
    textAlign: 'right',
  },
  savingsTag: {
    backgroundColor: '#0F2240',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  savingsText: {
    color: '#4DE8D8',
    fontSize: 11,
    fontWeight: '700',
  },
  simControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 14,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#00E5CC',
    width: 18,
  },
  indicatorInactive: {
    backgroundColor: '#1A4070',
  },
  simHint: {
    color: '#889EB5',
    fontSize: 10,
    textAlign: 'center',
  },
});
