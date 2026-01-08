
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        console.log(JSON.stringify(therapists.rows, null, 2));

        // Check patients
        const patients = await client.query('SELECT id, name, therapist_id FROM patients LIMIT 5');
        console.log('\nPatients Sample (first 5):');
        console.log(JSON.stringify(patients.rows, null, 2));

        // Check appointments
        const appointments = await client.query('SELECT id, patient_id, therapist_id, date, status FROM appointments LIMIT 5');
        console.log('\nAppointments Sample (first 5):');
        console.log(JSON.stringify(appointments.rows, null, 2));

        // Check columns types
        const columns = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('therapists', 'patients', 'appointments')
            ORDER BY table_name, column_name
        `);
        console.log('\nColumn Types:');
        console.log(JSON.stringify(columns.rows, null, 2));

        client.release();
    } catch (err) {
        console.error('Diagnostic failed:', err);
    } finally {
        await pool.end();
    }
}

diagnose();
