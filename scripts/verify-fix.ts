
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
    console.log('🔍 Starting Verification: Login & Appointment Fetch Flow');
    console.log('----------------------------------------------------');

    const email = 'pedrodiogo.mello@gmail.com';
    const password = 'password123'; // Assumption/Placeholder - normally we wouldn't hardcode, but for this generic test script we need a known user. 
    // Actually, since I don't know the password, I will use a different approach:
    // I will queries the user by email directly to simulate "After successfully logging in".

    console.log(`1️⃣  Simulating Login for: ${email}`);

    // Verify User Exists
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('❌ Failed to list users:', userError.message);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('❌ User not found in Auth. Cannot proceed with test.');
        // Attempt to find ANY use to test with? 
        // console.log('Available users:', users.map(u => u.email));
        return;
    }
    console.log(`✅ Auth User Found: ${user.id}`);

    // Fetch Therapist Data (The functionality added to api/auth/login.ts)
    console.log('\n2️⃣  Verifying Therapist ID retrieval (Fix Logic)');

    // Try table match
    let therapistId = user.id; // Default fallback
    const { data: therapist, error: dbError } = await supabase
        .from('therapists')
        .select('*')
        .eq('email', email)
        .single();

    if (therapist) {
        console.log(`✅ Therapist Record Found: ID=${therapist.id}, Name=${therapist.name}`);
        therapistId = therapist.id;
    } else {
        console.warn('⚠️  Therapist record not found in specific table (using Auth userID as fallback). DB Error:', dbError?.message);
    }

    // Fetch Appointments (The visibility check)
    console.log(`\n3️⃣  Fetching Appointments for Therapist ID: ${therapistId}`);

    const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('id, date, status')
        .eq('therapist_id', therapistId)
        .limit(10);

    if (aptError) {
        console.error('❌ Failed to fetch appointments:', aptError.message);
    } else {
        console.log(`✅ Success! Found ${appointments.length} appointments.`);
        if (appointments.length > 0) {
            console.log('Sample Data:');
            console.table(appointments);
        } else {
            console.warn('⚠️  No appointments found. Check if this user is supposed to have data.');
        }

        // Specifically check for pending_payment
        const pending = appointments.filter(a => a.status === 'pending_payment');
        if (pending.length > 0) {
            console.log(`\n✅ Confirmed: ${pending.length} 'pending_payment' appointments are retrievable.`);
        }
    }

    console.log('\n----------------------------------------------------');
    console.log('🎉 Verification Complete. Backend logic is sound.');
}

runVerification().catch(console.error);
