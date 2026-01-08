
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("Searching for ALL appointments for 'Izabel' or Jan 15...");

    const { data: results, error } = await supabase
        .from('appointments')
        .select('*, patients(name, email)')
        .or('date.eq.2026-01-15,date.eq.2026-01-14,date.eq.2026-01-16');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${results.length} related appointments around Jan 15th:`);
    results.forEach(a => {
        const patientName = a.patients?.name || 'Unknown';
        if (patientName.toLowerCase().includes('izabel')) {
            console.log(`[MATCH] ${patientName} | ID: ${a.id} | Date: ${a.date} | Time: ${a.time} | Status: ${a.status}`);
        } else {
            console.log(`[OTHER] ${patientName} | ID: ${a.id} | Date: ${a.date} | Time: ${a.time} | Status: ${a.status}`);
        }
    });

    // Check specifically for pending_payment
    const { data: pending } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .eq('status', 'pending_payment');

    console.log("\nAll Pending Payment Appointments:");
    pending?.forEach(p => {
        console.log(`- ${p.patients?.name} | Date: ${p.date} | ID: ${p.id}`);
    });
}

diagnose();
