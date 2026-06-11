/**
 * Firebase initialisation. Reads config from Vite env vars.
 *
 * If any required env var is missing, `firebase` is `null` and the app falls
 * back to local-only mode. UI surfaces this with a banner.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const REQUIRED_KEYS = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
] as const;

export const FIREBASE_CONFIGURED = REQUIRED_KEYS.every(
  (k) => typeof config[k] === 'string' && (config[k] as string).length > 0,
);

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (FIREBASE_CONFIGURED) {
  try {
    app = initializeApp(config);
    _auth = getAuth(app);
    _db = getFirestore(app);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase] Failed to initialise:', err);
  }
} else if (import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[firebase] Not configured (missing VITE_FIREBASE_* env vars). Running in local-only mode.',
  );
}

export const firebase = app;
export const auth = _auth;
export const db = _db;
