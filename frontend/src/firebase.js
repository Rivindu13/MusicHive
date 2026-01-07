import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyCiMCI58yxC4BF-RyCvHpplr1G7drF6FXU",
  authDomain: "musichive-8f11c.firebaseapp.com",
  projectId: "musichive-8f11c",
  storageBucket: "musichive-8f11c.firebasestorage.app",
  messagingSenderId: "62919999203",
  appId: "1:62919999203:web:d97064fad99a3b8a3e4fd6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
