import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/^"(.*)"$/, "$1").replace(/\\n/g, "\n").trim();
}

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length && process.env.FIREBASE_PROJECT_ID) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        }),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }

  return {
    auth: getApps().length ? getAuth() : (null as unknown as ReturnType<typeof getAuth>),
    db: getApps().length ? getFirestore() : (null as unknown as ReturnType<typeof getFirestore>),
  };
}

export const { auth, db } = initFirebaseAdmin();
