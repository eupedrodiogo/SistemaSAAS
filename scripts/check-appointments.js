
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkAppointments() {
    console.log('Checking appointments...');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Defined' : 'Missing');

    if (!process.env.POSTGRES_URL) {
        console.error('No connection string found.');
        return;
    }

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        console.log('Connected to DB.');

        const res = await client.query('SELECT count(*) FROM appointments');
        console.log('Total appointments:', res.rows[0].count);

        const rows = await client.query('SELECT id, date, time, status, therapist_id FROM appointments LIMIT 5');
        console.log('First 5 appointments:');
        rows.rows.forEach(r => {
            console.log(JSON.stringify(r));
        });

        // Check if pending_payment exists
        const pending = await client.query("SELECT count(*) FROM appointments WHERE status = 'pending_payment'");
        console.log('Pending Payment count:', pending.rows[0].count);

        // Check therapists
        const therapists = await client.query('SELECT * FROM therapists LIMIT 1');
        console.log('Therapist sample:', therapists.rows[0] ? JSON.stringify(therapists.rows[0]) : 'None found');

        client.release();
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

checkAppointments();
