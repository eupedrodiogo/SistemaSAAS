
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPending() {
    console.log('🔍 Debugging Pending Appointments...');

    // 1. Get all appointments with status 'pending_payment'
    const { data: pending, error } = await supabase
        .from('appointments')
        .select('id, date, time, status, patient_id, therapist_id')
        .eq('status', 'pending_payment');

    if (error) {
        console.error('❌ Error fetching pending:', error);
        return;
    }

    console.log(`\nFound ${pending.length} appointments with status 'pending_payment':`);
    if (pending.length === 0) {
        console.log('⚠️ No pending_payment appointments found in DB!');
    } else {
        pending.forEach(apt => {
            console.log(`- [${apt.id}] Date: ${apt.date}, Time: ${apt.time}, Therapist: ${apt.therapist_id}`);
        });
    }

    // 2. Check total appointments for context
    const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
    console.log(`\nTotal appointments in DB: ${count}`);
}

debugPending();
