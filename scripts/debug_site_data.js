import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Ensure .env has VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching site_configs...');
    const { data, error } = await supabase.from('site_configs').select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} configs.`);
    data.forEach(config => {
        console.log(`\n--- Config for Therapist: ${config.therapist_id} ---`);
        console.log(`Subdomain: ${config.subdomain}`);
        console.log('Content -> Profile:');
        if (config.content && config.content.profile) {
            console.log(JSON.stringify(config.content.profile, null, 2));
        } else {
            console.log('MISSING PROFILE IN CONTENT');
        }
    });
}

run();
