
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotification } from '../utils/notifications';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing Supabase Config' });
    }

    /* 
      Body: {
        sourceTherapistId,
        targetTherapistId,
        patientName,
        patientContact,
        patientNeeds,
        sessionPrice
      }
    */
    const {
        sourceTherapistId,
        targetTherapistId,
        patientName,
        patientContact,
        patientNeeds,
        sessionPrice
    } = req.body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log(`Processing Referral: ${sourceTherapistId} -> ${targetTherapistId}`);

        // 1. Calculate Commission (Split)
        const price = Number(sessionPrice) || 150.00;
        const commission = price * 0.10; // 10% referral fee to source/platform (simplified)

        // 2. Create Referral Record
        const { data: referral, error } = await supabase
            .from('referrals')
            .insert({
                source_therapist_id: sourceTherapistId,
                target_therapist_id: targetTherapistId,
                patient_name: patientName,
                patient_contact: patientContact,
                patient_needs: patientNeeds,
                status: 'pending',
                session_price: price,
                commission_amount: commission
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Notify Target Therapist (WhatsApp Opportunity)
        // Need to fetch target therapist phone first
        const { data: targetTherapist } = await supabase
            .from('therapists')
            .select('phone, name, email')
            .eq('id', targetTherapistId)
            .single();

        if (targetTherapist?.phone) {
            console.log(`Notifying Target: ${targetTherapist.name}`);
            await sendBookingNotification({
                name: patientName,
                email: 'placeholder@referral.com', // System placeholder, strictly for interface satisfaction
                phone: '00000000000', // No patient message for this specific type, processed in utils
                date: new Date().toLocaleDateString('pt-BR'),
                time: 'Agora',
                therapistName: targetTherapist.name,
                mainComplaint: `Sessão R$ ${price.toFixed(2)}`,

                // Custom Props for Refactored Notification util
                type: 'referral_offer',
                therapistPhone: targetTherapist.phone
            } as any);
        }

        return res.status(200).json({ success: true, referral });

    } catch (error: any) {
        console.error('Referral Creation Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
