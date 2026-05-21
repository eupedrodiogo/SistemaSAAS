
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Appointment } from '../../types';
import * as jwt from 'jsonwebtoken';

// Inlined auth utilities
const getSecret = () => process.env.SECRET_KEY || 'change-this-secret-in-prod';
async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<{ id: string; email: string } | null> {
    const auth = req.headers['authorization'];
    if (!auth) {
        res.status(401).json({ message: 'Token não fornecido' });
        return null;
    }
    const token = (Array.isArray(auth) ? auth[0] : auth).split(' ')[1];

    // Validate using Supabase Auth instead of manual JWT verify
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY; // Service key needed to verify any valid token

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase Config Missing in verifyAuth');
        // Fallback to old unsecured check or fail? Fails safe.
        res.status(500).json({ message: 'Server Configuration Error' });
        return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.warn('Auth Failed:', error?.message);
        res.status(403).json({ message: 'Token inválido ou expirado' });
        return null;
    }

    return { id: user.id, email: user.email || '' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = await verifyAuth(req, res);
    if (!user) return;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = req.query;

    try {
        // Handle operations on a specific appointment
        if (id) {
            const appointmentId = Array.isArray(id) ? id[0] : id;

            if (req.method === 'GET') {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*, patients(name, email, phone)')
                    .eq('id', appointmentId)
                    .eq('therapist_id', user.id)
                    .single();

                if (error || !data) {
                    return res.status(404).json({ error: 'Appointment not found' });
                }

                const formatted = {
                    id: data.id,
                    patientId: data.patient_id,
                    patientName: data.patients?.name || 'Desconhecido',
                    date: data.date,
                    time: data.time,
                    status: data.status,
                    type: data.type,
                    notes: data.notes,
                    sessionData: data.session_data || {}
                };

                return res.status(200).json(formatted);
            }

            if (req.method === 'PUT') {
                const { date, time, status, type, notes, sessionData } = req.body;

                let dbStatus = status;
                if (status === 'Agendado') dbStatus = 'scheduled';
                if (status === 'Concluído') dbStatus = 'completed';
                if (status === 'Cancelado') dbStatus = 'cancelled';

                // Check cancel notification BEFORE update logic
                let shouldNotify = (dbStatus === 'cancelled' || status === 'Cancelado');
                let existingAppointment: any = null;

                if (shouldNotify) {
                    const { data: existing } = await supabase
                        .from('appointments')
                        .select('*, patients(name, email, phone), therapists(id, name)')
                        .eq('id', appointmentId)
                        .single();
                    existingAppointment = existing;
                }

                const updatePayload: any = {
                    date, time, status: dbStatus, type, notes
                };
                if (sessionData !== undefined) {
                    updatePayload.session_data = sessionData;
                }

                const { data, error } = await supabase
                    .from('appointments')
                    .update(updatePayload)
                    .eq('id', appointmentId)
                    .eq('therapist_id', user.id)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) return res.status(404).json({ error: 'Appointment not found or unauthorized' });

                // Send Notification if Needed
                if (shouldNotify && existingAppointment && existingAppointment.patients) {
                    try {
                        const { sendBookingCancellation } = await import('./utils/notifications');
                        const p = existingAppointment.patients;
                        const t = existingAppointment.therapists || {};

                        let dateStr = existingAppointment.date;
                        const [y, m, d] = dateStr.split('-');
                        const formattedDate = `${d}/${m}/${y}`;

                        await sendBookingCancellation({
                            name: p.name,
                            email: p.email,
                            phone: p.phone,
                            date: formattedDate,
                            time: existingAppointment.time,
                            therapistName: t.name || 'Terapeuta'
                        });
                    } catch (notifyErr) {
                        console.error('Notification Error:', notifyErr);
                    }
                }

                return res.status(200).json(data);
            }
            else if (req.method === 'DELETE') {
                const { error } = await supabase
                    .from('appointments')
                    .delete()
                    .eq('id', appointmentId)
                    .eq('therapist_id', user.id);

                if (error) throw error;
                return res.status(200).json({ message: 'Deleted successfully' });
            }
            else if (req.method === 'GET') {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*, patients(name, email, phone)')
                    .eq('id', appointmentId)
                    .single();

                if (error) throw error;
                if (!data) return res.status(404).json({ error: 'Appointment not found' });

                const formatted = {
                    id: data.id.toString(),
                    patientId: data.patient_id.toString(),
                    patientName: data.patients?.name || 'Desconhecido',
                    date: data.date,
                    time: data.time,
                    status: data.status,
                    type: data.type,
                    notes: data.notes,
                    sessionData: data.session_data || {}
                };

                return res.status(200).json(formatted);
            }
            else {
                res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        }
        else {
            // GET / POST
            if (req.method === 'GET') {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*, patients(name)')
                    .eq('therapist_id', user.id)
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });

                if (error) throw error;

                // Format for frontend
                const formatted = (data || []).map((row: any) => {
                    let dateStr = row.date; // already YYYY-MM-DD string in Supabase

                    return {
                        id: row.id.toString(),
                        patientId: row.patient_id.toString(),
                        patientName: row.patients?.name || 'Desconhecido',
                        date: dateStr,
                        time: row.time,
                        status: row.status,
                        type: row.type,
                        notes: row.notes,
                        sessionData: row.session_data || {}
                    } as Appointment;
                });

                return res.status(200).json(formatted);
            }
            else if (req.method === 'POST') {
                const { patientId, date, time, status, type, notes, sessionData } = req.body;

                let dbStatus = status;
                if (status === 'Agendado') dbStatus = 'scheduled';

                const { data, error } = await supabase
                    .from('appointments')
                    .insert([{
                        patient_id: patientId,
                        date,
                        time,
                        status: dbStatus,
                        type,
                        notes,
                        session_data: sessionData || {},
                        therapist_id: user.id
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return res.status(201).json(data);
            }
            else {
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        }
    } catch (error: any) {
        console.error('Appointments API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
