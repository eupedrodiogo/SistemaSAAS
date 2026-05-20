import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

async function seed() {
    console.log('Seeding initial therapist data...');

    const therapistId = "default-admin"; // We'll use a fixed ID for now or match Auth UID later
    // Actually, in Firestore, it's better to use the Auth UID.
    // But since we don't know the UID yet, we can't be sure.
    // However, the rule is: allow write: if request.auth.uid == request.resource.data.therapist_id;

    const therapistEmail = "pedrodiogo.mello@gmail.com";

    try {
        // 1. Create Therapist Profile
        // Note: For now, we seed it in a way that matches the code expectations
        await setDoc(doc(db, 'therapists', 'pedro-admin'), {
            name: "Pedro Diogo",
            email: therapistEmail,
            specialty: "Terapeuta TRG",
            phone: "5511999999999",
            active: true
        });

        // 2. Create Site Config
        await setDoc(doc(db, 'site_configs', 'pedro-config'), {
            therapist_id: 'pedro-admin',
            subdomain: 'teranexus',
            theme: {
                primaryColor: '#6366f1',
                secondaryColor: '#4f46e5'
            },
            content: {
                heroTitle: 'TeraNexus - Sua jornada de transformação',
                heroSubtitle: 'Terapia de Reprocessamento Generativo'
            },
            published: true,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        console.log('✅ Initial data seeded successfully!');
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
    }
    process.exit(0);
}

seed();
