import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Misconfiguration', details: 'Missing keys' });
    }

    const { date, therapistId } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Missing date parameter' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const targetDate = new Date(date as string);
        const dayOfWeek = targetDate.getDay(); // 0-6

        let startHour = 8;
        let endHour = 18;
        let isActive = true;

        // 1. Fetch Availability Settings (if therapistId provided)
        if (therapistId) {
            // Check if table exists/has data. If not, defaults apply.
            const { data: settings } = await supabase
                .from('availability_settings')
                .select('start_time, end_time, is_active')
                .eq('therapist_id', therapistId)
                .eq('day_of_week', dayOfWeek)
                .single();

            if (settings) {
                isActive = settings.is_active;
                startHour = parseInt(settings.start_time.split(':')[0]);
                endHour = parseInt(settings.end_time.split(':')[0]);
            }
        }

        if (!isActive) {
            return res.status(200).json({ slots: [] });
        }

        // 2. Generate All Possible Slots
        const allSlots: string[] = [];
        for (let h = startHour; h < endHour; h++) {
            allSlots.push(`${h.toString().padStart(2, '0')}:00`);
        }

        // 3. Fetch Existing Appointments (Occupied Slots)
        // We filter by date and therapist (if provided)
        // Date format in DB is YYYY-MM-DD. Input `date` is YYYY-MM-DD usually.

        let query = supabase
            .from('appointments')
            .select('time')
            .eq('date', date)
            .neq('status', 'Cancelado'); // localized status check?

        if (therapistId) {
            query = query.eq('therapist_id', therapistId);
        }

        const { data: appointments, error: appError } = await query;

        if (appError) throw appError;

        const occupiedSlots = new Set(appointments?.map(a => a.time.substring(0, 5)) || []); // Ensure 'HH:MM' format

        // 4. Map to response format
        const slots = allSlots.map(time => ({
            id: time,
            time,
            available: !occupiedSlots.has(time)
        }));

        return res.status(200).json({ slots });

    } catch (error: any) {
        console.error('Availability Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
