import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to inspect storage policies if possible, or anon

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Verifying Storage Buckets ---');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
    } else {
        console.log('Buckets:', buckets.map(b => b.name));
        const docsBucket = buckets.find(b => b.name === 'documents');
        if (!docsBucket) {
            console.error('❌ Bucket "documents" NOT found!');
        } else {
            console.log('✅ Bucket "documents" found.');
            console.log('   Public:', docsBucket.public);
        }
    }

    console.log('\n--- Verifying Database Schema (via RPC or Insight) ---');
    // We can't easily check column types via JS client without a helper function or direct SQL.
    // We'll use the 'pg' library for this part as we did before.
}

run();
