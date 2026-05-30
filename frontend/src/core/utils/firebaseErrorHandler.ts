export function translateFirebaseError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || error.message || '';
  const message = typeof error === 'string' ? error : (error.message || '');

  // 1. Quota & OTP Attempts Limits (Firebase Free-Tier)
  if (
    code.includes('quota-exceeded') || 
    message.includes('quota exceeded') ||
    code.includes('too-many-requests') ||
    message.includes('too many requests') ||
    message.includes('SMS verification code quota')
  ) {
    return 'Too many attempts. Please try again later.';
  }

  // 2. Auth Popup Cancellations (e.g. Google Sign-In)
  if (
    code.includes('user-dismissed-popup') ||
    message.includes('user dismissed popup') ||
    code.includes('auth/popup-closed-by-user') ||
    message.includes('popup closed by user') ||
    code.includes('auth/canceled-by-user') ||
    message.includes('cancelled')
  ) {
    return 'Login was canceled. Please try again.';
  }

  // 3. Email & Password Validation
  if (code.includes('auth/invalid-email') || message.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('auth/user-disabled') || message.includes('user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }
  if (code.includes('auth/user-not-found') || message.includes('user-not-found')) {
    return 'No account found with this email. Please sign up.';
  }
  if (code.includes('auth/wrong-password') || message.includes('wrong-password')) {
    return 'Incorrect password entered. Please try again.';
  }
  if (
    code.includes('auth/invalid-credential') || 
    message.includes('invalid-credential') ||
    code.includes('auth/invalid-credentials') ||
    message.includes('invalid-credentials')
  ) {
    return 'Invalid email or password entered. Please try again.';
  }
  if (code.includes('auth/email-already-in-use') || message.includes('email-already-in-use')) {
    return 'This email is already registered. Please log in instead.';
  }
  if (code.includes('auth/weak-password') || message.includes('weak-password')) {
    return 'Password should be at least 6 characters long.';
  }

  // 4. Phone OTP Verification
  if (code.includes('auth/invalid-verification-code') || message.includes('invalid-verification-code')) {
    return 'Invalid verification code. Please check and enter it again.';
  }
  if (code.includes('auth/missing-verification-code')) {
    return 'Please enter the 6-digit verification code.';
  }
  if (code.includes('auth/invalid-phone-number') || message.includes('invalid-phone-number')) {
    return 'Please enter a valid phone number including country code.';
  }

  // General Fallback
  return message || 'Authentication failed. Please try again.';
}
