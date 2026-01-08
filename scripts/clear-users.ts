import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.trgnexus_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.trgnexus_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.log('Available Env Vars (Prefix filtered):');
  Object.keys(process.env).filter(k => k.includes('SUPABASE')).forEach(k => console.log(k, 'exists'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearAllUsers() {
  console.log('Starting user cleanup...');
  let totalDeleted = 0;

  try {
    while (true) {
      // Fetch a batch of users
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

      if (error) throw error;
      if (!users || users.length === 0) break;

      console.log(`Found batch of ${users.length} users. Deleting...`);

      // Delete in parallel for speed
      await Promise.all(users.map(async (user) => {
        // 1. Clean public tables first (Handle FK Constraints)
        // Try deleting from appointments first (assuming therapist_id exists, or it might be via patient)
        
        // Find therapist_id (which is user.id)
        const therapistId = user.id;

        // Best effort cleanups
        const { error: appError } = await supabase.from('appointments').delete().eq('therapist_id', therapistId);
        if (appError && !appError.message.includes('Column not found')) console.log(`Note: Appointments cleanup: ${appError.message}`);

        const { error: patientError } = await supabase.from('patients').delete().eq('therapist_id', therapistId);
        if (patientError) console.error(`Failed to delete patients for ${therapistId}: ${patientError.message}`);

        const { error: therapistError } = await supabase.from('therapists').delete().eq('id', therapistId);
         if (therapistError) console.error(`Failed to delete therapist ${therapistId}: ${therapistError.message}`);

        // 2. Delete Auth User
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Failed to delete user ${user.id}:`, deleteError.message);
        } else {
          console.log(`Deleted user ${user.email} (${user.id})`);
          totalDeleted++;
        }
      }));

      // If we fetched fewer than perPage, we are likely done, but listUsers pagination is tricky with deletion
      // because deletion shifts the pages. However, since we are deleting 'page 1' repeatedly, 
      // until 'page 1' returns empty, this loop works (emptying the bucket).
    }

    console.log(`Cleanup complete. Total users deleted: ${totalDeleted}`);
  } catch (err: any) {
    console.error('Error clearing users:', err.message);
  }
}

clearAllUsers();
