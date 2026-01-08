
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials (URL or Service Role Key).");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkIds() {
    const email = 'pedrodiogo.suporte@gmail.com';
    console.log(`Checking IDs for email: ${email}`);

    // 1. Get Auth User ID
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Error fetching auth users:", authError);
        return;
    }

    const authUser = users.find(u => u.email === email);
    if (!authUser) {
        console.log("Auth User NOT FOUND");
    } else {
        console.log(`Auth User ID:      ${authUser.id}`);
    }

    // 2. Get Public Therapist ID
    const { data: therapist, error: dbError } = await supabase
        .from('therapists')
        .select('id, email')
        .eq('email', email)
        .single();

    if (dbError) {
        console.log("Therapist DB Record NOT FOUND or Error:", dbError.message);
    } else {
        console.log(`Therapist DB ID:   ${therapist.id}`);
    }

    if (authUser && therapist) {
        if (authUser.id === therapist.id) {
            console.log("✅ IDs MATCH. Authentication logic should work simple.");
        } else {
            console.log("⚠️ IDs DO NOT MATCH.");
            console.log("   The 'api/auth/login.ts' script MUST use the Therapist DB ID for the token.");
            console.log("   Current Logic: `const therapistId = therapist?.id || authData.user.id;`");
            console.log("   This logic seems CORRECT (prefers Therapist DB ID).");
        }
    }
}

checkIds();
