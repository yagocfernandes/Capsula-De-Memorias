import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase Web SDK Configuration for project `love-sy` (with environment variable override support).
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyAF4xZDKOOe8Lf_B1I84XWLfvmctfuzjwQ',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'love-sy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'love-sy',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'love-sy.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1014315867320',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:1014315867320:web:7d200c4467ed20ee8ba84d',
};

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp;
  try {
    if (isFirebaseConfigured()) {
      cachedApp =
        getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      return cachedApp;
    }
  } catch (err) {
    console.warn('Firebase App initialization warning:', err);
  }
  return null;
}

export function getFirestoreDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (err) {
    console.warn('Firestore initialization warning:', err);
    return null;
  }
}

export async function ensureFirestoreDb(): Promise<Firestore | null> {
  return getFirestoreDb();
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.warn('Firebase Auth initialization warning:', err);
    return null;
  }
}

export const googleProvider = new GoogleAuthProvider();
