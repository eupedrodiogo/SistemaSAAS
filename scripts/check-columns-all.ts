import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'therapists' 
      AND column_name IN ('crp', 'citrg_code');
    `);

        console.log('Columns found:', res.rows);
        client.release();
    } catch (err) { console.error(err); } finally { await pool.end(); }
}

run();
