import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''
);

// Simple password hashing
const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password + (process.env.STRIPE_SECRET_KEY || 'default_secret')).digest('hex');
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
        const { data: existingPatients, error: searchError } = await supabaseAdmin
            .from('patients')
            .select('id, email')
            .eq('email', email.toLowerCase());

        if (searchError) throw searchError;

        if (existingPatients && existingPatients.length > 0) {
            // Update existing patient with password
            const patient = existingPatients[0];
            const { error: updateError } = await supabaseAdmin
                .from('patients')
                .update({ password_hash: hashedPassword })
                .eq('id', patient.id);

            if (updateError) throw updateError;

            return res.status(200).json({
                success: true,
                patientId: patient.id,
                message: 'Senha configurada com sucesso.'
            });
        }

        // If patientId provided, update that patient
        if (patientId) {
            const { error: updateByIdError } = await supabaseAdmin
                .from('patients')
                .update({ password_hash: hashedPassword, email: email.toLowerCase() })
                .eq('id', patientId);

            if (updateByIdError) throw updateByIdError;

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
