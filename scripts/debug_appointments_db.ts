
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (result.error) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointments() {
    console.log('Checking appointments in DB...');

    const { data, error } = await supabase
        .from('appointments')
        .select('*');

    if (error) {
        console.error('Error fetching appointments:', error);
        return;
    }

    console.log(`Found ${data.length} appointments.`);
    if (data.length > 0) {
        console.log('Sample appointments:');
        data.slice(0, 5).forEach(apt => {
            console.log(`- ID: ${apt.id}`);
            console.log(`  Date: ${apt.date} (${typeof apt.date})`);
            console.log(`  Time: ${apt.time}`);
            console.log(`  Status: ${apt.status}`);
            console.log(`  Therapist ID: ${apt.therapist_id}`);
            console.log('---');
        });
    } else {
        console.log('No appointments found. Check DB connection or table.');
    }
}

checkAppointments();
