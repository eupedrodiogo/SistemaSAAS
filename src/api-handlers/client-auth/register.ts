import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Simple password hashing (for demo - in production use bcrypt)
const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password + process.env.STRIPE_SECRET_KEY).digest('hex');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, patientId } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const hashedPassword = hashPassword(password);

        // Check if patient exists with this email
        const existingPatient = await pool.query(
            'SELECT id, email FROM patients WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingPatient.rows.length > 0) {
            // Update existing patient with password
            const patient = existingPatient.rows[0];
            await pool.query(
                'UPDATE patients SET password_hash = $1 WHERE id = $2',
                [hashedPassword, patient.id]
            );
            return res.status(200).json({
                success: true,
                patientId: patient.id,
                message: 'Senha configurada com sucesso.'
            });
        }

        // If patientId provided, update that patient
        if (patientId) {
            await pool.query(
                'UPDATE patients SET password_hash = $1, email = $2 WHERE id = $3',
                [hashedPassword, email.toLowerCase(), patientId]
            );
            return res.status(200).json({
                success: true,
                patientId,
                message: 'Conta criada com sucesso.'
            });
        }

        return res.status(404).json({ error: 'Paciente não encontrado. Complete o agendamento primeiro.' });

    } catch (error: any) {
        console.error('Client registration error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
