import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Misconfiguration' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, patientId } = req.query;

    try {
        // LOGIN ACTION
        if (req.method === 'POST' && action === 'login') {
            const { email, password } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });

            const { data: patients, error } = await supabase
                .from('patients')
                .select('id, name, email, password_hash')
                .eq('email', email.toLowerCase());

            if (error) throw error;

            if (patients && patients.length > 0) {
                const patient = patients[0];

                // If patient has a password, verify it
                if (patient.password_hash) {
                    if (!password) {
                        return res.status(401).json({ error: 'Sua conta requer uma senha.', requiresPassword: true });
                    }

                    // establishment of hashing logic (consistent with register.ts)
                    const crypto = await import('crypto');
                    const hashedPassword = crypto.createHash('sha256').update(password + process.env.STRIPE_SECRET_KEY).digest('hex');

                    if (hashedPassword !== patient.password_hash) {
                        return res.status(401).json({ error: 'Senha incorreta.' });
                    }
                }

                return res.status(200).json({
                    patientId: patient.id,
                    name: patient.name,
                    email: patient.email
                });
            } else {
                return res.status(404).json({ error: 'E-mail não encontrado. Verifique se você já agendou uma sessão.' });
            }
        }

        // DATA ACTION
        if (req.method === 'GET' && action === 'data') {
            if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

            // 1. Fetch Patient Details
            const { data: patient, error: pError } = await supabase
                .from('patients')
                .select('*, therapists(name)')
                .eq('id', patientId)
                .single();

            if (pError) return res.status(404).json({ error: 'Patient not found' });

            // Flatten therapist name
            const patientData = {
                ...patient,
                therapist_name: patient.therapists?.name
            };

            // 2. Fetch Appointments
            const { data: appointments, error: aError } = await supabase
                .from('appointments')
                .select('*')
                .eq('patient_id', patientId)
                .order('date', { ascending: false })
                .order('time', { ascending: false });

            if (aError) throw aError;

            return res.status(200).json({
                patient: patientData,
                appointments: appointments || []
            });
        }

        // GET RECORDINGS
        if (req.method === 'GET' && action === 'recordings') {
            if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

            const { data: recordings, error: rError } = await supabase
                .from('recordings')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (rError) throw rError;

            return res.status(200).json(recordings || []);
        }

        return res.status(400).json({ error: 'Invalid action or method' });

    } catch (error: any) {
        console.error('Client Portal API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
