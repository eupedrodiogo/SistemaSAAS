import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import { verifyAuth } from './utils/auth';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // 1. Verify Auth
    const user = verifyAuth(req, res);
    if (!user) return; // Response handled by verifyAuth

    const { method } = req;

    try {
        if (method === 'GET') {
            // LIST RECORDINGS
            const { patientId } = req.query;

            if (!patientId) {
                return res.status(400).json({ error: 'Patient ID is required' });
            }

            // 2. Verify Ownership
            const { rows: patientCheck } = await sql`
                SELECT id FROM patients WHERE id = ${patientId} AND therapist_id = ${user.id}
            `;
            if (patientCheck.length === 0) {
                return res.status(403).json({ error: 'Unauthorized access to this patient' });
            }

            const { rows } = await sql`
                SELECT * FROM recordings 
                WHERE patient_id = ${patientId} 
                ORDER BY created_at DESC
            `;
            return res.status(200).json(rows);
        }

        else if (method === 'POST') {
            // UPLOAD RECORDING
            const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
            const filename = searchParams.get('filename') || 'recording.webm';
            const patientId = searchParams.get('patientId');
            const duration = searchParams.get('duration');
            const size = searchParams.get('size');
            const phase = searchParams.get('phase');

            if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

            // 2. Verify Ownership
            const { rows: patientCheck } = await sql`
                SELECT id FROM patients WHERE id = ${patientId} AND therapist_id = ${user.id}
            `;
            if (patientCheck.length === 0) {
                return res.status(403).json({ error: 'Unauthorized access to this patient' });
            }

            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                throw new Error('BLOB_READ_WRITE_TOKEN is not defined');
            }

            // Upload to Vercel Blob
            // Note: 'put' handles the body from req stream automatically
            const blob = await put(filename, req, {
                access: 'public',
            });

            // Save metadata to Postgres
            await sql`
                INSERT INTO recordings (patient_id, url, filename, size, duration, phase, type)
                VALUES (${patientId}, ${blob.url}, ${filename}, ${size}, ${duration}, ${phase}, 'video')
            `;

            return res.status(200).json(blob);
        }

        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Recordings API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
