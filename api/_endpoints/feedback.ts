
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env.local for local dev
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing (POSTGRES_URL)' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
        if (req.method === 'POST') {
            const { therapistId, patientId, userType, rating, category, comment, metadata } = req.body;

            if (!userType || !rating) {
                return res.status(400).json({ error: 'Missing required fields: userType, rating' });
            }

            const { rows } = await client.query(
                `INSERT INTO feedbacks (therapist_id, patient_id, user_type, rating, category, comment, metadata) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [therapistId || null, patientId || null, userType, rating, category, comment, JSON.stringify(metadata || {})]
            );

            return res.status(201).json(rows[0]);
        } else if (req.method === 'GET') {
            // Optional: allow therapists to see their own feedback (if we implement rating for them)
            // or allow admins to see everything. For now, let's just return 405 unless needed.
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        } else {
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error('Feedback API Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
