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

    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const { role, userId } = req.query;

            if (!role || !userId) {
                return res.status(400).json({ error: 'Missing role or userId' });
            }

            const result = await client.query(
                `SELECT * FROM notifications 
                 WHERE recipient_role = $1 AND recipient_id = $2 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [role, userId]
            );

            // Format time for frontend (e.g., "Há 5 min") - simplified for now, frontend can handle better
            const notifications = result.rows.map(n => ({
                ...n,
                time: new Date(n.created_at).toLocaleString('pt-BR') // Frontend can reformat this
            }));

            return res.status(200).json({ notifications });
        }

        if (req.method === 'PUT') {
            const { action, id, role, userId } = req.body;

            if (action === 'markAsRead' && id) {
                await client.query(
                    'UPDATE notifications SET read = true WHERE id = $1',
                    [id]
                );
                return res.status(200).json({ success: true });
            }

            if (action === 'markAllAsRead' && role && userId) {
                await client.query(
                    'UPDATE notifications SET read = true WHERE recipient_role = $1 AND recipient_id = $2',
                    [role, userId]
                );
                return res.status(200).json({ success: true });
            }

            return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Notifications API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
