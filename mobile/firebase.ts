import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfigString = process.env.EXPO_PUBLIC_FIREBASE_CONFIG;

// const firebaseConfig = JSON.parse(firebaseConfigString ?? "{}");

const firebaseConfig = {
  apiKey: "AIzaSyDg_WnTLJD_NOBs8_xmZJB8pIyoVALOHgo",
  authDomain: "foodhouse-int.firebaseapp.com",
  projectId: "foodhouse-int",
  storageBucket: "foodhouse-int.firebasestorage.app",
  messagingSenderId: "167587991754",
  appId: "1:167587991754:web:e7e840b11584f1110c2433",
  measurementId: "G-0DVNH77WWW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const auth = getAuth(app);
export { app, storage, auth };


