import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { verifyAuth } from './utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = verifyAuth(req, res);
    if (!user) return;

    const { Pool } = pg;
    const { id } = req.query;

    const connectionString = process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace('?sslmode=require', '?') : undefined;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const { rows } = await client.query(
                'SELECT id, day_of_week as "dayOfWeek", start_time as "startTime", end_time as "endTime", label FROM blocked_slots WHERE therapist_id = $1',
                [user.id]
            );
            return res.status(200).json(rows);
        } else if (req.method === 'POST') {
            const { dayOfWeek, startTime, endTime, label } = req.body;

            // Basic validation
            if (dayOfWeek === undefined || !startTime || !endTime) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const { rows } = await client.query(
                `INSERT INTO blocked_slots (therapist_id, day_of_week, start_time, end_time, label)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, day_of_week as "dayOfWeek", start_time as "startTime", end_time as "endTime", label`,
                [user.id, dayOfWeek, startTime, endTime, label || '']
            );
            return res.status(201).json(rows[0]);
        } else if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ error: 'Missing ID' });

            const { rowCount } = await client.query(
                'DELETE FROM blocked_slots WHERE id = $1 AND therapist_id = $2',
                [id, user.id]
            );

            if (rowCount === 0) return res.status(404).json({ error: 'Slot not found or unauthorized' });
            return res.status(200).json({ message: 'Deleted successfully' });
        } else {
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error('Blocked Slots API Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
