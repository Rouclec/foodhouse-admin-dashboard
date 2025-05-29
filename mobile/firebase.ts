import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfigString = process.env.EXPO_PUBLIC_FIREBASE_CONFIG;

const firebaseConfig = JSON.parse(firebaseConfigString ?? "{}");

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

export { app, storage };

