import {
  getAuth,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';

const authNative = () => {
  const nativeAuth = getAuth();
  return {
    get currentUser() {
      const user = nativeAuth.currentUser;
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
          return await getIdToken(user, forceRefresh);
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
      return onAuthStateChanged(nativeAuth, (user) => {
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
              return await getIdToken(user, forceRefresh);
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
      const res = await signInWithEmailAndPassword(nativeAuth, email, password);
      if (!res || !res.user) throw new Error('User not found');
      const u = res.user;
      return {
        user: {
          ...u,
          getIdToken: async (forceRefresh?: boolean) => {
            return await getIdToken(u, forceRefresh);
          }
        }
      };
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      const res = await createUserWithEmailAndPassword(nativeAuth, email, password);
      if (!res || !res.user) throw new Error('Failed to create user');
      const u = res.user;
      return {
        user: {
          ...u,
          getIdToken: async (forceRefresh?: boolean) => {
            return await getIdToken(u, forceRefresh);
          },
          updateProfile: async (profile: { displayName?: string | null; photoURL?: string | null }) => {
            await updateProfile(u, profile);
          },
          sendEmailVerification: async () => {
            await sendEmailVerification(u);
          }
        }
      };
    },
    signInWithCredential: async (credential: any) => {
      const res = await signInWithCredential(nativeAuth, credential);
      if (!res || !res.user) throw new Error('Failed to sign in with credential');
      const u = res.user;
      return {
        user: {
          ...u,
          getIdToken: async (forceRefresh?: boolean) => {
            return await getIdToken(u, forceRefresh);
          },
          displayName: u.displayName,
          email: u.email
        }
      };
    },
    signOut: async () => {
      await signOut(nativeAuth);
    },
    signInWithPhoneNumber: async (phoneNumber: string) => {
      const confirmationResult = await signInWithPhoneNumber(nativeAuth, phoneNumber);
      return {
        confirm: async (code: string) => {
          const res = await confirmationResult.confirm(code);
          if (!res || !res.user) throw new Error('Failed to confirm OTP');
          const u = res.user;
          return {
            user: {
              ...u,
              getIdToken: async (forceRefresh?: boolean) => {
                return await getIdToken(u, forceRefresh);
              }
            }
          };
        }
      };
    }
  };
};

authNative.GoogleAuthProvider = {
  credential: (idToken: string) => {
    return GoogleAuthProvider.credential(idToken);
  }
};

export default authNative;
