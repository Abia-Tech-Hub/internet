// lib/firebaseAdmin.ts
// export { adminDb };
import * as admin from "firebase-admin";

const formatPrivateKey = (key: string | undefined) => {
  if (!key) return undefined;
  // This handles both literal newlines and escaped \n strings
  return key.replace(/\\n/g, "\n").replace(/"/g, "");
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
      // Adding a databaseURL can sometimes speed up the initial connection
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    console.log("✅ Firebase Admin Initialized");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error);
  }
}

export const adminDb = admin.firestore();
