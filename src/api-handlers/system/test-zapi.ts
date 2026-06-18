import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendZApiMessage, checkZApiStatus } from '../utils/zapi.js';

/**
 * POST /api/system/test-zapi
 * Body: { phone: "5521999999999", message?: "texto personalizado" }
 *
 * GET /api/system/test-zapi
 * Retorna o status de conexão da instância Z-API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {

    // GET → Status da Instância
    if (req.method === 'GET') {
        const status = await checkZApiStatus();
        return res.status(200).json({
            zapi_connected: status.connected,
            phone: status.phone,
            error: status.error || null,
            env: {
                instance_id_set: !!process.env.ZAPI_INSTANCE_ID,
                instance_token_set: !!process.env.ZAPI_INSTANCE_TOKEN,
                client_token_set: !!process.env.ZAPI_CLIENT_TOKEN,
            }
        });
    }

    // POST → Enviar mensagem de teste
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use GET (status) or POST (send test).' });
    }

    const { phone, message } = req.body || {};

    if (!phone) {
        return res.status(400).json({ error: 'Campo "phone" é obrigatório.' });
    }

    const testMessage = message ||
        `🌿 *TeraNexus — Teste de Integração*\n\n` +
        `✅ A integração via Z-API está funcionando!\n\n` +
        `Se você recebeu esta mensagem, os lembretes automáticos de sessão estão configurados corretamente.\n\n` +
        `_Sistema TeraNexus_ 💙`;

    const result = await sendZApiMessage(phone, testMessage);

    if (!result.success) {
        return res.status(500).json({
            success: false,
            error: result.error,
            tip: 'Verifique se ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN e ZAPI_CLIENT_TOKEN estão configurados no Vercel e se a instância está conectada.'
        });
    }

    return res.status(200).json({
        success: true,
        message: `Mensagem enviada para ${phone}`,
        zapi_message_id: result.id
    });
}
