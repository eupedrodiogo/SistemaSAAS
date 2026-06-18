import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendPaymentLinkEmail } from '../utils/notifications.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, name, checkoutUrl, price, therapistName } = req.body;

        if (!email || !name || !checkoutUrl) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendPaymentLinkEmail({
            email,
            name,
            checkoutUrl,
            price: price || 'R$ 0,00',
            therapistName: therapistName || 'Terapeuta TRG'
        });

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        return res.status(200).json({ success: true, message: 'Email sent successfully' });

    } catch (err: any) {
        console.error('[SendEmailLink API] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
