import { VercelRequest, VercelResponse } from '@vercel/node';

const MP_BASE_URL = 'https://api.mercadopago.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

    const { txid } = req.query;
    if (!txid || typeof txid !== 'string') return res.status(400).json({ error: 'txid (paymentId) é obrigatório.' });

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' });

    try {
        const res2 = await fetch(`${MP_BASE_URL}/v1/payments/${txid}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await res2.json() as any;
        if (!res2.ok) throw new Error(data.message || 'Erro ao consultar pagamento.');

        // Mapear status MP → padrão interno
        // approved = pago | pending = aguardando | cancelled/rejected = cancelado
        const statusMap: Record<string, string> = {
            approved: 'CONCLUIDA',
            pending: 'ATIVA',
            in_process: 'ATIVA',
            cancelled: 'EXPIRADA',
            rejected: 'EXPIRADA',
        };

        console.log(`[MP PIX] Status do pagamento ${txid}: ${data.status}`);

        return res.status(200).json({
            txid,
            status: statusMap[data.status] || 'ATIVA',
            mpStatus: data.status,
            valor: data.transaction_amount,
        });

    } catch (error: any) {
        console.error('[MP PIX] check-status error:', error);
        return res.status(500).json({ error: error.message });
    }
}
