import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYLkbdJGDNumZgbrj0tBjpgvgx5FvAaYc",
  authDomain: "bathroom-finder-13654.firebaseapp.com",
  projectId: "bathroom-finder-13654",
  storageBucket: "bathroom-finder-13654.firebasestorage.app",
  messagingSenderId: "63206582676",
  appId: "1:63206582676:web:cc329937fb7444bf288781"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // 🔌 connect to Firestore

export { db }; // ✅ export so we can use it elsewhere
