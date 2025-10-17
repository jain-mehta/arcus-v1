
import * as admin from 'firebase-admin';

// Define a type for our cached Firebase services to ensure type safety.
interface FirebaseAdminServices {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
}

// Use a symbol to create a unique key for the global cache. This prevents conflicts.
const FB_ADMIN_SINGLETON_KEY = Symbol.for('firebase.admin.singleton');

// Type-guard for the global object to tell TypeScript about our custom property.
type GlobalWithFirebase = typeof globalThis & {
  [FB_ADMIN_SINGLETON_KEY]?: FirebaseAdminServices;
};

/**
 * Returns a guaranteed-initialized instance of the Firebase Admin services.
 * This function uses a guarded singleton pattern to ensure that `admin.initializeApp()`
 * is called only once per application instance.
 *
 * @returns An object containing the initialized Firestore `db` and `auth` services.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  const globalWithFirebase = globalThis as GlobalWithFirebase;

  // If the instance doesn't exist on the global object, create it.
  if (!globalWithFirebase[FB_ADMIN_SINGLETON_KEY]) {
    if (!admin.apps.length) {
      // Try service account JSON file first (most reliable)
      const fs = require('fs');
      const path = require('path');
      const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          console.log('[Firebase Admin] Initializing with service-account.json');
          console.log('[Firebase Admin] Project ID:', serviceAccount.project_id);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
          });
          console.log('[Firebase Admin] Successfully initialized');
        } catch (error) {
          console.error('[Firebase Admin] Failed to read service-account.json:', error);
          throw error;
        }
      } else {
        // Fallback to environment variables
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (clientEmail && privateKey && projectId) {
          // Clean up the private key
          privateKey = privateKey.replace(/^["']|["']$/g, '');
          privateKey = privateKey.replace(/\\n/g, '\n');
          
          console.log('[Firebase Admin] Initializing with environment credentials');
          console.log('[Firebase Admin] Project ID:', projectId);
          
          try {
            admin.initializeApp({
              credential: admin.credential.cert({
                clientEmail,
                privateKey,
                projectId,
              }),
              projectId,
            });
            console.log('[Firebase Admin] Successfully initialized with environment credentials');
          } catch (error) {
            console.error('[Firebase Admin] Failed to initialize with environment credentials:', error);
            throw error;
          }
        } else {
          // Try base64 service account as last resort
          const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
          if (base64) {
            try {
              const json = Buffer.from(base64, 'base64').toString('utf8');
              const serviceAccount = JSON.parse(json);
              console.log('[Firebase Admin] Initializing with base64 service account');
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
              });
            } catch (err) {
              console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', err);
              throw new Error('Failed to initialize Firebase Admin: Invalid service account credentials');
            }
          } else {
            console.error('[Firebase Admin] No credentials found');
            throw new Error('Failed to initialize Firebase Admin: No credentials provided');
          }
        }
      }
    }

    // Cache the initialized services on the global object.
    globalWithFirebase[FB_ADMIN_SINGLETON_KEY] = {
      db: admin.firestore(),
      auth: admin.auth(),
    };
  }

  // Return the cached instance.
  return globalWithFirebase[FB_ADMIN_SINGLETON_KEY]!;
}
