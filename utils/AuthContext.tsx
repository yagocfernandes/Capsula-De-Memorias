import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from './firebase';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loading: true,
  signInWithGoogle: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signInWithEmail: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signUpWithEmail: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User> => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth não inicializado.');
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  };

  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth não inicializado.');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string
  ): Promise<User> => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth não inicializado.');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    return cred.user;
  };

  const signOut = async (): Promise<void> => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
