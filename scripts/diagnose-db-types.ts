import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;

// Debug log (masking secret)
console.log('Connecting to DB:', connectionString ? 'URL Found' : 'URL MISSING');

if (!connectionString) {
    console.error('CRITICIAL: POSTGRES_URL not found. Run "vercel env pull .env.local --environment=production" first.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Connected to Database. Querying schema information...');

        const res = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'therapists' 
      AND column_name IN ('specialties', 'certificates', 'specialty');
    `);

        console.log('\n--- SCHEMA REPORT ---');
        if (res.rows.length === 0) {
            console.log('❌ NO COLUMNS FOUND! The table "therapists" might not exist or verify-schema is looking at wrong DB.');
        } else {
            res.rows.forEach(row => {
                console.log(`Column: ${row.column_name} | Type: ${row.data_type} | UDT: ${row.udt_name}`);
            });
        }
        console.log('---------------------\n');

        client.release();
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

run();
