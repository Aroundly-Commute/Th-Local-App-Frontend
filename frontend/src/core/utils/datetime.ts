/**
 * Centralized date and time utilities for formatting and manipulating dates/times
 * strictly in Indian Standard Time (IST, UTC+05:30 / Asia/Kolkata).
 */

const IST_TZ = 'Asia/Kolkata';
const LOCALE = 'en-IN';

export function parseDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export function formatISTTime(date: Date | string | number | null | undefined, fallback = '--:--'): string {
  const d = parseDate(date);
  if (!d) return fallback;
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: IST_TZ });
}

export function formatISTDate(date: Date | string | number | null | undefined, includeYear = false, fallback = ''): string {
  const d = parseDate(date);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
    timeZone: IST_TZ,
  });
}

export function formatISTDateTime(date: Date | string | number | null | undefined, fallback = ''): string {
  const d = parseDate(date);
  if (!d) return fallback;
  const datePart = d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', timeZone: IST_TZ });
  const timePart = d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: IST_TZ });
  return `${datePart}, ${timePart}`;
}

export function getISTDateString(date: Date = new Date()): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getISTTimeString(date: Date = new Date()): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
