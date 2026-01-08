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
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'therapists';
    `);

        console.log('Columns:');
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type}): Nullable=${r.is_nullable}`));
        client.release();
    } catch (err) { console.error(err); } finally { await pool.end(); }
}

run();
