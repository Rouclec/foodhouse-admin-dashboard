import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Matches the Firebase project used by mobile image uploads.
const firebaseConfig = {
  apiKey: "AIzaSyDg_WnTLJD_NOBs8_xmZJB8pIyoVALOHgo",
  authDomain: "foodhouse-int.firebaseapp.com",
  projectId: "foodhouse-int",
  storageBucket: "foodhouse-int.firebasestorage.app",
  messagingSenderId: "167587991754",
  appId: "1:167587991754:web:e7e840b11584f1110c2433",
  measurementId: "G-0DVNH77WWW",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

