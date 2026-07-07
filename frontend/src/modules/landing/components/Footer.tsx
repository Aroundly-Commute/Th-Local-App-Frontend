import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface FooterProps {
  isDesktop: boolean;
}

export function Footer({ isDesktop }: FooterProps) {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <View style={[styles.footerContent, isDesktop ? styles.row : styles.column]}>
        <View style={[styles.footerLeft, isDesktop ? { width: '40%' } : { width: '100%', marginBottom: 30 }]}>
          <Image
            source={require('../../../../assets/images/app_Icon.png')}
            style={{ 
              width: 50, 
              height: 50, 
              resizeMode: 'contain', 
              backgroundColor: '#FFFFFF', 
              borderRadius: 10,
              padding: 4,
              marginBottom: 16 
            }}
          />
          <Text style={styles.footerText}>
            {"Aroundly is India's leading commuter ride-sharing and split-fare matching application. Travel smarter, reduce emissions, and split bills seamlessly."}
          </Text>
        </View>
        <View style={[styles.footerRight, isDesktop ? { width: '60%' } : { width: '100%' }]}>
          <View style={styles.footerCol}>
            <Text style={styles.footerColTitle}>Company</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/help')}><Text style={styles.footerLink}>Help & Support</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/coming-soon')}><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerColTitle}>Legal & SEO</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.aroundly.in/robots.txt')}><Text style={styles.footerLink}>Robots.txt</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.aroundly.in/sitemap.xml')}><Text style={styles.footerLink}>Sitemap.xml</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/delete-account')}><Text style={styles.footerLink}>Delete Account</Text></TouchableOpacity>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerColTitle}>Support</Text>
            <Text style={styles.footerLink}>support@aroundly.in</Text>
            <Text style={styles.footerLink}>Gurgaon, Haryana, India</Text>
          </View>
        </View>
      </View>
      <View style={styles.footerBottom}>
        <Text style={styles.copyright}>© 2026 Aroundly India. All rights reserved. Built for smarter, green commutes.</Text>
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
  footer: {
    backgroundColor: '#0A1628',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  footerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#142E58',
    paddingBottom: 40,
    marginBottom: 24,
  },
  footerLeft: {
    paddingRight: 20,
  },
  footerText: {
    color: '#889EB5',
    fontSize: 13,
    lineHeight: 20,
  },
  footerRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 30,
  },
  footerCol: {
    minWidth: 120,
  },
  footerColTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  footerLink: {
    color: '#889EB5',
    fontSize: 13,
    marginBottom: 10,
  },
  footerBottom: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  copyright: {
    color: '#556A80',
    fontSize: 11,
    textAlign: 'center',
  },
});
