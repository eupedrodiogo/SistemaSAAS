
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
        if (req.method === 'GET') {
            const { patientId } = req.query;

            if (!patientId) {
                return res.status(400).json({ error: 'Missing patientId' });
            }

            const result = await client.query(
                'SELECT * FROM sud_records WHERE patient_id = $1 ORDER BY date ASC',
                [patientId]
            );

            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { therapistId, patientId, score, notes, date } = req.body;

            if (!therapistId || !patientId || score === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await client.query(
                `INSERT INTO sud_records (therapist_id, patient_id, score, notes, date)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [therapistId, patientId, score, notes || '', date || new Date().toISOString()]
            );

            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Missing record ID' });
            }

            await client.query('DELETE FROM sud_records WHERE id = $1', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('SUD API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
