import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMetaWhatsApp } from './utils/notifications.js';
import { WHATSAPP_TEMPLATES } from './notifications/templates.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { phone, type = 'test' } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Missing phone number' });
    }

    try {
        let result;

        if (type === 'test') {
            // Use standard hello_world for connectivity check
            const template = WHATSAPP_TEMPLATES.HELLO_WORLD;
            result = await sendMetaWhatsApp(phone, template.name, template.language.code);
        } else if (type === 'welcome') {
            // Use custom welcome template
            const template = WHATSAPP_TEMPLATES.WELCOME('Teste de Sistema');
            result = await sendMetaWhatsApp(phone, template.name, template.language.code, template.components);
        } else if (type === 'booking') {
            // Simulate a booking confirmation
            const template = WHATSAPP_TEMPLATES.BOOKING_CONFIRMATION(
                'Teapeuta Teste',
                'Paciente Teste',
                '01/01/2026',
                '10:00'
            );
            result = await sendMetaWhatsApp(phone, template.name, template.language.code, template.components);
        } else {
            return res.status(400).json({ error: 'Invalid test type. Use "test" (hello_world), "welcome", or "booking".' });
        }

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Meta API Error',
                details: result.error
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
            message: 'Message sent successfully'
        });

    } catch (error: any) {
        console.error('Handler Error:', error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}
