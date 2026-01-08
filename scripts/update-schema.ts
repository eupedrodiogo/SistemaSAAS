
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ No POSTGRES_URL or DATABASE_URL found in .env.local');
        // Proceeding to exit, we can't do anything without DB access.
        process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    // Only print the first few chars to avoid leaking full secret in logs
    console.log(`Target: ${connectionString.substring(0, 15)}...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for some Supabase/Vercel connections
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        console.log('🛠️ Running schema migration...');
        await client.query(`
      ALTER TABLE therapists ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';
      ALTER TABLE therapists ADD COLUMN IF NOT EXISTS certificates jsonb[] DEFAULT '{}';
    `);

        console.log('✨ Schema updated successfully! Columns "specialties" and "certificates" created.');
    } catch (err) {
        console.error('❌ Error updating schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
