const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDb() {
    console.log('Available Env Vars:', Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('DB')));

    // Check for various possible variable names
    const connectionString = process.env.trgnexus_POSTGRES_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('No POSTGRES_URL found');
        return;
    }

    console.log('Using connection string:', connectionString.substring(0, 20) + '...');

    const pool = new Pool({
        connectionString: connectionString.replace('?sslmode=require', '?'),
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        console.log('--- PATIENT 7 ---');
        const patient7 = await client.query('SELECT * FROM patients WHERE id = 7');
        console.log(JSON.stringify(patient7.rows, null, 2));

        console.log('--- APPOINTMENTS FOR 7 ---');
        const appointments7 = await client.query('SELECT * FROM appointments WHERE patient_id = 7');
        console.log(JSON.stringify(appointments7.rows, null, 2));

        client.release();
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await pool.end();
    }
}

checkDb();
