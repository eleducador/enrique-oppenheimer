import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * ==============================================================================
 * GOOGLE FIREBASE CONFIGURATION & CLIENT INITIALIZATION
 * Colegio Capitán Enrique Oppenheimer - Plataforma Escolar 2026
 * ==============================================================================
 * Esta capa se encarga de conectar la plataforma a Google Cloud / Firebase Firestore.
 * Si las variables de entorno aún no están configuradas en .env o Vercel,
 * el sistema funcionará en modo local seguro sin interrumpir la experiencia de usuario.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Comprueba si las variables de entorno son válidas y no son los valores de ejemplo
export const isFirebaseConfigured = (): boolean => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(
    projectId &&
      apiKey &&
      !projectId.includes('tu-proyecto') &&
      !apiKey.includes('tu-firebase-api-key')
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.info('🔥 [Firebase] Conexión establecida exitosamente con Google Firestore.');
  } catch (error) {
    console.warn('⚠️ [Firebase] Error inicializando Firebase SDK:', error);
  }
} else {
  console.info(
    'ℹ️ [Firebase] Modo Local Activo: Configura las variables VITE_FIREBASE_* en .env o Vercel para activar sincronización global.'
  );
}

export { app, db };
