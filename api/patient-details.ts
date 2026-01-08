import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

const getSecret = () => process.env.SECRET_KEY || 'change-this-secret-in-prod';

function verifyAuth(req: VercelRequest, res: VercelResponse): { id: string; email: string } | null {
    const auth = req.headers['authorization'];
    if (!auth) {
        res.status(401).json({ message: 'Token não fornecido' });
        return null;
    }
    const token = (Array.isArray(auth) ? auth[0] : auth).split(' ')[1];
    try {
        const decoded = jwt.verify(token, getSecret()) as any;
        return decoded;
    } catch {
        res.status(403).json({ message: 'Token inválido' });
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = verifyAuth(req, res);
    if (!user) return;

    const { patientId } = req.query;

    if (!patientId) {
        return res.status(400).json({ error: 'Missing patientId' });
    }

    // Handle Demo Patient for AI Reports
    if (patientId === 'demo') {
        return res.status(200).json({
            timeline: [
                { id: 'demo1', type: 'session', date: new Date().toISOString(), title: 'Sessão - TRG', desc: 'Status: Concluída. Evolução positiva.', status: 'Concluída' }
            ],
            financial: {
                totalInvested: 1000,
                pending: 0,
                history: []
            },
            documents: []
        });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const pId = Array.isArray(patientId) ? patientId[0] : patientId;

        // 1. Fetch Patient to verify ownership
        const { data: patient, error: pError } = await supabase
            .from('patients')
            .select('id')
            .eq('id', pId)
            .eq('therapist_id', user.id)
            .single();

        if (pError || !patient) {
            return res.status(403).json({ error: 'Unauthorized access or patient not found' });
        }

        // 2. Fetch Appointments for Timeline & Financials
        const { data: appointments, error: aError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', pId)
            .eq('therapist_id', user.id)
            .order('date', { ascending: false });

        if (aError) throw aError;

        // Timeline Construction
        const timeline = appointments.map((apt: any) => ({
            id: apt.id,
            type: 'session',
            date: apt.date + 'T' + apt.time, // Construct roughly if stored separately
            title: `Sessão - ${apt.type}`,
            desc: `Status: ${apt.status}. ${apt.session_data?.notes || ''}`,
            status: apt.status
        }));

        // Financial Calculation (Mocked logic for now: R$ 250 per session)
        const PRICE_PER_SESSION = 250;

        const completedAppointments = appointments.filter((a: any) => a.status === 'Concluída' || a.status === 'completed');
        const pendingAppointments = appointments.filter((a: any) => a.status === 'Agendado' || a.status === 'scheduled' || a.status === 'pending_payment');

        const totalInvested = completedAppointments.length * PRICE_PER_SESSION;
        const pending = pendingAppointments.length * PRICE_PER_SESSION;

        const financialHistory = appointments.map((apt: any) => ({
            id: apt.id,
            date: apt.date,
            desc: `Sessão ${apt.type}`,
            value: PRICE_PER_SESSION,
            status: (apt.status === 'Concluída' || apt.status === 'completed') ? 'Pago' : 'Pendente'
        }));

        // 3. Documents (Empty for now)
        const documents: any[] = [];

        res.status(200).json({
            timeline,
            financial: {
                totalInvested,
                pending,
                history: financialHistory
            },
            documents
        });

    } catch (error: any) {
        console.error('Patient Details API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
