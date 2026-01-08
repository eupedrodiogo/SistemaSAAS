import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        const client = await pool.connect();
        console.log('Adding "phone" column to therapists table...');

        // Add phone column if it doesn't exist
        await client.query(`
      ALTER TABLE therapists 
      ADD COLUMN IF NOT EXISTS phone text;
    `);

        console.log('Success: "phone" column added or already exists.');

        // Verify
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'therapists' AND column_name = 'phone';
    `);

        console.log('Verification:', res.rows);

        client.release();
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await pool.end();
    }
}

run();
