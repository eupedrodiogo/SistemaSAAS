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
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });

            const { data: patients, error } = await supabase
                .from('patients')
                .select('id, name, email')
                .eq('email', email);

            if (error) throw error;

            if (patients && patients.length > 0) {
                return res.status(200).json({
                    patientId: patients[0].id,
                    name: patients[0].name,
                    email: patients[0].email
                });
            } else {
                return res.status(404).json({ error: 'Email não encontrado.' });
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

        // GET SESSION PATIENT
        if (req.method === 'GET' && action === 'get_session_patient') {
            const { appointmentId } = req.query;
            if (!appointmentId) return res.status(400).json({ error: 'Appointment ID required' });

            const { data: appointment, error } = await supabase
                .from('appointments')
                .select('patient_id')
                .eq('id', appointmentId)
                .single();

            if (error || !appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            return res.status(200).json({ patientId: appointment.patient_id });
        }

        return res.status(400).json({ error: 'Invalid action or method' });

    } catch (error: any) {
        console.error('Client Portal API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
