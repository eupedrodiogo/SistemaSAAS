
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

async function testWebhookLogic(appointmentId) {
    console.log(`Simulating webhook processing for Appointment ${appointmentId}...`);

    // 1. Test Update
    const { data: updateData, error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'scheduled' })
        .eq('id', appointmentId)
        .select();

    if (updateError) {
        console.error('Update Error:', updateError);
        return;
    }
    console.log('Update Successful:', updateData);

    // 2. Test Fetch for Notifications
    const { data: appt, error: fetchError } = await supabase
        .from('appointments')
        .select(`
            date, time,
            patients!inner (name, email, phone, notes),
            therapists!inner (name, email, phone)
        `)
        .eq('id', appointmentId)
        .single();

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
        return;
    }

    console.log('Fetched Data:', JSON.stringify(appt, null, 2));

    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
    const therapist = Array.isArray(appt.therapists) ? appt.therapists[0] : appt.therapists;

    console.log('Extracted Patient:', patient?.name);
    console.log('Extracted Therapist:', therapist?.name);

    if (!patient || !therapist) {
        console.error('CRITICAL: Patient or Therapist missing from join result!');
    }
}

// Use one of the pending IDs found earlier
const testId = 'c0c18172-4cb8-4117-8356-c343edd842fa'; // Izabel Cristina
testWebhookLogic(testId);
