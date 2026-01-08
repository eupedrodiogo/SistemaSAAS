
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Loading connection info...');
console.log('URL found:', !!supabaseUrl);
console.log('Key found:', !!serviceKey);

if (!supabaseUrl || !serviceKey) {
    console.error('Missing credentials. Please check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
    console.log('Checking therapist table columns...');

    // Try to select the new columns. If they don't exist, this should throw or return an error/warning.
    const { data, error } = await supabase
        .from('therapists')
        .select('id, name, specialties, certificates')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting specific columns:', error);
        console.log('This likely means the columns "specialties" or "certificates" do NOT exist.');
    } else {
        console.log('✅ Success! Columns exist. Data sample:', data);
    }
}

checkSchema();
