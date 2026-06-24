import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotification } from '../utils/notifications.js';

let supabase: any;
function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
        );
    }
    return supabase;
}

const MP_BASE_URL = 'https://api.mercadopago.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    try {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) throw new Error('Token do MercadoPago não configurado no servidor.');

        const { formData, appointmentId, patientName, patientEmail } = req.body;

        if (!formData || !appointmentId) {
            return res.status(400).json({ error: 'Faltam dados do pagamento (formData) ou ID do agendamento.' });
        }

        // Fazer a cobrança no MercadoPago
        const mpResponse = await fetch(`${MP_BASE_URL}/v1/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `card_${appointmentId}_${Date.now()}`
            },
            body: JSON.stringify({
                ...formData,
                description: `Sessão de Terapia - ${patientName}`,
                external_reference: appointmentId,
                payer: {
                    ...formData.payer,
                    email: patientEmail || formData.payer.email,
                }
            })
        });

        const payment = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('[MP process-card] Erro:', payment);
            throw new Error(payment.message || 'Erro ao processar pagamento com cartão.');
        }

        const sb = getSupabase();

        // Salvar payment_id no agendamento para referência
        await sb
            .from('appointments')
            .update({ pix_txid: String(payment.id) }) // Reutilizando a coluna pix_txid para o ID do pagamento MP
            .eq('id', appointmentId);

        // Se o pagamento for aprovado imediatamente
        if (payment.status === 'approved') {
            await sb
                .from('appointments')
                .update({ status: 'scheduled' })
                .eq('id', appointmentId);

            const { data: appt } = await sb
                .from('appointments')
                .select(`
                    date, time, therapist_id, patient_id, session_data,
                    patients (name, email, phone),
                    therapists (name, email, phone)
                `)
                .eq('id', appointmentId)
                .single();

            if (appt) {
                const finalAmount = payment.transaction_amount;

                await sb.from('transactions').upsert(
                    {
                        therapist_id: appt.therapist_id,
                        patient_id: appt.patient_id,
                        appointment_id: appointmentId,
                        amount: finalAmount,
                        type: 'income',
                        status: 'paid',
                        category: 'Sessão TRG',
                        description: `Pagamento MP Cartão — ${appt.patients?.name || 'Paciente'}`,
                        date: appt.date,
                    },
                    { onConflict: 'appointment_id', ignoreDuplicates: true }
                );

                const patient = appt.patients;
                const therapist = appt.therapists;
                if (patient) {
                    await sendBookingNotification({
                        name: patient.name,
                        email: patient.email,
                        phone: patient.phone,
                        date: appt.date,
                        time: appt.time,
                        therapistName: therapist?.name,
                        therapistEmail: therapist?.email,
                        therapistPhone: therapist?.phone
                    }).catch(err => console.error('Erro enviando notificação:', err));
                }
            }
        }

        return res.status(200).json({ status: payment.status, id: payment.id, status_detail: payment.status_detail });

    } catch (err: any) {
        console.error('[process-card] Exception:', err);
        return res.status(500).json({ error: err.message || 'Erro interno ao processar cartão.' });
    }
}
