import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing supabase URL or service key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBucket() {
  console.log("Checking if 'documents' bucket exists...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const exists = buckets.find(b => b.name === 'documents');
  if (exists) {
    console.log("'documents' bucket already exists.");
  } else {
    console.log("Creating 'documents' bucket...");
    const { error: createError } = await supabase.storage.createBucket('documents', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError);
      return;
    }
    console.log("Bucket created successfully.");
  }
}

setupBucket();
