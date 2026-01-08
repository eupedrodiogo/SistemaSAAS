import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Try VITE_ prefix (standard) or trgnexus_ prefix (local-specific)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.trgnexus_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.trgnexus_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndDeleteUser() {
    const email = 'pedrodiogo.suporte@gmail.com';
    console.log(`Checking for user: ${email}`);

    console.log(`Connecting to Supabase at: ${supabaseUrl}`);

    // Fetch up to 1000 users to ensure we don't miss it due to pagination
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const targetUser = users.find(u => u.email === email);

    if (targetUser) {
        console.log(`User found: ${targetUser.id} created at ${targetUser.created_at}`);
        console.log('Deleting user to allow fresh registration...');

        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUser.id);
        if (deleteError) {
            console.error('Error deleting user:', deleteError);
        } else {
            console.log('User deleted successfully. You can now register again.');
        }
    } else {
        console.log('User not found.');
    }
}

checkAndDeleteUser();
