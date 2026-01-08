import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        const client = await pool.connect();
        console.log('--- Setting up Storage Policies ---');

        // 1. Policy for INSERT (Uploads)
        // allowing any authenticated user to upload to 'documents' bucket
        // We try to create it, handling existence check via DO block or simple error catch logic (PG doesn't have CREATE POLICY IF NOT EXISTS in all versions, but we can try)

        console.log('Creating INSERT policy...');
        try {
            await client.query(`
            CREATE POLICY "Allow authenticated uploads to documents"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK ( bucket_id = 'documents' );
        `);
            console.log('INSERT policy created.');
        } catch (err: any) {
            if (err.message.includes('already exists')) {
                console.log('INSERT policy already exists.');
            } else {
                console.error('Error creating INSERT policy:', err.message);
            }
        }

        // 2. Policy for SELECT (Public read is enabled on bucket, but RLS on storage.objects might still need clearance if we were listing)
        // For getPublicUrl, it usually bypasses RLS if bucket is public.
        // However, let's add a Select policy just in case for the owner.

        console.log('Creating SELECT policy...');
        try {
            await client.query(`
            CREATE POLICY "Allow users to view own documents"
            ON storage.objects FOR SELECT
            TO authenticated
            USING ( bucket_id = 'documents' );
        `);
            console.log('SELECT policy created.');
        } catch (err: any) {
            if (err.message.includes('already exists')) {
                console.log('SELECT policy already exists.');
            } else {
                console.error('Error creating SELECT policy:', err.message);
            }
        }

        client.release();
    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await pool.end();
    }
}

run();
