
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotification } from './utils/notifications.js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.query;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email parameter is required' });
    }

    try {
        console.log(`[Fix] Searching for pending booking for email: ${email}`);

        // 1. Find Patient
        const { data: patients, error: pError } = await supabase
            .from('patients')
            .select('id, name, email, phone')
            .eq('email', email)
            .limit(1);

        if (pError || !patients || patients.length === 0) {
            return res.status(404).json({ error: 'Patient not found', details: pError });
        }

        const patient = patients[0];
        console.log(`[Fix] Found Patient: ${patient.name} (${patient.id})`);

        // 2. Find Pending Appointment
        const { data: appointments, error: aError } = await supabase
            .from('appointments')
            .select(`
                id, date, time, 
                status,
                therapists (name, email, phone)
            `)
            .eq('patient_id', patient.id)
            .eq('status', 'pending_payment')
            .order('created_at', { ascending: false })
            .limit(1);

        if (aError || !appointments || appointments.length === 0) {
            // Check if already scheduled?
            const { data: scheduled } = await supabase
                .from('appointments')
                .select('id, status')
                .eq('patient_id', patient.id)
                .eq('status', 'scheduled')
                .limit(1);

            if (scheduled && scheduled.length > 0) {
                return res.json({ message: 'Appointment is already SCHEDULED.', id: scheduled[0].id });
            }

            return res.status(404).json({ error: 'No PENDING_PAYMENT appointment found for this patient.' });
        }

        const appointment = appointments[0];
        console.log(`[Fix] Found Appointment ${appointment.id} with status ${appointment.status}`);

        // 3. Update Status
        const { error: uError } = await supabase
            .from('appointments')
            .update({ status: 'scheduled' })
            .eq('id', appointment.id);

        if (uError) {
            return res.status(500).json({ error: 'Failed to update status', details: uError });
        }

        // 4. Send Notification
        console.log('[Fix] Sending Notification...');
        await sendBookingNotification({
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            date: appointment.date,
            time: appointment.time,
            therapistName: (appointment.therapists as any)?.name || 'Terapeuta TRG',
            therapistEmail: (appointment.therapists as any)?.email,
            therapistPhone: (appointment.therapists as any)?.phone
        });

        return res.json({
            success: true,
            message: 'Appointment fixed and notifications sent.',
            appointmentId: appointment.id,
            patient: patient.name
        });

    } catch (error: any) {
        console.error('[Fix] Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
