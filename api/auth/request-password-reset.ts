import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, redirectUrl } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Generate Recovery Link via Supabase Admin
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: redirectUrl || 'https://trgnexus.vercel.app/update-password',
            },
        });

        if (error) throw error;
        if (!data.properties?.action_link) throw new Error('Failed to generate recovery link');

        const recoveryLink = data.properties.action_link;

        // 2. Configure Nodemailer (Gmail SMTP)
        const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
        const port = Number(process.env.SMTP_PORT) || 587;

        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 3. Send Email (Premium TRG Nexus Template)
        const primaryColor = '#0ea5e9'; // Sky 500
        const backgroundColor = '#020617'; // Slate 950
        const cardColor = '#0f172a'; // Slate 900
        const textColor = '#f8fafc'; // Slate 50
        const mutedColor = '#94a3b8'; // Slate 400

        const mailOptions = {
            from: `"TRG Nexus" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Redefinir sua Senha | TRG Nexus',
            text: `Olá,\n\nRecebemos uma solicitação para redefinir sua senha no TRG Nexus.\nUse o link a seguir para criar uma nova senha:\n${recoveryLink}\n\nSe não foi você, ignore este e-mail.`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha TRG Nexus</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: ${textColor};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        
                        <!-- Logo -->
                        <table role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td align="center" style="padding-bottom: 30px;">
                                    <!-- Simple CSS Logo Fallback/Representation -->
                                    <div style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: ${textColor};">
                                        TRG<span style="color: ${primaryColor};">Nexus</span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Main Card -->
                        <table role="presentation" width="100%" style="max-width: 600px; background-color: ${cardColor}; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td style="padding: 40px 40px;">
                                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: ${textColor}; text-align: center;">Recuperação de Senha</h1>
                                    
                                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1; text-align: center;">
                                        Recebemos uma solicitação para redefinir a senha da sua conta no <strong>TRG Nexus</strong>.
                                    </p>

                                    <div style="text-align: center; margin: 32px 0;">
                                        <a href="${recoveryLink}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; transition: background-color 0.2s;">
                                            Redefinir Minha Senha &rarr;
                                        </a>
                                    </div>

                                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${mutedColor}; text-align: center;">
                                        Se você não fez essa solicitação, pode ignorar este e-mail com segurança. Sua senha permanecerá inalterada.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer -->
                        <table role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td align="center" style="padding-top: 30px;">
                                    <p style="margin: 0 0 10px 0; font-size: 12px; color: ${mutedColor};">
                                        &copy; ${new Date().getFullYear()} TRG Nexus. Todos os direitos reservados.
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: ${mutedColor};">
                                        Transformando a gestão de terapeutas.
                                    </p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
        };

        await transporter.sendMail(mailOptions);

        console.log(`Password reset email sent to ${email}`);

        // Always return generic success for security (unless debugging)
        return res.status(200).json({ message: 'If email exists, recovery link sent.' });

    } catch (err: any) {
        console.error('Password Reset Error:', err);
        // In production, maybe don't return the exact error to client, but for now it helps debug
        // For debugging, return the actual error
        return res.status(500).json({ error: err.message || 'Failed to process request', details: JSON.stringify(err) });
    }
}
