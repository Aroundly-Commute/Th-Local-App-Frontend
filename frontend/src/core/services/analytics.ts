import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safe check for Native Firebase Analytics (ensures safe fallback operation on Expo Go)
let getAnalyticsNative: any = null;
let logEventNative: any = null;
let setAnalyticsCollectionEnabledNative: any = null;

if (Platform.OS !== 'web') {
  try {
    const nativeAnalytics = require('@react-native-firebase/analytics');
    getAnalyticsNative = nativeAnalytics.getAnalytics;
    logEventNative = nativeAnalytics.logEvent;
    setAnalyticsCollectionEnabledNative = nativeAnalytics.setAnalyticsCollectionEnabled;
  } catch (e) {
    // Gracefully falls back in standard Expo Go or unlinked dev environments
  }
}

// Safe check for Native Firebase Crashlytics
let getCrashlyticsNative: any = null;
let setAttributesNative: any = null;
let setUserIdNative: any = null;
let recordErrorNative: any = null;
let crashNative: any = null;

if (Platform.OS !== 'web') {
  try {
    const nativeCrashlytics = require('@react-native-firebase/crashlytics');
    getCrashlyticsNative = nativeCrashlytics.getCrashlytics;
    setAttributesNative = nativeCrashlytics.setAttributes;
    setUserIdNative = nativeCrashlytics.setUserId;
    recordErrorNative = nativeCrashlytics.recordError;
    crashNative = nativeCrashlytics.crash;
  } catch (e) {
    // Gracefully falls back in standard Expo Go or unlinked dev environments
  }
}

// Safe check for Web Firebase Analytics
let webAnalyticsInstance: any = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const { getApp } = require('firebase/app');
    const app = getApp();
    const placeholderWebId = "1:233722731121:web:642f3868b99992972d19d0";

    if (app.options.appId && app.options.appId !== placeholderWebId) {
      const { getAnalytics } = require('firebase/analytics');
      webAnalyticsInstance = getAnalytics();
    } else {
      console.warn('[Analytics] Skipping Web Firebase Analytics initialization: Placeholder/Invalid Web appId detected.');
    }
  } catch (e) {
    // Ad-blockers or failed initialization fallback
    console.warn('[Analytics] Web Firebase Analytics is blocked or not configured:', e);
  }
}

export class AnalyticsService {
  private static clientId: string | null = null;

  /**
   * Initializes the appropriate Firebase Analytics engine.
   */
  public static async initialize(): Promise<string> {
    try {
      if (Platform.OS !== 'web' && getAnalyticsNative && setAnalyticsCollectionEnabledNative) {
        console.log('[Analytics] Initializing native Firebase Analytics (Modular)...');
        const analytics = getAnalyticsNative();
        await setAnalyticsCollectionEnabledNative(analytics, true);
      }
      
      // Keep unique ClientID generation for session consistency
      let cachedId = await AsyncStorage.getItem('@ga_client_id');
      if (!cachedId) {
        cachedId = this.generateUUID();
        await AsyncStorage.setItem('@ga_client_id', cachedId);
      }
      this.clientId = cachedId;
      return this.clientId;
    } catch (err) {
      console.warn('[Analytics] Failed to initialize Firebase Analytics:', err);
      return 'firebase_analytics_fallback';
    }
  }

  /**
   * Dispatches a custom event to Firebase Analytics.
   */
  public static async trackEvent(eventName: string, params: Record<string, any> = {}): Promise<void> {
    try {
      // Sanitize event name to comply with Firebase requirements (lowercase, alpha-numeric, underscores)
      const sanitizedName = eventName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      // Enrich payload with platform metadata
      const enrichedParams = {
        ...params,
        platform: Platform.OS,
        os_version: String(Platform.Version),
        device_name: Constants.deviceName || 'Unknown Device',
        app_version: Constants.expoConfig?.version || '1.0.0',
      };

      console.log(`[Analytics] Log Event: "${sanitizedName}"`, enrichedParams);

      if (Platform.OS === 'web') {
        if (webAnalyticsInstance) {
          const { logEvent } = require('firebase/analytics');
          logEvent(webAnalyticsInstance, sanitizedName, enrichedParams);
        }
      } else {
        if (logEventNative && getAnalyticsNative) {
          const analytics = getAnalyticsNative();
          await logEventNative(analytics, sanitizedName, enrichedParams);
        }
      }
    } catch (err) {
      console.warn('[Analytics] Failed to log Firebase Event:', err);
    }
  }

  /**
   * Tracks user screen navigations.
   */
  public static async trackScreen(screenName: string): Promise<void> {
    try {
      console.log(`[Analytics] Log Screen View: "${screenName}"`);
      
      if (Platform.OS === 'web') {
        if (webAnalyticsInstance) {
          const { logEvent } = require('firebase/analytics');
          logEvent(webAnalyticsInstance, 'screen_view', {
            screen_name: screenName,
            screen_class: screenName,
          });
        }
      } else {
        if (logEventNative && getAnalyticsNative) {
          const analytics = getAnalyticsNative();
          await logEventNative(analytics, 'screen_view', {
            screen_name: screenName,
            screen_class: screenName,
          });
        }
      }
    } catch (err) {
      console.warn('[Analytics] Failed to log Screen View:', err);
    }
  }

  /**
   * Captures application warnings and validation alerts.
   */
  public static async trackWarning(message: string, extra: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('app_warning', {
      warning_message: message,
      ...extra,
    });
  }

  /**
   * Captures exceptions and error states, sending them to Firebase Analytics & Crashlytics.
   */
  public static async trackError(message: string, fatal: boolean = false, extra: Record<string, any> = {}): Promise<void> {
    // 1. Log Google Analytics Event (both Web and Native)
    await this.trackEvent('app_exception', {
      description: message,
      fatal: fatal ? 'true' : 'false',
      ...extra,
    });

    // 2. Report natively to Firebase Crashlytics
    if (Platform.OS !== 'web') {
      try {
        if (getCrashlyticsNative) {
          const crashlytics = getCrashlyticsNative();
          const attributes = {
            fatal: fatal ? 'true' : 'false',
            platform: Platform.OS,
            os_version: String(Platform.Version),
            app_version: Constants.expoConfig?.version || '1.0.0',
            ...extra,
          };

          if (setAttributesNative) {
            await setAttributesNative(crashlytics, attributes);
          }

          if (this.clientId && setUserIdNative) {
            await setUserIdNative(crashlytics, this.clientId);
          }

          if (recordErrorNative) {
            await recordErrorNative(crashlytics, new Error(message));
          }
          
          if (fatal) {
            console.warn('[Analytics] Uncaught Fatal Exception recorded in Firebase Crashlytics.');
          }
        }
      } catch (err) {
        console.warn('[Analytics] Failed to report error to Firebase Crashlytics:', err);
      }
    } else {
      // For Web: We leave a console breadcrumb showing the captured exception state
      console.error(`[Analytics Web Breadcrumb] Non-Fatal Error Captured: "${message}"`, {
        fatal,
        client_id: this.clientId,
        ...extra
      });
    }
  }

  /**
   * Intentionally triggers a native crash to test Firebase Crashlytics.
   */
  public static triggerMockCrash(): void {
    try {
      if (Platform.OS !== 'web' && getCrashlyticsNative && crashNative) {
        console.log('[Analytics] Invoking intentional native crash inside Crashlytics...');
        const crashlytics = getCrashlyticsNative();
        crashNative(crashlytics);
      } else {
        console.warn('[Analytics] Crashlytics native module is not active. (Are you running in Web or Expo Go?)');
      }
    } catch (e) {
      console.error('[Analytics] Failed to trigger intentional crashlytics crash:', e);
    }
  }

  /**
   * Basic pseudo-random UUID generator.
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
