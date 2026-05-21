
import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { verifyAuth } from './utils/auth';

const { Pool } = pg;

// Use the robust connection string available in production
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString.replace('?sslmode=require', '') : undefined,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth First
    const user = verifyAuth(req, res);
    if (!user) return; // verifyAuth handles the error response

    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const { patientId } = req.query;

            // FORCE filtering by the logged-in therapist
            let query = `
                SELECT r.*, p.name as patient_name 
                FROM reports r
                LEFT JOIN patients p ON r.patient_id = p.id
                WHERE r.therapist_id = $1
            `;
            const params: any[] = [user.id];

            if (patientId) {
                query += ` AND r.patient_id = $2`;
                params.push(patientId);
            }

            query += ` ORDER BY r.created_at DESC`;

            const result = await client.query(query, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { patientId, title, type, content, metadata } = req.body;

            if (!patientId || !title || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Persistence
            const query = `
                INSERT INTO reports (therapist_id, patient_id, title, type, content, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const result = await client.query(query, [
                user.id, // Force ID from token
                patientId,
                title,
                type || 'evolution',
                content,
                metadata || {}
            ]);

            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'Missing report ID' });
            }

            // Strict Delete: Must belong to therapist
            const { rowCount } = await client.query('DELETE FROM reports WHERE id = $1 AND therapist_id = $2', [id, user.id]);

            if (rowCount === 0) {
                return res.status(404).json({ error: 'Report not found or unauthorized' });
            }

            return res.status(200).json({ success: true });
        }

        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error: any) {
        console.error('Reports API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
