import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safe check for Native Firebase Crashlytics (to ensure it operates safely on Expo Go)
let crashlyticsInstance: any = null;
try {
  crashlyticsInstance = require('@react-native-firebase/crashlytics').default;
} catch (e) {
  // Gracefully falls back in standard Expo Go or unlinked dev environments
}

const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID || 'G-DUMMY4TRACK';
const GA_API_SECRET = process.env.EXPO_PUBLIC_GA_API_SECRET || 'dummy_api_secret_key';

export class AnalyticsService {
  private static clientId: string | null = null;

  /**
   * Initializes the analytics engine. Retrieves or generates a unique Client ID.
   */
  public static async initialize(): Promise<string> {
    try {
      if (this.clientId) return this.clientId;

      // 1. Check persistent AsyncStorage cache
      let cachedId = await AsyncStorage.getItem('@ga_client_id');
      if (!cachedId) {
        // 2. Generate a new pseudo-random UUID
        cachedId = this.generateUUID();
        await AsyncStorage.setItem('@ga_client_id', cachedId);
      }
      
      this.clientId = cachedId;
      console.log(`[Analytics] Initialized GA4 client. Client ID: ${this.clientId}`);
      return this.clientId;
    } catch (err) {
      console.warn('[Analytics] Failed to initialize persistent client ID:', err);
      this.clientId = 'temp_anonymous_client_id';
      return this.clientId;
    }
  }

  /**
   * Dispatches a custom event to Google Analytics 4.
   */
  public static async trackEvent(eventName: string, params: Record<string, any> = {}): Promise<void> {
    try {
      const cid = this.clientId || (await this.initialize());

      // Enrich payload with platform metadata
      const enrichedParams = {
        ...params,
        platform: Platform.OS,
        os_version: Platform.Version,
        device_name: Constants.deviceName || 'Unknown Device',
        app_version: Constants.expoConfig?.version || '1.0.0',
        engagement_time_msec: Date.now(),
      };

      console.log(`[Analytics] Track Event: "${eventName}"`, enrichedParams);

      // Bypasses endpoint dispatch if dummy key is present in local dev to save requests
      if (GA_MEASUREMENT_ID === 'G-DUMMY4TRACK') {
        return;
      }

      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: cid,
          events: [
            {
              name: eventName,
              params: enrichedParams,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.warn(`[Analytics] GA4 dispatch failed with status: ${response.status}`);
      }
    } catch (err) {
      console.error('[Analytics] Event dispatch exception error:', err);
    }
  }

  /**
   * Tracks user screen navigations.
   */
  public static async trackScreen(screenName: string): Promise<void> {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      page_title: screenName,
    });
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
   * Captures exceptions and error states.
   */
  public static async trackError(message: string, fatal: boolean = false, extra: Record<string, any> = {}): Promise<void> {
    // 1. Log to Google Analytics Event Streams
    await this.trackEvent('exception', {
      description: message,
      fatal: fatal ? 'true' : 'false',
      ...extra,
    });

    // 2. Report natively to Firebase Crashlytics if the client is compiled with native SDKs
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

        // Record custom crash/error stack trace
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
   * CALL THIS ONLY IN DEVELOPMENT / NATIVE DEV BUILDS TO VERIFY FIREBASE.
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
