
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

// This function ensures that we initialize the Firebase app only once.
export function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Verify that all required environment variables are present.
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
  ) {
    throw new Error(
      'Firebase client configuration is missing. Make sure NEXT_PUBLIC_FIREBASE_* environment variables are set.'
    );
  }

  app = initializeApp(firebaseConfig);
  
  // Definitive Fix: Connect to emulators here, once, during initialization.
  if (process.env.NODE_ENV === 'development') {
    const auth = getAuth(app);
    try {
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        console.log("(Client) Firebase Auth emulator connected.");
    } catch (e) {
        // This can happen in strict mode, we can ignore it.
    }
  }

  return app;
}
