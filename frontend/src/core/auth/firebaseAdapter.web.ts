import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

// Extract Firebase config from the same project settings (mirroring google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyAOU3gODihgxONXDpTfnNz6Q65MZAlzqFg",
  authDomain: "aroundyou-497203.firebaseapp.com",
  projectId: "aroundyou-497203",
  storageBucket: "aroundyou-497203.firebasestorage.app",
  messagingSenderId: "233722731121",
  appId: "1:233722731121:web:654c7c8efa3f6e2e2d19d0"
};

// Initialize Firebase App for Web if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const webAuth = getAuth(app);

// Keep a cached instance of the invisible reCAPTCHA verifier
let recaptchaVerifier: any = null;

/**
 * Dynamically creates a hidden DOM container and instantiates an invisible reCAPTCHA verifier for Web.
 */
const getRecaptchaVerifier = () => {
  if (typeof window === 'undefined') return null;

  if (recaptchaVerifier) return recaptchaVerifier;

  try {
    // 1. Check/create a hidden recaptcha container on document body
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      
      // Hide the container offscreen invisibly
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-99999';
      
      document.body.appendChild(container);
    }

    // 2. Initialize invisible RecaptchaVerifier
    const { RecaptchaVerifier } = require('firebase/auth');
    recaptchaVerifier = new RecaptchaVerifier(webAuth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved silently
      },
      'expired-callback': () => {
        // reCAPTCHA expired, reset it
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
          recaptchaVerifier = null;
        }
      }
    });

    return recaptchaVerifier;
  } catch (error) {
    console.error('[Firebase Web Auth] Failed to initialize invisible reCAPTCHA:', error);
    return null;
  }
};

// Mirror the Firebase React Native SDK interface structure
const authWeb = () => {
  return {
    get currentUser() {
      const user = webAuth.currentUser;
      if (!user) return null;
      return {
        ...user,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        uid: user.uid,
        reload: async () => {
          await user.reload();
        },
        getIdToken: async (forceRefresh?: boolean) => {
          return await user.getIdToken(forceRefresh);
        },
        updateProfile: async (profile: { displayName?: string | null; photoURL?: string | null }) => {
          await updateProfile(user, profile);
        },
        sendEmailVerification: async () => {
          await sendEmailVerification(user);
        }
      };
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      return onAuthStateChanged(webAuth, (user) => {
        if (!user) {
          callback(null);
        } else {
          callback({
            ...user,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            uid: user.uid,
            reload: async () => {
              await user.reload();
            },
            getIdToken: async (forceRefresh?: boolean) => {
              return await user.getIdToken(forceRefresh);
            },
            updateProfile: async (profile: { displayName?: string | null; photoURL?: string | null }) => {
              await updateProfile(user, profile);
            },
            sendEmailVerification: async () => {
              await sendEmailVerification(user);
            }
          });
        }
      });
    },
    signInWithEmailAndPassword: async (email: string, password: string) => {
      const res = await signInWithEmailAndPassword(webAuth, email, password);
      return {
        user: {
          ...res.user,
          getIdToken: async (forceRefresh?: boolean) => {
            return await res.user.getIdToken(forceRefresh);
          }
        }
      };
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      const res = await createUserWithEmailAndPassword(webAuth, email, password);
      return {
        user: {
          ...res.user,
          getIdToken: async (forceRefresh?: boolean) => {
            return await res.user.getIdToken(forceRefresh);
          },
          updateProfile: async (profile: { displayName?: string | null; photoURL?: string | null }) => {
            await updateProfile(res.user, profile);
          },
          sendEmailVerification: async () => {
            await sendEmailVerification(res.user);
          }
        }
      };
    },
    signInWithCredential: async (credential: any) => {
      const res = await signInWithCredential(webAuth, credential);
      return {
        user: {
          ...res.user,
          getIdToken: async (forceRefresh?: boolean) => {
            return await res.user.getIdToken(forceRefresh);
          },
          displayName: res.user.displayName,
          email: res.user.email
        }
      };
    },
    signOut: async () => {
      await signOut(webAuth);
    },
    signInWithPhoneNumber: async (phoneNumber: string) => {
      // Automatically pull or create the invisible Web reCAPTCHA verifier
      const verifier = getRecaptchaVerifier();
      if (!verifier) {
        throw new Error('Google reCAPTCHA verification is required but failed to initialize.');
      }

      const { signInWithPhoneNumber: fbSignIn } = require('firebase/auth');
      const confirmationResult = await fbSignIn(webAuth, phoneNumber, verifier);
      
      return {
        confirm: async (code: string) => {
          const res = await confirmationResult.confirm(code);
          return {
            user: {
              ...res.user,
              getIdToken: async (forceRefresh?: boolean) => {
                return await res.user.getIdToken(forceRefresh);
              }
            }
          };
        }
      };
    }
  };
};

// Mirroring helper classes like auth.GoogleAuthProvider
authWeb.GoogleAuthProvider = {
  credential: (idToken: string) => {
    return GoogleAuthProvider.credential(idToken);
  }
};

export default authWeb;
