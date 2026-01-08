import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

// Inlined auth utilities
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

    // Debugging: Confirming deployment
    console.log('Requesting Patients via Supabase Client...');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = req.query;

    try {
        if (id) {
            const patientId = Array.isArray(id) ? id[0] : id;
            if (req.method === 'PUT') {
                const { name, email, phone, status, notes } = req.body;
                const { data, error } = await supabase
                    .from('patients')
                    .update({ name, email, phone, status, notes })
                    .eq('id', patientId)
                    .eq('therapist_id', user.id) // Ensure ownership
                    .select()
                    .single();

                if (error || !data) return res.status(404).json({ error: 'Patient not found or unauthorized' });
                return res.status(200).json(data);
            }
            else if (req.method === 'DELETE') {
                const { error } = await supabase
                    .from('patients')
                    .delete()
                    .eq('id', patientId)
                    .eq('therapist_id', user.id); // Ensure ownership

                if (error) throw error;
                return res.status(200).json({ message: 'Deleted successfully' });
            }
            else {
                res.setHeader('Allow', ['PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        }
        else {
            if (req.method === 'GET') {
                // Fetch patients for logged-in therapist
                const { data, error } = await supabase
                    .from('patients')
                    .select('*, appointments(status)')
                    .eq('therapist_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Calculate Total Invested
                const enrichedData = data.map((p: any) => {
                    const completedApts = p.appointments?.filter((a: any) => a.status === 'Concluída' || a.status === 'completed').length || 0;
                    // Remove appointments array from response to keep payload clean, or keep it if needed.
                    // Let's keep the patient object clean but add the calculated field.
                    const { appointments, ...patientData } = p;
                    return {
                        ...patientData,
                        totalInvested: completedApts * 250
                    };
                });

                return res.status(200).json(enrichedData);
            }
            else if (req.method === 'POST') {
                const { name, email, phone, status, notes } = req.body;
                const { data, error } = await supabase
                    .from('patients')
                    .insert([{
                        name, email, phone, status, notes,
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
        console.error('Patients API Error:', error);
        res.status(500).json({
            error: error.message,
            details: error.toString()
        });
    }
}
