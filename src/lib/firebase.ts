import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  projectId: "gen-lang-client-0888099247",
  appId: "1:434499693431:web:bd2e0bb857cc67d1278f72",
  apiKey: "AIzaSyBNHEZaTdmOETtfVCfrzQaUw7La3_uFDwY",
  authDomain: "gen-lang-client-0888099247.firebaseapp.com",
  storageBucket: "gen-lang-client-0888099247.firebasestorage.app",
  messagingSenderId: "434499693431",
  firestoreDatabaseId: "ai-studio-d8c58061-87dc-4668-9ded-1de340307fe0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const APP_ID = 'cvl-co-shop';
export const DATA_PATH = `artifacts/${APP_ID}/public/data`;
