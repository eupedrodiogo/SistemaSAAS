import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Connecting to Supabase...");
    // Try to get one row
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching data:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Existing Columns found in 'appointments' table:");
        console.log(JSON.stringify(Object.keys(data[0]), null, 2));
    } else {
        console.log("Table 'appointments' is empty. Cannot infer columns from data.");
        console.log("Checking if RPC 'get_columns' exists or similar...");
    }
}

inspect();
