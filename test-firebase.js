require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Using API Key:", firebaseConfig.apiKey.substring(0, 10) + "...");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    console.log("Attempting sign up...");
    await createUserWithEmailAndPassword(auth, "test" + Date.now() + "@aidconnect.org", "password123");
    console.log("SUCCESS! Sign up worked.");
  } catch (err) {
    console.error("FIREBASE ERROR:", err.message);
    if (err.message.includes("auth/operation-not-allowed")) {
      console.error("\n>>> EMAIL/PASSWORD AUTH IS DISABLED IN FIREBASE CONSOLE <<<");
    }
  }
  process.exit(0);
}

test();
