/**
 * Z-API WhatsApp Integration
 * Documentação: https://developer.z-api.io/
 *
 * Env vars necessárias (Vercel Dashboard > Environment Variables):
 *   ZAPI_INSTANCE_ID     → ID da instância (ex: "3BA4D51...")
 *   ZAPI_INSTANCE_TOKEN  → Token da instância
 *   ZAPI_CLIENT_TOKEN    → Client Token (aba Segurança)
 */

const ZAPI_BASE = 'https://api.z-api.io/instances';

/** Formata número: remove não-dígitos e garante DDI 55 */
export function formatPhoneBR(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    // Garante DDI Brasil
    if (!clean.startsWith('55') && clean.length <= 11) {
        clean = '55' + clean;
    }
    return clean;
}

/**
 * Envia mensagem de texto simples via Z-API.
 * É a função principal — sem templates, sem aprovação da Meta.
 */
export async function sendZApiMessage(phone: string, message: string): Promise<{ success: boolean; id?: string; error?: any }> {
    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const instanceToken = process.env.ZAPI_INSTANCE_TOKEN;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;

    if (!instanceId || !instanceToken) {
        console.warn('[Z-API] Credenciais não configuradas (ZAPI_INSTANCE_ID / ZAPI_INSTANCE_TOKEN).');
        return { success: false, error: 'missing_credentials' };
    }

    const cleanPhone = formatPhoneBR(phone);

    const url = `${ZAPI_BASE}/${instanceId}/token/${instanceToken}/send-text`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (clientToken) headers['Client-Token'] = clientToken;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                phone: cleanPhone,
                message,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Z-API] Erro no envio:', JSON.stringify(data));
            return { success: false, error: data };
        }

        console.log(`[Z-API] Mensagem enviada para ${cleanPhone} → ID: ${data.zaapId || data.messageId}`);
        return { success: true, id: data.zaapId || data.messageId };

    } catch (err: any) {
        console.error('[Z-API] Erro de rede:', err);
        return { success: false, error: err.message };
    }
}

/** Verifica o status de conexão da instância */
export async function checkZApiStatus(): Promise<{ connected: boolean; phone?: string; error?: any }> {
    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const instanceToken = process.env.ZAPI_INSTANCE_TOKEN;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;

    if (!instanceId || !instanceToken) {
        return { connected: false, error: 'missing_credentials' };
    }

    const url = `${ZAPI_BASE}/${instanceId}/token/${instanceToken}/status`;
    const headers: Record<string, string> = {};
    if (clientToken) headers['Client-Token'] = clientToken;

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();

        const connected = data.connected === true || data.value === 'CONNECTED';
        return { connected, phone: data.smartphoneConnected };

    } catch (err: any) {
        return { connected: false, error: err.message };
    }
}
