
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        const client = await pool.connect();

        console.log('Adding date column and making day_of_week nullable...');

        await client.query(`
            ALTER TABLE blocked_slots 
            ADD COLUMN IF NOT EXISTS date date;
            
            ALTER TABLE blocked_slots 
            ALTER COLUMN day_of_week DROP NOT NULL;
        `);

        console.log('Migration completed successfully.');
        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

run();
