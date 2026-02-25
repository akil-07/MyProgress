import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ─── Paste your Firebase config here ───────────────────────────────────────
// Get it from: https://console.firebase.google.com
//   → Your Project → Project Settings → Your Apps → Web App → Config
//
// REQUIRED setup steps:
//   1. Create a Firebase project at console.firebase.google.com
//   2. Add a Web App to the project
//   3. Enable Authentication → Sign-in method → Google
//   4. Enable Firestore Database (start in test mode)
//   5. Copy your config object below and replace the placeholder values
// ───────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if config is filled in
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain
);

let app, db, auth, googleProvider;

if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
}

export { db, auth, googleProvider };
export default app;
