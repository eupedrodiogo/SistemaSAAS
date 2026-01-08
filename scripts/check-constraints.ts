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
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'therapists'::regclass;
    `);

        console.log('Constraints:');
        res.rows.forEach(r => console.log(`${r.conname}: ${r.def}`));
        client.release();
    } catch (err) { console.error(err); } finally { await pool.end(); }
}

run();
