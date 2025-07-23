// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'; // Import getAuth for authentication
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDH-9HMnMIMnpP7JT3HwODG1cZRrFTr-Ko",
  authDomain: "easylease-sgaap.firebaseapp.com",
  projectId: "easylease-sgaap",
  storageBucket: "easylease-sgaap.firebasestorage.app",
  messagingSenderId: "1097212604433",
  appId: "1:1097212604433:web:b9179f3228068f5d3a01b0",
  measurementId: "G-0HXJV0VGHS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // EXPORT THE AUTH OBJECT
export const db = getFirestore(app);
const analytics = getAnalytics(app);
