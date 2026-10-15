import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';

/**
 * ==============================================================================
 * GOOGLE FIREBASE CONFIGURATION & CLIENT INITIALIZATION
 * Colegio Capitán Enrique Oppenheimer - Plataforma Escolar 2026
 * ==============================================================================
 * Conexión directa a Google Cloud Firestore con las credenciales oficiales
 * del proyecto 'intranet-oppenheimer' para sincronización multiusuario en tiempo real.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCUwHuvXVnSex731Gjpzur-j_Y8lf34Muw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'intranet-oppenheimer.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'intranet-oppenheimer',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'intranet-oppenheimer.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '850276643123',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:850276643123:web:90ab3dee7f435a5f1e0e46',
};

export const isFirebaseConfigured = (): boolean => true;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  try {
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(app);
  }
  console.info('🔥 [Firebase] Conectado exitosamente a Firestore (intranet-oppenheimer).');
} catch (error) {
  console.warn('⚠️ [Firebase] Error inicializando Firebase SDK:', error);
}

export { app, db };
