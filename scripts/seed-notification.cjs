const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function seedNotification() {
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

        // Get all therapists
        const res = await client.query('SELECT id FROM therapists');

        for (const row of res.rows) {
            await client.query(
                `INSERT INTO notifications (recipient_id, recipient_role, title, message, type)
                 VALUES ($1, 'therapist', $2, $3, 'success')`,
                [
                    row.id,
                    'Sistema Atualizado',
                    'O sistema de notificações agora está conectado ao banco de dados em tempo real.'
                ]
            );
            console.log(`Notification seeded for therapist ${row.id}`);
        }

        client.release();
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await pool.end();
    }
}

seedNotification();
