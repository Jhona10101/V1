import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAlJw-gJTQISBTG3fU9xwfAZYplo8Esf2Y",
  authDomain: "v-metric.firebaseapp.com",
  projectId: "v-metric",
  storageBucket: "v-metric.firebasestorage.app",
  messagingSenderId: "257962379714",
  appId: "1:257962379714:web:429b2e9eb28f1914226e5b"
};

// Inicialización segura (evita re-inicializar en HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);