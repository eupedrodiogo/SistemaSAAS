
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../utils/auth';
import type { WhatsAppTemplate } from './templates';
import { WHATSAPP_TEMPLATES } from './templates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth
    const user = verifyAuth(req, res);
    if (!user) return;

    // 2. Validate Method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { phone, templateType, templateParams } = req.body;

        if (!phone || !templateType) {
            return res.status(400).json({ error: 'Missing phone or templateType' });
        }

        // 3. Get Template Config
        let templateConfig: WhatsAppTemplate | undefined;

        if (templateType === 'WELCOME') {
            const name = templateParams?.name || 'Cliente';
            templateConfig = WHATSAPP_TEMPLATES.WELCOME(name);

        } else if (templateType === 'HELLO_WORLD') {
            templateConfig = WHATSAPP_TEMPLATES.HELLO_WORLD;

        } else if (templateType === 'BOOKING_CONFIRMATION') {
            const { therapistName, patientName, date, time } = templateParams || {};
            if (!therapistName || !patientName || !date || !time) {
                return res.status(400).json({ error: 'Missing parameters for BOOKING_CONFIRMATION (therapistName, patientName, date, time)' });
            }
            templateConfig = WHATSAPP_TEMPLATES.BOOKING_CONFIRMATION(therapistName, patientName, date, time);

        } else if (templateType === 'BOOKING_CANCELLATION') {
            const { recipientName, date, time } = templateParams || {};
            if (!recipientName || !date || !time) {
                return res.status(400).json({ error: 'Missing parameters for BOOKING_CANCELLATION (recipientName, date, time)' });
            }
            templateConfig = WHATSAPP_TEMPLATES.BOOKING_CANCELLATION(recipientName, date, time);

        } else if (templateType === 'SESSION_REMINDER_15MIN') {
            const { patientName } = templateParams || {};
            if (!patientName) {
                return res.status(400).json({ error: 'Missing parameters for SESSION_REMINDER_15MIN (patientName)' });
            }
            templateConfig = WHATSAPP_TEMPLATES.SESSION_REMINDER_15MIN(patientName);

        } else if (templateType === 'SESSION_NOTIFICATION_CLIENT') {
            const { clientName, therapistName, date, time } = templateParams || {};
            if (!clientName || !therapistName || !date || !time) {
                return res.status(400).json({ error: 'Missing parameters for SESSION_NOTIFICATION_CLIENT' });
            }
            templateConfig = WHATSAPP_TEMPLATES.SESSION_NOTIFICATION_CLIENT(clientName, therapistName, date, time);

        } else {
            return res.status(400).json({ error: `Invalid or unsupported template type: ${templateType}` });
        }

        if (!templateConfig) return res.status(500).json({ error: 'Template config failed' });

        // 4. Meta API Config
        const token = process.env.META_WHATSAPP_TOKEN;
        const phoneId = process.env.META_PHONE_ID;

        if (!token || !phoneId) {
            throw new Error('Meta WhatsApp credentials (META_WHATSAPP_TOKEN, META_PHONE_ID) are missing.');
        }

        // Format Phone (Meta requires strict country code)
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
            formattedPhone = '55' + formattedPhone;
        }

        console.log(`Sending Meta Template [${templateConfig.name}] to ${formattedPhone}...`);

        // 5. Send Request to Graph API
        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'template',
                template: templateConfig
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Meta API Error:', JSON.stringify(data, null, 2));
            return res.status(response.status).json({ error: data.error?.message || 'Failed to send message' });
        }

        return res.status(200).json({ success: true, metaId: data.messages?.[0]?.id });

    } catch (error: any) {
        console.error('Manual WhatsApp Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
