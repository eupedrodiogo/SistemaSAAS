
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendSessionReminder } from '../utils/notifications';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Authenticate Cron Request
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing Supabase Config' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log('Cron: Checking for appointments tomorrow...');

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('pt-BR'); // DD/MM/YYYY

        console.log(`Target Date: ${tomorrowStr}`);

        // Query: Status = scheduled AND Date = tomorrow AND reminder_sent != true
        // Note: Supabase Select with Joins
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id, date, time, reminder_sent,
                patients!inner (name, email, phone),
                therapists!inner (name)
            `)
            .eq('status', 'scheduled')
            .eq('date', tomorrowStr)
            .is('reminder_sent', false); // Assume false or null if default set

        if (error) throw error;

        console.log(`Found ${appointments?.length || 0} appointments for ${tomorrowStr}`);

        if (!appointments || appointments.length === 0) {
            return res.status(200).json({ message: 'No appointments to remind.' });
        }

        const updates = [];

        for (const appt of appointments) {
            const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
            const therapist = Array.isArray(appt.therapists) ? appt.therapists[0] : appt.therapists;

            // Type Guard fallback
            const pName = patient?.name || 'Paciente';
            const pPhone = patient?.phone;
            const pEmail = patient?.email;
            const tName = therapist?.name || 'Trg Nexus';

            console.log(`Sending reminder to ${pName} (${pPhone})...`);

            try {
                if (pPhone) {
                    await sendSessionReminder({
                        name: pName,
                        phone: pPhone,
                        date: appt.date,
                        time: appt.time
                    });

                    updates.push(appt.id);
                }
            } catch (err) {
                console.error(`Failed to remind appointment ${appt.id}:`, err);
            }
        }

        // Batch Update
        if (updates.length > 0) {
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ reminder_sent: true })
                .in('id', updates);

            if (updateError) throw updateError;
            console.log(`Marked ${updates.length} appointments as reminded.`);
        }

        return res.status(200).json({ success: true, processed: appointments.length, sent: updates.length });

    } catch (error: any) {
        console.error('Cron Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
