const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupNotifications() {
    const connectionString = process.env.trgnexus_POSTGRES_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('No POSTGRES_URL found');
        return;
    }

    const pool = new Pool({
        connectionString: connectionString.replace('?sslmode=require', '?'),
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                recipient_id INTEGER NOT NULL,
                recipient_role VARCHAR(20) NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(20) DEFAULT 'info',
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Notifications table created successfully.');

        client.release();
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await pool.end();
    }
}

setupNotifications();
