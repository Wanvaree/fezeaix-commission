// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";

// 🚨🚨🚨 แทนที่ค่าเหล่านี้ด้วย Firebase Config ของคุณ 🚨🚨🚨
const firebaseConfig = {
  apiKey: "AIzaSyCG0ogFYqNhUrYs5ffm7ATC7KLowmOkes8",
  authDomain: "fezeaix-commission.firebaseapp.com",
  projectId: "fezeaix-commission",
  storageBucket: "fezeaix-commission.firebasestorage.app",
  messagingSenderId: "277309240523",
  appId: "1:277309240523:web:280f97eed392384256574e",
  measurementId: "G-PQY9EZ3JV9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export Functions ที่จำเป็นสำหรับ Firestore
export { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
};