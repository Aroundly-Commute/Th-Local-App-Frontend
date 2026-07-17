/**
 * Deep Link Handling Utility
 * Provides clear, modular functions for generating and resolving ticket deep links
 * across native app schemes and web fallbacks.
 */

export const APP_SCHEME = 'aroundly';
export const ALT_APP_SCHEME = 'frontend';
export const DEFAULT_WEB_DOMAIN = 'https://aroundly.app';

/**
 * Generates universal ticket deep link URL for QR codes.
 * When scanned:
 * - If app is installed, the OS opens the app directly via universal link or scheme redirection.
 * - If app is NOT installed, standard browser opens the ticket web view.
 */
export function getTicketDeepLinkUrl(ticketId: string, spotName?: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_WEB_URL || process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_WEB_DOMAIN;
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const query = spotName ? `?spot=${encodeURIComponent(spotName)}` : '';
  return `${cleanBase}/parking/ticket/${ticketId}${query}`;
}

/**
 * Generates native app scheme URI for direct internal app navigation.
 */
export function getTicketAppSchemeUri(ticketId: string, spotName?: string): string {
  const query = spotName ? `?spot=${encodeURIComponent(spotName)}` : '';
  return `${APP_SCHEME}://parking/ticket/${ticketId}${query}`;
}

/**
 * Web fallback handler: Attempts to launch native app if available,
 * otherwise stays on web page seamlessly.
 */
export function attemptNativeAppOpenOnWeb(ticketId: string, spotName?: string) {
  if (typeof window === 'undefined') return;

  const appUri = getTicketAppSchemeUri(ticketId, spotName);

  // Try opening native app scheme
  const start = Date.now();
  try {
    window.location.href = appUri;
  } catch (err) {
    console.warn('[DEEPLINK] Could not trigger native scheme on web:', err);
  }

  // If app is not installed, window focus remains after 1500ms
  setTimeout(() => {
    if (Date.now() - start < 2000) {
      console.log('[DEEPLINK] Remaining on web ticket view.');
    }
  }, 1500);
}
