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

        // 3. Fetch appointment details
        const { data: appt, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                date, time, therapist_id, patient_id, session_data,
                patients (name, email, phone, notes),
                therapists (name, email, phone)
            `)
            .eq('id', appointmentId)
            .single();

        // 4. Register transaction — upsert to avoid duplicates if webhook ran first
        if (appt) {
            const amountInReais = paymentIntent.amount / 100; // Stripe uses cents
            // session_data.price is the source of truth; fallback to Stripe amount
            const finalAmount = Number((appt as any).session_data?.price ?? amountInReais) || amountInReais;

            const { error: txError } = await supabase
                .from('transactions')
                .upsert(
                    {
                        therapist_id: (appt as any).therapist_id,
                        patient_id: (appt as any).patient_id,
                        appointment_id: appointmentId,
                        amount: finalAmount,
                        type: 'income',
                        status: 'paid',
                        category: 'Sessão TRG',
                        description: `Pagamento via Stripe — ${(appt as any).patients?.name ?? 'Paciente'}`,
                        date: (appt as any).date,
                    },
                    { onConflict: 'appointment_id', ignoreDuplicates: true }
                );

            if (txError) {
                console.error('[Manual Confirm] Failed to upsert transaction:', txError);
            } else {
                console.log(`[Manual Confirm] Transaction registered — R$ ${finalAmount}`);
            }

            // 5. Force Notification
            const patient = (appt as any).patients;
            const therapist = (appt as any).therapists;

            if (patient && therapist) {
                console.log(`[Manual Confirm] Sending notifications to ${patient.name}`);

                await sendBookingNotification({
                    name: patient.name,
                    email: patient.email,
                    phone: patient.phone,
                    date: appt.date,
                    time: appt.time,
                    therapistName: therapist.name,
                    therapistEmail: therapist.email,
                    therapistPhone: therapist.phone
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
        } else {
            console.warn('[Manual Confirm] Could not fetch appointment details:', fetchError);
            return res.status(200).json({
                success: true,
                warning: 'Booking confirmed but appointment details fetch failed'
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
