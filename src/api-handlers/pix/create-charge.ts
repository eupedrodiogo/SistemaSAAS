import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

async function mpRequest(path: string, options: RequestInit = {}) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

    const res = await fetch(`${MP_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
            ...options.headers,
        },
    });

    const data = await res.json() as any;
    if (!res.ok) {
        const msg = data?.message || data?.error || JSON.stringify(data);
        throw new Error(`MercadoPago Error: ${msg}`);
    }
    return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    const { amount, appointmentId, patientEmail, patientName } = req.body;

    if (!amount || !appointmentId || !patientEmail) {
        return res.status(400).json({ error: 'amount, appointmentId e patientEmail são obrigatórios.' });
    }

    try {
        // Criar pagamento PIX via MercadoPago /v1/payments
        const payment = await mpRequest('/v1/payments', {
            method: 'POST',
            body: JSON.stringify({
                transaction_amount: Number(amount),
                payment_method_id: 'pix',
                payer: {
                    email: patientEmail,
                    first_name: patientName?.split(' ')[0] || 'Paciente',
                    last_name: patientName?.split(' ').slice(1).join(' ') || '',
                },
                description: `Sessão TeraNexus - Agendamento #${appointmentId}`,
                external_reference: appointmentId,
                date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
            }),
        });

        const txData = payment.point_of_interaction?.transaction_data;
        if (!txData?.qr_code) throw new Error('QR Code não retornado pelo MercadoPago.');

        // Salvar payment_id no agendamento para o webhook localizar depois
        const sb = getSupabase();
        await sb
            .from('appointments')
            .update({ pix_txid: String(payment.id) })
            .eq('id', appointmentId);

        console.log(`[MP PIX] Pagamento criado. id: ${payment.id}, status: ${payment.status}`);

        return res.status(200).json({
            paymentId: String(payment.id),
            qrcode: `data:image/png;base64,${txData.qr_code_base64}`,
            copiaecola: txData.qr_code,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            status: payment.status,
        });

    } catch (error: any) {
        console.error('[MP PIX] Erro ao criar pagamento:', error);
        return res.status(500).json({ error: error.message });
    }
}
