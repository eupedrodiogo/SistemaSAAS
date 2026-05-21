import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        const client = await pool.connect();

        // Add session_data column if it doesn't exist
        await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;
        `);

        client.release();
        return res.status(200).json({ message: 'Migration successful: session_data column added.' });
    } catch (error: any) {
        console.error('Migration Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        await pool.end();
    }
}
