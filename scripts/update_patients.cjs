require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function updatePatients() {
    const connectionString = process.env.POSTGRES_URL || process.env.trgnexus_POSTGRES_URL;

    if (!connectionString) {
        console.error("No POSTGRES_URL found.");
        return;
    }

    const finalConnectionString = connectionString.replace('?sslmode=require', '?');

    const pool = new Pool({
        connectionString: finalConnectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        console.log("Connected to DB");

        const therapistId = 1; // ID found in previous step

        const res = await client.query(
            'UPDATE patients SET therapist_id = $1 WHERE therapist_id IS NULL RETURNING id, name',
            [therapistId]
        );

        console.log(`Updated ${res.rowCount} patients:`);
        console.table(res.rows);

        // Also update appointments
        const resAppt = await client.query(
            'UPDATE appointments SET therapist_id = $1 WHERE therapist_id IS NULL RETURNING id, patient_id',
            [therapistId]
        );
        console.log(`Updated ${resAppt.rowCount} appointments.`);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

updatePatients();
