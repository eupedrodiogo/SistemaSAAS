import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotification } from './utils/notifications.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
});

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { paymentIntentId, appointmentId } = req.body;

    if (!paymentIntentId || !appointmentId) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        // 1. Double-check with Stripe that the payment is actually successful
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not successful yet' });
        }

        // 2. Update Database locally (redundant but safer)
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'scheduled' })
            .eq('id', appointmentId);

        if (updateError) {
            console.error('DB Update Error:', updateError);
            throw updateError;
        }

        // 3. Force Notification
        const { data: appt, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                date, time,
                patients (name, email, phone, notes),
                therapists (name, email, phone)
            `)
            .eq('id', appointmentId)
            .single();

        if (appt && appt.patients && appt.therapists) {
            console.log(`[Manual Confirm] Sending WhatsApp to ${appt.patients.name}`);

            await sendBookingNotification({
                name: appt.patients.name,
                email: appt.patients.email,
                phone: appt.patients.phone,
                date: appt.date,
                time: appt.time,
                therapistName: appt.therapists.name,
                therapistEmail: appt.therapists.email,
                therapistPhone: appt.therapists.phone
            });

            return res.status(200).json({
                success: true,
                message: 'Booking confirmed and notification sent'
            });
        } else {
            console.warn('Could not fetch appointment details:', fetchError);
            // Still return success as the payment was confirmed
            return res.status(200).json({
                success: true,
                warning: 'Booking confirmed but notification details fetch failed'
            });
        }

    } catch (err: any) {
        console.error('[Manual Confirm Error]', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });
    }
}
