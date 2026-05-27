import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Hardcoding the connection string from .env.local to avoid Vercel missing env vars
    const connectionString = 'postgresql://postgres:Lebazi802%40.@db.kbuknqfnhgyfywnthgyc.supabase.co:5432/postgres';

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        const client = await pool.connect();

        // Add password_hash column if it doesn't exist
        await client.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS password_hash text;
        `);

        client.release();
        return res.status(200).json({ message: 'Column password_hash added successfully' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return res.status(500).json({ error: error.message || 'Error executing migration' });
    } finally {
        await pool.end();
    }
}
