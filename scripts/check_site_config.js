
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSites() {
    console.log('Checking site_configs...');
    const { data: sites, error } = await supabase
        .from('site_configs')
        .select(`
            *,
            therapists (email)
        `);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Sites found:', sites.length);
        sites.forEach(site => {
            console.log(`- Subdomain: ${site.subdomain}, Therapist Email: ${site.therapists ? site.therapists.email : 'N/A'}, ID: ${site.therapist_id}`);
        });
    }

    // Also check if the table is empty or authentication failed
    if (sites.length === 0) {
        console.log("No sites found. The user might not have saved/published yet.");
    }
}

checkSites();
