// import { initializeApp } from "firebase/app";
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfigString = process.env.EXPO_PUBLIC_FIREBASE_CONFIG;

// const firebaseConfig = JSON.parse(firebaseConfigString ?? "{}");

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

// const storage = getStorage(app);

// export { app, storage };




import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Parse the Firebase config from environment variable
const firebaseConfig = JSON.parse(process.env.EXPO_PUBLIC_FIREBASE_CONFIG || '{}');

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the storage service
const storage = getStorage(app);

// Utility function to upload a file
const uploadFile = async (uri: string, path: string) => {
  try {
    // Convert local URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create a reference to the file
    const storageRef = ref(storage, path);
    
    // Upload the file
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Utility function to delete a file
const deleteFile = async (url: string) => {
  try {
    // Create a reference to the file to delete
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export { 
  app, 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadFile,
  deleteFile
};