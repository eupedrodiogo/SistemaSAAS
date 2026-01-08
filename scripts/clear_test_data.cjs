require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function clearData() {
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

        // Delete appointments first due to FK constraint
        const resAppt = await client.query('DELETE FROM appointments');
        console.log(`Deleted ${resAppt.rowCount} appointments.`);

        const resPatients = await client.query('DELETE FROM patients');
        console.log(`Deleted ${resPatients.rowCount} patients.`);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

clearData();
