import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Storage Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Database Client
const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        console.log('--- 1. Setting up Storage ---');
        const { data: buckets } = await supabase.storage.listBuckets();
        const docsBucket = buckets?.find(b => b.name === 'documents');

        if (!docsBucket) {
            console.log('Creating "documents" bucket...');
            const { data, error } = await supabase.storage.createBucket('documents', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
            });
            if (error) console.error('Error creating bucket:', error);
            else console.log('Bucket "documents" created successfully.');
        } else {
            console.log('Bucket "documents" already exists.');
            if (!docsBucket.public) {
                console.log('WARNING: Bucket is NOT public. Updating...');
                const { error } = await supabase.storage.updateBucket('documents', { public: true });
                if (error) console.error('Error updating bucket:', error);
                else console.log('Bucket updated to public.');
            }
        }

        console.log('\n--- 2. Verifying Database Schema ---');
        const client = await pool.connect();

        // Check certificates column
        const res = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'therapists' AND column_name = 'certificates';
    `);

        console.log('Certificates Column:', res.rows);

        if (res.rows.length === 0) {
            console.log('Adding "certificates" column (jsonb)...');
            await client.query(`ALTER TABLE therapists ADD COLUMN IF NOT EXISTS certificates jsonb DEFAULT '[]'::jsonb;`);
            console.log('Column added.');
        } else {
            const type = res.rows[0].udt_name;
            console.log(`Column exists with type: ${type}`);
            if (type !== 'jsonb') {
                console.warn('WARNING: Column type is not jsonb. This might cause issues if storing objects.');
            }
        }

        client.release();

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
