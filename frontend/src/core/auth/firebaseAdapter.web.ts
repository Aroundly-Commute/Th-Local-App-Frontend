import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
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
  appId: "1:233722731121:web:642f3868b99992972d19d0"
};

// Initialize Firebase App for Web if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const webAuth = getAuth(app);

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
    signInWithPhoneNumber: async (phoneNumber: string, applicationVerifier: any) => {
      const confirmationResult = await signInWithPhoneNumber(webAuth, phoneNumber, applicationVerifier);
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
