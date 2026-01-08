require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkTherapist() {
    const connectionString = process.env.POSTGRES_URL || process.env.trgnexus_POSTGRES_URL;
    if (!connectionString) return console.error("No Connection String");

    const pool = new Pool({
        connectionString: connectionString.replace('?sslmode=require', '?'),
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        const res = await client.query("SELECT * FROM therapists WHERE id = '4220bc6f-7e95-4afb-b3fe-fa00789fe275'");
        console.log("Therapist:", res.rows[0]);
        client.release();
    } catch (err) { console.error(err); } finally { await pool.end(); }
}

checkTherapist();
