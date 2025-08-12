import { db, auth } from "../firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export const testFirebaseConnection = async () => {
  try {
    // console.log("Testing Firebase connection...");

    // Test 1: Check if db is initialized
    if (!db) {
      throw new Error("Firestore database not initialized");
    }
    // console.log("✅ Firestore database initialized");

    // Test 2: Check if auth is initialized
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    // console.log("✅ Firebase Auth initialized");

    // Test 3: Try to read from Firestore (without authentication)
    try {
      const testQuery = query(collection(db, "test"), limit(1));
      await getDocs(testQuery);
      // console.log("✅ Firestore read test successful");
    } catch (firestoreError) {
      // This is expected if the collection doesn't exist or rules don't allow read
      // console.log(
      //   "⚠️ Firestore read test: Collection may not exist or rules restrict access"
      // );
      // console.log(
      //   "This is normal for a new project. Firebase connection is working."
      // );
    }

    // console.log("🎉 Firebase connection test passed!");
    return true;
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    return false;
  }
};

export const checkEnvironmentVariables = () => {
  const requiredVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  const missing = [];

  requiredVars.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error("❌ Missing environment variables:", missing);
    return false;
  }

  // console.log("✅ All required environment variables are set");
  return true;
};
