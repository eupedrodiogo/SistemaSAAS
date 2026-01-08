const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('No connection string found');
        return;
    }

    const pool = new Pool({
        connectionString: connectionString.replace('?sslmode=require', '?'),
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS recordings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                patient_id INTEGER REFERENCES patients(id),
                therapist_id INTEGER, -- Optional, if we want to track who uploaded
                url TEXT NOT NULL,
                filename TEXT NOT NULL,
                size TEXT,
                duration TEXT,
                type TEXT,
                phase TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client.query(createTableQuery);
        console.log('Table "recordings" created or already exists.');

        client.release();
    } catch (err) {
        console.error('Migration Error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
