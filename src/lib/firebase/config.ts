import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseSetupInstructions = [
  "Create a Firebase project at https://console.firebase.google.com",
  "Enable Authentication → Sign-in method → Email/Password",
  "Create a Cloud Firestore database (production mode) and deploy firestore.rules",
  "Enable Cloud Storage and deploy storage.rules",
  "Copy your web app config into .env.local (see .env.example)",
  "Restart the dev server",
];

/**
 * Primary [DEFAULT] app — used only for the first sign-in handshake.
 * After a reload, only named per-account apps exist, so look up by name
 * instead of assuming length === 0 means "default available".
 */
export function getDefaultApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;
  return initializeApp(firebaseConfig);
}

/**
 * Per-account app instance. Each remembered account gets its own named app so
 * Firebase's own persistence (IndexedDB/keyed by app name) can restore that
 * account's session independently of the others. Our code never touches
 * tokens — only account identifiers in localStorage.
 */
const accountApps = new Map<string, FirebaseApp>();

export function getAccountApp(uid: string): FirebaseApp {
  const cached = accountApps.get(uid);
  if (cached) return cached;
  const name = `you_account_${uid}`;
  const app = getApps().find((a) => a.name === name) ?? initializeApp(firebaseConfig, name);
  accountApps.set(uid, app);
  return app;
}

export function getAccountAuth(uid: string): Auth {
  const auth = getAuth(getAccountApp(uid));
  // Persist sessions across refreshes; Firebase manages the token storage.
  void setPersistence(auth, browserLocalPersistence).catch(() => {});
  return auth;
}

export function getAccountDb(uid: string): Firestore {
  return getFirestore(getAccountApp(uid));
}

export async function deleteAccountApp(uid: string) {
  const name = `you_account_${uid}`;
  const app = getApps().find((a) => a.name === name);
  if (app) {
    accountApps.delete(uid);
    const { deleteApp } = await import("firebase/app");
    await deleteApp(app).catch(() => {});
  }
}
