import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// -----------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Misconfiguration' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { name, email, phone, date, time, therapistId, status = 'scheduled', price, ...restData } = req.body || {};

    // Ensure structure
    const anamnesisData = {
        ...restData,
        transtornos: restData.transtornos || [],
        doresFisicas: restData.doresFisicas || [],
        temasFuturo: restData.temasFuturo || []
    };

    if (!name || !email || !date || !time || !therapistId) {
        return res.status(400).json({ error: 'Missing required fields: name, email, date, time, or therapistId' });
    }

    try {
        console.log(`[Booking] Processing for ${email} with ${therapistId || 'System'} (Status: ${status})`);

        // 1. Fetch Therapist
        let therapistName = 'Terapeuta TRG';
        if (therapistId) {
            const { data: t } = await supabase.from('therapists').select('name').eq('id', therapistId).single();
            if (t) therapistName = t.name;
        }

        // 2. Upsert Patient
        let patientId;
        const { data: existing } = await supabase.from('patients').select('id').eq('email', email).eq('therapist_id', therapistId).limit(1);

        if (existing && existing.length > 0) {
            patientId = existing[0].id;
            await supabase.from('patients').update({ name, phone }).eq('id', patientId);
        } else {
            const { data: newP, error: pError } = await supabase.from('patients').insert({
                name, email, phone, therapist_id: therapistId, status: 'active',
                notes: JSON.stringify(anamnesisData)
            }).select('id').single();
            if (pError) throw pError;
            patientId = newP.id;
        }

        // 3. Create Appointment
        const appointmentQuery = supabase.from('appointments').insert({
            patient_id: patientId,
            therapist_id: therapistId,
            date,
            time,
            status: status,
            type: 'Primeira Consulta',
            notes: JSON.stringify(anamnesisData),
            session_data: { price: price || 0 } // Save price here
        }).select('id');
        const { data: rows, error: aError } = await appointmentQuery;
        if (aError) throw aError;

        // 4. Notifications (Only if Confirmed)
        if (status === 'scheduled') {
            console.log('[Booking] Starting notifications...');

            const { data: therapistData } = await supabase
                .from('therapists')
                .select('email, name, phone')
                .eq('id', therapistId)
                .single();

            const notificationData = {
                name,
                email,
                phone,
                date,
                time,
                therapistName: therapistData?.name || 'Terapeuta TRG',
                therapistEmail: therapistData?.email,
                therapistPhone: therapistData?.phone, // Add phone for WhatsApp
                mainComplaint: anamnesisData.complaint || anamnesisData.queixaPrincipal,
                location: 'Sessão Online'
            };

            // We use the centralized notification utility to ensure iCal and other premium features are applied
            try {
                const { sendBookingNotification } = await import('./utils/notifications.js');
                await sendBookingNotification(notificationData);
            } catch (nError) {
                console.error('[Booking] Notification Error:', nError);
                // Fallback to simple email if utility fails (optional, but keep it robust)
            }

            console.log('[Booking] Notifications processed.');
        } else {
            console.log(`[Booking] Status is ${status}, skipping notifications.`);
        }

        return res.status(200).json({ message: 'Booking processed', patientId, appointmentId: rows && rows[0] ? rows[0].id : undefined });

    } catch (error: any) {
        console.error('[Booking] Fatal Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
