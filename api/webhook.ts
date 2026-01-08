
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotification } from './utils/notifications';

// Disable bodyParser to receive raw body for Stripe signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function buffer(readable: any) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        if (!endpointSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');

        const rawBody = await buffer(req);
        event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);

    } catch (err: any) {
        console.error(`[Webhook Error] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Webhook] Received event type: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { appointmentId } = paymentIntent.metadata;

        console.log(`[Webhook] Payment succeeded for Appointment ${appointmentId}`);

        if (appointmentId) {
            // 1. Update Booking Status
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ status: 'scheduled' })
                .eq('id', appointmentId);

            if (updateError) {
                console.error('[Webhook] Failed to update appointment:', updateError);
                return res.status(500).json({ error: 'Database Update Failed' });
            }

            console.log(`[Webhook] Appointment ${appointmentId} updated to 'scheduled'`);

            // 2. Send Notification
            // Fetch details first (Patient, Therapist)
            const { data: appt, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    date, time,
                    patients (name, email, phone, notes),
                    therapists (name, email, phone)
                `)
                .eq('id', appointmentId)
                .single();

            if (appt) {
                console.log(`[Webhook] Preparing notifications for ${appt.patients?.name}`);

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
                console.log('[Webhook] Notifications Sent Successfully');
            } else {
                console.error('[Webhook] Could not fetch appointment details for notification. Fetch Error:', fetchError);
            }
        } else {
            console.warn('[Webhook] No appointmentId found in PaymentIntent metadata.');
        }
    }

    res.json({ received: true });
}
