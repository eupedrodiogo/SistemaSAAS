
import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { Pool } = pg;
    const connectionString = process.env.trgnexus_POSTGRES_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database connection string missing' });
    }

    const pool = new Pool({
        connectionString: connectionString.replace('?sslmode=require', '?'),
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        console.log('Running migration: Adding reminder_sent to appointments...');

        await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
        `);

        console.log('Migration successful!');

        client.release();
        return res.status(200).json({ success: true, message: 'Migration applied: reminder_sent column added.' });

    } catch (error: any) {
        console.error('Migration Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        await pool.end();
    }
}
