import { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Missing name or phone' });
    }

    try {
        const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
        const twilioToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
        const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || '').trim();

        if (!twilioSid || !twilioToken || !twilioFrom) {
            console.error('Twilio credentials missing');
            return res.status(500).json({ error: 'Server misconfiguration: Twilio credentials missing' });
        }

        const client = twilio(twilioSid, twilioToken);

        // Format phone to E.164 if needed (assuming BR defaults)
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
            formattedPhone = '55' + formattedPhone;
        }
        const to = `whatsapp:+${formattedPhone}`;

        // Ensure "From" has prefix
        const from = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;

        const message = `🌟 *Bem-vindo(a) ao TRG Nexus!*\n\nOlá ${name}, seu cadastro foi realizado com sucesso! 🚀\n\nAgora você tem acesso à ferramenta definitiva para gestão dos seus atendimentos.\n\n*Próximos passos:*\n1. Acesse seu email para entrar no painel (Link Mágico).\n2. Complete seu perfil profissional.\n3. Comece a agendar!\n\nQualquer dúvida, estamos por aqui.\n\n_Equipe TRG Nexus_`;

        console.log(`Sending WhatsApp Welcome to ${to}...`);

        await client.messages.create({
            from: from,
            to: to,
            body: message
        });

        return res.status(200).json({ message: 'WhatsApp notification sent' });

    } catch (error: any) {
        console.error('Error sending WhatsApp:', error);
        return res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
}
