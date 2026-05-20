
import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendBookingNotification } from '../utils/notifications';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Telefone obrigatório' });
    }

    try {
        console.log('Testing WhatsApp for:', phone);

        // Dummy data simulating a booking
        const result = await sendBookingNotification({
            name: 'Teste de Sistema',
            email: 'ignore@test.com', // Email won't be sent if SMTP unimplemented or we ignore
            phone: phone,
            date: new Date().toLocaleDateString('pt-BR'),
            time: '14:00',
            therapistName: 'Sistema de Teste'
        });

        if (result.status === 'sent_whatsapp') {
            return res.status(200).json({ success: true, message: 'Mensagem enviada ao Twilio!' });
        } else {
            console.warn('WhatsApp test result:', result);
            return res.status(500).json({
                success: false,
                error: 'Falha no envio (Verifique Logs ou Variáveis de Ambiente)',
                details: result
            });
        }

    } catch (error: any) {
        console.error('Test WhatsApp Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
