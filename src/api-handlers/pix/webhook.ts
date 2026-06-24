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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    try {
        const body = req.body;
        console.log('[MP Webhook] Evento recebido:', JSON.stringify(body));

        const { type, data } = body;

        // MercadoPago envia type: 'payment' quando um pagamento é criado/atualizado
        if (type !== 'payment' || !data?.id) {
            console.log('[MP Webhook] Evento ignorado:', type);
            return res.status(200).json({ ok: true });
        }

        const paymentId = String(data.id);
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

        // Buscar detalhes do pagamento no MP
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const payment = await mpRes.json() as any;
        if (!mpRes.ok) throw new Error(`Erro ao buscar pagamento ${paymentId}`);

        console.log(`[MP Webhook] Payment ${paymentId} status: ${payment.status}`);

        // Só processar pagamentos aprovados (PIX pago)
        if (payment.status !== 'approved') {
            console.log(`[MP Webhook] Pagamento não aprovado (${payment.status}), ignorando.`);
            return res.status(200).json({ ok: true });
        }

        // Localizar o agendamento pelo payment_id (salvo como pix_txid)
        const sb = getSupabase();
        const { data: appointment, error: fetchError } = await sb
            .from('appointments')
            .select('*, therapists(name, email), patients(name, email)')
            .eq('pix_txid', paymentId)
            .single();

        if (fetchError || !appointment) {
            console.warn(`[MP Webhook] Agendamento não encontrado para paymentId: ${paymentId}`);
            return res.status(200).json({ ok: true });
        }

        if (appointment.status === 'confirmed') {
            console.log(`[MP Webhook] Agendamento ${appointment.id} já confirmado.`);
            return res.status(200).json({ ok: true });
        }

        // Confirmar agendamento
        const { error: updateError } = await sb
            .from('appointments')
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                payment_method: 'pix_mercadopago',
                pix_end_to_end_id: payment.id,
                pix_paid_at: payment.date_approved || new Date().toISOString(),
            })
            .eq('id', appointment.id);

        if (updateError) {
            console.error(`[MP Webhook] Erro ao confirmar agendamento ${appointment.id}:`, updateError);
            return res.status(200).json({ ok: true });
        }

        console.log(`[MP Webhook] ✅ Agendamento ${appointment.id} confirmado via PIX MercadoPago!`);

        // Enviar e-mails de confirmação
        try {
            await sendBookingNotification({
                name: appointment.patients?.name || 'Paciente',
                email: appointment.patients?.email || '',
                therapistEmail: appointment.therapists?.email || '',
                therapistName: appointment.therapists?.name || 'Terapeuta',
                date: appointment.date,
                time: appointment.time,
                price: appointment.price,
                status: 'confirmed',
            });
        } catch (emailErr: any) {
            console.error('[MP Webhook] Erro ao enviar e-mails:', emailErr.message);
        }

        return res.status(200).json({ ok: true });

    } catch (error: any) {
        console.error('[MP Webhook] Erro geral:', error);
        return res.status(200).json({ ok: true }); // Sempre 200 para evitar retry
    }
}
