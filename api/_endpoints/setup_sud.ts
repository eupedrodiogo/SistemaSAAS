
import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString.replace('?sslmode=require', '') : undefined,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = await pool.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS sud_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                therapist_id UUID NOT NULL,
                patient_id UUID NOT NULL,
                score INTEGER NOT NULL,
                date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Index for faster queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_sud_records_patient ON sud_records(patient_id);
        `);

        return res.status(200).json({ success: true, message: 'Table sud_records created successfully.' });

    } catch (error: any) {
        console.error('Setup Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
