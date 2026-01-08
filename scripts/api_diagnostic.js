
const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        console.error('POSTGRES_URL is missing');
        return;
    }

    const { Pool } = pg;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('Successfully connected to database');

        // Check therapists
        const therapists = await client.query('SELECT id, email, name FROM therapists LIMIT 5');
        console.log('\nTherapists Sample (first 5):');
        console.table(therapists.rows);

        // Check patients
        const patients = await client.query('SELECT id, name, therapist_id FROM patients LIMIT 5');
        console.log('\nPatients Sample (first 5):');
        console.table(patients.rows);

        // Check appointments
        const appointments = await client.query('SELECT id, patient_id, therapist_id, date, status FROM appointments LIMIT 5');
        console.log('\nAppointments Sample (first 5):');
        console.table(appointments.rows);

        // Check columns types
        const columns = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('therapists', 'patients', 'appointments')
            ORDER BY table_name, column_name
        `);
        console.log('\nColumn Types:');
        console.table(columns.rows);

        client.release();
    } catch (err) {
        console.error('Diagnostic failed:', err);
    } finally {
        await pool.end();
    }
}

diagnose();
