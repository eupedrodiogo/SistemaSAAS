
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.trgnexus_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.trgnexus_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase Credentials');
    process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteSpecificUser() {
    const targetEmail = 'pedrodiogo.mello@gmail.com';
    console.log(`Searching for ${targetEmail}...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === targetEmail);

    if (user) {
        console.log(`Found user ${user.id}. Deleting...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error('Delete failed:', deleteError);
        } else {
            console.log('User deleted successfully.');
        }
    } else {
        console.log('User not found in this environment.');
    }
}

deleteSpecificUser();
