import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, BellOff } from 'lucide-react-native';
import { lightTheme, spacing, radius } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';
import { api } from '../../../core/api/api';
import { WebPermissionModal } from '../../../core/components/WebPermissionModal';

export default function NotificationsScreen() {
  const t = lightTheme;
  const router = useRouter();
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);
  const [webPermissionModalVisible, setWebPermissionModalVisible] = useState(false);

  const checkNotificationPermission = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setHasNotificationPermission(Notification.permission === 'granted');
      } else {
        setHasNotificationPermission(false);
      }
    } else {
      try {
        const messaging = require('@react-native-firebase/messaging').default;
        const authStatus = await messaging().hasPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        setHasNotificationPermission(enabled);
      } catch (err) {
        console.warn('Failed checking native notification permissions:', err);
        setHasNotificationPermission(false);
      }
    }
  };

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const handleEnableNotifications = async () => {
    tap();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const status = await Notification.requestPermission();
        const granted = status === 'granted';
        setHasNotificationPermission(granted);
        if (granted) {
          // Try to retrieve and cache FCM token
          try {
            const { getMessaging, getToken } = require('firebase/messaging');
            const { initializeApp, getApps, getApp } = require('firebase/app');
            const firebaseConfig = {
              apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAOU3gODihgxONXDpTfnNz6Q65MZAlzqFg",
              authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "aroundyou-497203.firebaseapp.com",
              projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "aroundyou-497203",
              storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "aroundyou-497203.firebasestorage.app",
              messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "233722731121",
              appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:233722731121:web:654c7c8efa3f6e2e2d19d0"
            };
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            const messagingInstance = getMessaging(app);
            const registration = await navigator.serviceWorker.getRegistration();
            const vapidKey = process.env.EXPO_PUBLIC_VAPID_KEY;
            if (registration && vapidKey) {
              const token = await getToken(messagingInstance, {
                serviceWorkerRegistration: registration,
                vapidKey
              });
              if (token) {
                await api.patch('/auth/fcm-token', { fcmToken: token });
                await AsyncStorage.setItem('@fcm_token', token);
              }
            }
          } catch (e) {
            console.warn('[FCM Web] Web push registration failed:', e);
          }
        } else {
          setWebPermissionModalVisible(true);
        }
      } else {
        setWebPermissionModalVisible(true);
      }
    } else {
      try {
        const messaging = require('@react-native-firebase/messaging').default;
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        setHasNotificationPermission(enabled);
        
        if (enabled) {
          const token = await messaging().getToken();
          if (token) {
            await api.patch('/auth/fcm-token', { fcmToken: token });
            await AsyncStorage.setItem('@fcm_token', token);
          }
        } else {
          Linking.openSettings().catch((err) => console.error('Failed to open settings:', err));
        }
      } catch (err) {
        console.warn('Failed requesting native notification permissions, trying settings open:', err);
        Linking.openSettings().catch((err) => console.error('Failed to open settings:', err));
      }
    }
  };

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: t.muted }]}>
          <BellOff color={t.textSecondary} size={36} />
        </View>
        <Text style={[styles.title, { color: t.textPrimary }]}>No notifications yet</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          We will let you know when we match you with a Cab Buddy, coordinate a carpool, or update your ride requests.
        </Text>

        {/* Prompt to enable notification permissions when missing/denied */}
        {hasNotificationPermission === false && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEnableNotifications}
            style={[styles.enableBtn, { backgroundColor: t.primary }]}
          >
            <Text style={styles.enableBtnText}>Enable Push Notifications</Text>
          </TouchableOpacity>
        )}
      </View>

      <WebPermissionModal
        visible={webPermissionModalVisible}
        onClose={() => setWebPermissionModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  enableBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
