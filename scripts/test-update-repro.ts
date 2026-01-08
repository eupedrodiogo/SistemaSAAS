import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for this test?
// Actually, if the error is RLS related, I should use the ANON key and sign in?
// But 500 is rare for RLS.
// Let's us SERVICE KEY to rule out Permission Denied (401/403). If SERVICE KEY fails with 500, it's definitely DB/Trigger/Type.

if (!supabaseUrl || !serviceKey) {
    console.error('Missing credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    console.log('Finding a therapist to update...');
    const { data: users, error: listError } = await supabase
        .from('therapists')
        .select('*')
        .limit(1);

    if (listError || !users || users.length === 0) {
        console.error('List Error:', listError);
        return;
    }

    const targetUser = users[0];
    console.log(`Targeting user: ${targetUser.name} (${targetUser.id})`);

    console.log('Attempting UPDATE...');

    // Simulate the exact payload from frontend
    const payload = {
        // name: targetUser.name,
        // photo_url: targetUser.photo_url,
        specialty: 'Geral', // Legacy field
        // citrg_code: '12345', // Assuming validation isn't strict
        // phone: '11999999999',
        price: 150,
        session_duration: 50,
        specialties: ['Terapia Cognitiva', 'Teste Script'],
        certificates: [{ name: 'Certificado Teste', url: 'http://google.com', status: 'verified' }],
        // is_overflow_source: false,
        // is_overflow_target: false,
    };

    const { data, error } = await supabase
        .from('therapists')
        .update(payload)
        .eq('id', targetUser.id)
        .select();

    if (error) {
        console.error('❌ UPDATE FAILED!');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('✅ UPDATE SUCCESS!', data);
    }
}

run();
