import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Querying Triggers for "therapists"...');

        const res = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement, action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'therapists';
    `);

        console.log('\n--- TRIGGERS ---');
        if (res.rows.length === 0) {
            console.log('No triggers found.');
        } else {
            res.rows.forEach(row => {
                console.log(`Trigger: ${row.trigger_name}`);
                console.log(`  Event: ${row.event_manipulation}`);
                console.log(`  Timing: ${row.action_timing}`);
                console.log(`  Statement: ${row.action_statement}`);
                console.log('---');
            });
        }

        client.release();
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

run();
