const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function seedClientNotification() {
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

        // Get all patients
        const res = await client.query('SELECT id FROM patients');

        for (const row of res.rows) {
            await client.query(
                `INSERT INTO notifications (recipient_id, recipient_role, title, message, type)
                 VALUES ($1, 'client', $2, $3, 'info')`,
                [
                    row.id,
                    'Bem-vindo ao Portal',
                    'Seu painel agora conta com um sistema de notificações em tempo real.'
                ]
            );
            console.log(`Notification seeded for client ${row.id}`);
        }

        client.release();
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await pool.end();
    }
}

seedClientNotification();
