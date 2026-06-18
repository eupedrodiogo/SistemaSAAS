import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

const asaasRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!ASAAS_API_KEY) {
        throw new Error('ASAAS_API_KEY não configurada no ambiente');
    }

    const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
            ...(options.headers || {}),
        },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        console.error('Asaas Error Details:', data);
        throw new Error(data?.errors?.[0]?.description || 'Erro na requisição ao Asaas');
    }

    return data;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action } = req.query as { action: string };

    try {
        if (action === 'charge') {
            const { name, email, phone, cpfCnpj, amount, description, billingType = 'UNDEFINED', dueDate } = req.body;

            // 1. Procurar ou Criar Cliente no Asaas
            let customerId = '';
            
            // Tenta buscar por CPF/CNPJ se fornecido, ou usa email
            let searchEndpoint = `/customers?email=${encodeURIComponent(email)}`;
            if (cpfCnpj) {
                searchEndpoint = `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`;
            }

            const searchResponse = await asaasRequest(searchEndpoint);
            
            if (searchResponse && searchResponse.data && searchResponse.data.length > 0) {
                customerId = searchResponse.data[0].id;
            } else {
                // Criar cliente
                const customerData = await asaasRequest('/customers', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: name || 'Paciente TeraNexus',
                        email,
                        mobilePhone: phone,
                        cpfCnpj,
                    }),
                });
                customerId = customerData.id;
            }

            // 2. Criar Cobrança
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);
            
            const chargePayload: any = {
                customer: customerId,
                billingType, // PIX, BOLETO, CREDIT_CARD ou UNDEFINED
                value: amount,
                dueDate: dueDate || nextDay.toISOString().split('T')[0],
                description: description || 'Sessão de Terapia - TeraNexus',
            };

            const chargeData = await asaasRequest('/payments', {
                method: 'POST',
                body: JSON.stringify(chargePayload),
            });

            // Se for PIX direto, buscar payload
            let pixData = null;
            if (billingType === 'PIX' || chargeData.billingType === 'PIX') {
                pixData = await asaasRequest(`/payments/${chargeData.id}/pixQrCode`);
            }

            return res.status(200).json({ 
                success: true, 
                charge: chargeData,
                pix: pixData,
                invoiceUrl: chargeData.invoiceUrl 
            });
        }

        else {
            return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (err: any) {
        console.error('Asaas API Error:', err);
        return res.status(500).json({ statusCode: 500, message: err.message || 'Internal Server Error' });
    }
}
