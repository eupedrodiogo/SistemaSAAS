
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function updatePlan() {
    console.log('Starting plan update...');

    // Check keys
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('ERROR: Missing Supabase credentials in .env.local');
        console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
        console.log('Key:', supabaseKey ? 'Found' : 'Missing');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const TARGET_EMAIL = 'pedrodiogo.suporte@gmail.com';
    const NEW_PLAN = 'pro';

    try {
        // 1. Check if user exists
        console.log(`Searching for therapist: ${TARGET_EMAIL}`);
        const { data: therapist, error: findError } = await supabase
            .from('therapists')
            .select('*')
            .eq('email', TARGET_EMAIL)
            .single();

        if (findError) {
            console.error('Error finding therapist:', findError.message);
            if (findError.code === 'PGRST116') {
                console.log('Therapist not found in "therapists" table.');
            }
            return;
        }

        console.log(`Found therapist. ID: ${therapist.id}, Current Plan: ${therapist.plan}`);

        if (therapist.plan === NEW_PLAN) {
            console.log('Plan is already set to professional. No update needed.');
            return;
        }

        // 2. Update Plan
        console.log(`Updating plan to: ${NEW_PLAN}...`);
        const { data: updated, error: updateError } = await supabase
            .from('therapists')
            .update({ plan: NEW_PLAN })
            .eq('email', TARGET_EMAIL)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating plan:', updateError.message);
        } else {
            console.log('✅ Plan updated successfully!');
            console.log('New State:', {
                email: updated.email,
                plan: updated.plan,
                updated_at: new Date().toISOString()
            });
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

updatePlan();
