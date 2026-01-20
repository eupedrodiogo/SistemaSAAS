import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth using Supabase
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = (Array.isArray(auth) ? auth[0] : auth).split(' ')[1];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Configuração de Auth ausente no servidor' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

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
                'SELECT id, day_of_week as "dayOfWeek", date, start_time as "startTime", end_time as "endTime", label FROM blocked_slots WHERE therapist_id = $1',
                [user.id]
            );
            return res.status(200).json(rows);
        } else if (req.method === 'POST') {
            const { dayOfWeek, date, startTime, endTime, label } = req.body;

            // Basic validation
            if ((dayOfWeek === undefined && !date) || !startTime || !endTime) {
                return res.status(400).json({ error: 'Missing required fields (dayOfWeek or date)' });
            }

            const { rows } = await client.query(
                `INSERT INTO blocked_slots (therapist_id, day_of_week, date, start_time, end_time, label)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, day_of_week as "dayOfWeek", date, start_time as "startTime", end_time as "endTime", label`,
                [user.id, dayOfWeek ?? null, date ?? null, startTime, endTime, label || '']
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
