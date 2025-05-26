
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
