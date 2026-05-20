import pg from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const { Pool } = pg;
const connectionString = process.env.POSTGRES_URL;

console.log('Testing connection to:', connectionString ? connectionString.split('@')[1] : 'undefined');

const pool = new Pool({
    connectionString: connectionString ? connectionString.replace('?sslmode=require', '?') : undefined,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function test() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);

        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name));

    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await pool.end();
    }
}

test();
