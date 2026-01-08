require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkPatients() {
    const connectionString = process.env.POSTGRES_URL || process.env.trgnexus_POSTGRES_URL;

    if (!connectionString) {
        console.error("No POSTGRES_URL or trgnexus_POSTGRES_URL found.");
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

        const res = await client.query('SELECT id, name, email, therapist_id, created_at FROM patients ORDER BY created_at DESC LIMIT 10');
        console.log("Last 10 Patients:");
        console.table(res.rows);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkPatients();
