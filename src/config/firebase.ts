import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB1sUAM6-zyIEXXbjhMzAveEnO_IDDu4o8",
  authDomain: "tapeat-56b0b.firebaseapp.com",
  projectId: "tapeat-56b0b",
  storageBucket: "tapeat-56b0b.firebasestorage.app",
  messagingSenderId: "467409723194",
  appId: "1:467409723194:web:b90c2020b1fd5d89723a03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth();

// Set persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };