
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    console.log('Starting migration...');

    // 1. Migrate Patients
    console.log('Migrating Patients...');
    const { data: patients, error: pError } = await supabase.from('patients').select('*');
    if (pError) console.error('Error fetching patients:', pError);
    else {
        for (const p of (patients || [])) {
            await setDoc(doc(db, 'patients', p.id.toString()), {
                name: p.name,
                email: p.email,
                phone: p.phone,
                status: p.status || 'Ativo',
                therapist_id: p.therapist_id,
                created_at: p.created_at ? new Date(p.created_at) : serverTimestamp(),
                updated_at: serverTimestamp()
            });
        }
        console.log(`Migrated ${patients?.length} patients.`);
    }

    // 2. Migrate Appointments
    console.log('Migrating Appointments...');
    const { data: appointments, error: aError } = await supabase.from('appointments').select('*');
    if (aError) console.error('Error fetching appointments:', aError);
    else {
        for (const a of (appointments || [])) {
            // Find patient name for denormalization if needed
            const pName = patients?.find(pat => pat.id === a.patient_id)?.name || 'Desconhecido';

            await setDoc(doc(db, 'appointments', a.id.toString()), {
                patient_id: a.patient_id.toString(),
                patient_name: pName,
                date: a.date,
                time: a.time,
                status: a.status,
                type: a.type,
                session_data: a.session_data || {},
                therapist_id: a.therapist_id,
                created_at: a.created_at ? new Date(a.created_at) : serverTimestamp()
            });
        }
        console.log(`Migrated ${appointments?.length} appointments.`);
    }

    // 3. Migrate Site Configs
    console.log('Migrating Site Configs...');
    const { data: configs, error: cError } = await supabase.from('site_configs').select('*');
    if (cError) console.error('Error fetching site configs:', cError);
    else {
        for (const c of (configs || [])) {
            await setDoc(doc(db, 'site_configs', c.id.toString()), {
                therapist_id: c.therapist_id,
                subdomain: c.subdomain,
                theme: c.theme || {},
                content: c.content || {},
                published: c.published || false,
                created_at: c.created_at ? new Date(c.created_at) : serverTimestamp(),
                updated_at: serverTimestamp()
            });
        }
        console.log(`Migrated ${configs?.length} site configs.`);
    }

    console.log('Migration finished!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
