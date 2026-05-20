
import { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow GET with phone param for browser testing
    if (req.method === 'GET' && !req.query.phone) {
        return res.status(200).json({ status: 'ok', mode: 'read-only', message: 'Add ?phone=YOUR_NUMBER to URL to test send' });
    }

    try {
        const phone = req.body?.phone || req.query.phone;
        const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
        const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
        const fromVal = (process.env.TWILIO_PHONE_NUMBER || '').trim();

        console.log('Test send hit. Phone:', phone);

        if (!sid || !token || !fromVal) {
            return res.status(500).json({ error: 'Missing env vars', debug: { sid: !!sid, token: !!token } });
        }

        // Debug info (Masked)
        const debugInfo = {
            sidPrefix: sid.substring(0, 6) + '...',
            sidLength: sid.length,
            tokenPrefix: token.substring(0, 4) + '...',
            tokenLength: token.length
        };

        const client = twilio(sid, token);

        // Format phone
        let target = (phone as string || '').replace(/\D/g, '');
        if (!target.startsWith('55') && target.length <= 11) target = '55' + target;
        const toVal = `whatsapp:+${target}`;

        console.log(`Attempting send from ${fromVal} to ${toVal}`);

        const message = await client.messages.create({
            from: fromVal,
            to: toVal,
            body: 'Teste Simples do Sistema - Debug'
        });

        return res.status(200).json({ success: true, sid: message.sid, debugInfo });

    } catch (error: any) {
        console.error('Simple Test Error:', error);

        // Capture masked credentials again for error context
        const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
        const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
        const debugInfo = {
            sidPrefix: sid.substring(0, 6) + '...',
            sidLength: sid.length,
            tokenPrefix: token.substring(0, 4) + '...',
            tokenLength: token.length
        };

        return res.status(200).json({ success: false, error: error.message, stack: error.stack, debugInfo });
    }
}
