import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safe check for Native Firebase Analytics (ensures safe fallback operation on Expo Go)
let firebaseAnalyticsInstance: any = null;
try {
  firebaseAnalyticsInstance = require('@react-native-firebase/analytics').default;
} catch (e) {
  // Gracefully falls back in standard Expo Go or unlinked dev environments
}

// Safe check for Native Firebase Crashlytics
let crashlyticsInstance: any = null;
try {
  crashlyticsInstance = require('@react-native-firebase/crashlytics').default;
} catch (e) {
  // Gracefully falls back in standard Expo Go or unlinked dev environments
}

export class AnalyticsService {
  private static clientId: string | null = null;

  /**
   * Initializes the native Firebase Analytics engine.
   */
  public static async initialize(): Promise<string> {
    try {
      if (firebaseAnalyticsInstance) {
        console.log('[Analytics] Initializing native Firebase Analytics...');
        await firebaseAnalyticsInstance().setAnalyticsCollectionEnabled(true);
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
      console.warn('[Analytics] Failed to initialize native Firebase Analytics:', err);
      return 'native_firebase_analytics_fallback';
    }
  }

  /**
   * Dispatches a custom event natively to Firebase Analytics.
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

      console.log(`[Analytics] Log Firebase Event: "${sanitizedName}"`, enrichedParams);

      if (firebaseAnalyticsInstance) {
        await firebaseAnalyticsInstance().logEvent(sanitizedName, enrichedParams);
      }
    } catch (err) {
      console.warn('[Analytics] Failed to log native Firebase Event:', err);
    }
  }

  /**
   * Tracks user screen navigations natively in Firebase.
   */
  public static async trackScreen(screenName: string): Promise<void> {
    try {
      console.log(`[Analytics] Log Screen View: "${screenName}"`);
      
      if (firebaseAnalyticsInstance) {
        await firebaseAnalyticsInstance().logScreenView({
          screen_name: screenName,
          screen_class: screenName,
        });
      }
    } catch (err) {
      console.warn('[Analytics] Failed to log native Screen View:', err);
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
    // 1. Log native Firebase Analytics Event
    await this.trackEvent('app_exception', {
      description: message,
      fatal: fatal ? 'true' : 'false',
      ...extra,
    });

    // 2. Report natively to Firebase Crashlytics
    try {
      if (crashlyticsInstance) {
        const crash = crashlyticsInstance();
        
        crash.setAttributes({
          fatal: fatal ? 'true' : 'false',
          platform: Platform.OS,
          os_version: String(Platform.Version),
          app_version: Constants.expoConfig?.version || '1.0.0',
          ...extra,
        });

        if (this.clientId) {
          crash.setUserId(this.clientId);
        }

        // Record custom exception stack trace
        crash.recordError(new Error(message));
        
        if (fatal) {
          console.warn('[Analytics] Uncaught Fatal Exception recorded in Firebase Crashlytics.');
        }
      }
    } catch (err) {
      console.warn('[Analytics] Failed to report error to Firebase Crashlytics:', err);
    }
  }

  /**
   * Intentionally triggers a native crash to test Firebase Crashlytics.
   */
  public static triggerMockCrash(): void {
    try {
      if (crashlyticsInstance) {
        console.log('[Analytics] Invoking intentional native crash inside Crashlytics...');
        crashlyticsInstance().crash();
      } else {
        console.warn('[Analytics] Crashlytics native module is not active. (Are you running in Expo Go?)');
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
