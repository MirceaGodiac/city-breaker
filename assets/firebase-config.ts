// Import the functions you need from the SDKs you need
import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getDatabase} from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2npifTsS7yEihYkpcThHg6Il0wq393lg",
  authDomain: "city-breaker.firebaseapp.com",
  projectId: "city-breaker",
  storageBucket: "city-breaker.firebasestorage.app",
  messagingSenderId: "181212596638",
  appId: "1:181212596638:web:188f0c9a0625c65cfaae8f",
  measurementId: "G-0482V76Z3M"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);


