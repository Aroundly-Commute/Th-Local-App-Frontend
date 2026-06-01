import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { spacing } from '../src/core/theme/theme';
import { tap } from '../src/core/utils/haptics';
import { privacyHtml } from '../src/core/utils/privacyHtml';

// Dynamically require WebView on native platforms to prevent web bundler issues
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('react-native-webview could not be loaded dynamically:', e);
  }
}

export default function PrivacyScreen() {
  const router = useRouter();

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color="#000000" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.webContentContainer}
        >
          <div 
            style={{ 
              fontFamily: 'Arial, sans-serif', 
              color: '#333333', 
              lineHeight: '1.6', 
              fontSize: '15px' 
            }} 
            dangerouslySetInnerHTML={{ __html: privacyHtml }} 
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color="#000000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>
      {WebView ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: privacyHtml }}
          style={styles.webview}
          textZoom={100}
          domStorageEnabled={true}
          javaScriptEnabled={true}
        />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.loadingText}>Loading Privacy Policy...</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: spacing.lg,
  },
  webContentContainer: {
    padding: spacing.lg,
    maxWidth: 850,
    width: '100%',
    alignSelf: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
});
