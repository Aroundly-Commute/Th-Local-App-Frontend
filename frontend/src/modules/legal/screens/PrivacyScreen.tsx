import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { ChevronLeft } from 'lucide-react-native';
import { tap } from '../../../core/utils/haptics';
import { privacyHtml } from '../../../core/utils/privacyHtml';
import { styles } from './Privacy.styles';

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
        <Head>
          <title>Privacy Policy - Aroundly</title>
          <meta name="description" content="Read the Privacy Policy of Aroundly. Learn how we protect your information, account details, and commute data." />
          <link rel="canonical" href="https://www.aroundly.in/privacy" />
          <meta property="og:title" content="Privacy Policy - Aroundly" />
          <meta property="og:url" content="https://www.aroundly.in/privacy" />
          <meta property="twitter:title" content="Privacy Policy - Aroundly" />
          <meta property="twitter:url" content="https://www.aroundly.in/privacy" />
        </Head>
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
