import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Helper function inlined to avoid import issues
const getEmailTemplate = (plan: string, name: string, magicLink?: string) => {
    // ... colors ...
    const primaryColor = '#0f172a';
    const accentColor = '#3b82f6';
    const footerColor = '#64748b';

    const containerStyle = `
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
    `;

    const headerStyle = `
        background-color: ${primaryColor};
        padding: 32px;
        text-align: center;
    `;

    const bodyStyle = `
        padding: 40px 32px;
        color: #334155;
        line-height: 1.6;
    `;

    const buttonStyle = `
        display: inline-block;
        background-color: ${accentColor};
        color: white;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        margin-top: 24px;
        text-align: center;
    `;

    let title, subject, content;
    // Use the provided magicLink if available, otherwise fallback to the standard login URL
    const loginUrl = magicLink || (process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/login` : 'https://trg-nexus.vercel.app/login');

    switch (plan) {
        case 'price_1ScuH5KPo7EypB7VQ7epTjiW': // Estágio
        case 'estagio':
            subject = 'Começou! Seu Acesso ao TRG Nexus (Plano Estágio) 🚀';
            title = 'Bem-vindo ao Início da Sua Jornada';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Parabéns por investir na sua carreira. O <strong>Plano Estágio</strong> é o primeiro passo para organizar seus atendimentos e ganhar confiança clínica.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Minha Conta</a>
                </div>
            `;
            break;

        case 'price_1ScuH5KPo7EypB7VnIs6qfbQ': // Iniciante
        case 'price_1Sd8DXKPo7EypB7VeUWX8m7L': // Iniciante 0.50
        case 'iniciante':
        case 'starter':
            subject = 'Agora é Profissional! Bem-vindo ao TRG Nexus 🌟';
            title = 'Você Subiu de Nível';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Excelente decisão. Com o <strong>Plano Iniciante</strong>, você deixa de apenas "atender" para começar a <strong>gerir</strong>.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Começar Agora</a>
                </div>
            `;
            break;

        case 'price_1SZgFjKPo7EypB7V8hI35TpO': // Profisisonal
        case 'price_1Sd8DXKPo7EypB7VZwytTUEP': // Profissional 0.50
        case 'profissional':
        case 'pro':
            subject = 'Elite TRG: Bem-vindo ao Nexus Profissional 💎';
            title = 'Alta Performance Ativada';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>O <strong>Plano Profissional</strong> é a nossa experiência completa.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Painel VIP</a>
                </div>
            `;
            break;

        default:
            subject = 'Seu Teste Grátis no TRG Nexus Começou! ⚡';
            title = 'Experimente o Poder da Organização';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Iniciar Teste</a>
                </div>
            `;
    }

    return {
        subject,
        html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 20px; background-color: #f8fafc;">
                <div style="${containerStyle}">
                    <div style="${headerStyle}">
                        <h1 style="color: white; margin: 0; font-size: 24px;">TRG <span style="color: ${accentColor}">Nexus</span></h1>
                    </div>
                    <div style="${bodyStyle}">
                        <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
                        ${content}
                         <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: ${footerColor}; text-align: center;">
                            Enviado por TRG Nexus.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, name, plan } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Missing email or name' });
        }

        const port = Number(process.env.SMTP_PORT) || 587;
        const host = (process.env.SMTP_HOST || '').trim();
        const user = (process.env.SMTP_USER || '').trim();
        const pass = (process.env.SMTP_PASS || '').trim();

        if (!host || !user || !pass) {
            console.error('SMTP configuration missing', { host: !!host, user: !!user, pass: !!pass });
            return res.status(500).json({ error: 'Server misconfiguration: SMTP variables missing' });
        }

        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465,
            auth: {
                user: user,
                pass: pass,
            },
        });

        const supabaseAdmin = createClient(
            process.env.VITE_SUPABASE_URL || 'https://qyrsr5sa9s.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        let magicLink: string | undefined;

        try {
            const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email,
                options: {
                    redirectTo: process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/dashboard` : 'https://trg-nexus.vercel.app/dashboard'
                }
            });

            if (!linkError && data && data.properties && data.properties.action_link) {
                console.log('Magic link generated successfully');
                magicLink = data.properties.action_link;
            } else {
                console.error('Failed to generate magic link:', linkError);
            }
        } catch (genError) {
            console.error('Error generating magic link (fallback to login url):', genError);
        }

        const { subject, html } = getEmailTemplate(plan, name, magicLink);

        await transporter.sendMail({
            from: `"TRG Nexus" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            html: html,
        });
        return res.status(200).json({ message: 'Welcome email sent' });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: error.message || 'Unknown server error', stack: error.stack });
    }
}
