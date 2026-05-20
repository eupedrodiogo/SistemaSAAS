import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    console.log('Checking Firestore collections...');
    const collections = ['patients', 'appointments', 'site_configs', 'leads', 'therapists'];

    for (const col of collections) {
        try {
            const snap = await getDocs(collection(db, col));
            console.log(`Collection '${col}': ${snap.size} documents.`);
        } catch (e) {
            console.error(`Error checking '${col}':`, e.message);
        }
    }
    process.exit(0);
}

check();
