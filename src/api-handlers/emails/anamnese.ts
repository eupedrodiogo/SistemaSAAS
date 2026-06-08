import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Internal endpoint — auth via Supabase token
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const supabaseToken = (Array.isArray(authHeader) ? authHeader[0] : authHeader).split(' ')[1];
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseToken);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    try {
        const { email, patientName, therapistName, link, date, time } = req.body;

        if (!email || !patientName || !link) {
            return res.status(400).json({ error: 'Missing email, patientName or link' });
        }

        const primaryColor = '#0f172a';
        const accentColor = '#3b82f6';
        const subject = `${patientName}, sua ficha de consulta está pronta para preenchimento`;

        const html = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
                    <div style="background-color: ${primaryColor}; padding: 32px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Tera<span style="color: ${accentColor}">Nexus</span></h1>
                    </div>
                    <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
                        <h2 style="color: ${primaryColor}; margin-top: 0;">Agendamento Confirmado!</h2>
                        <p style="font-size: 18px;">Olá, <strong>${patientName}</strong>!</p>
                        <p>Seu terapeuta agendou sua sessão com sucesso.</p>
                        
                        ${date && time ? `
                        <div style="background-color: #f1f5f9; border-left: 4px solid ${accentColor}; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Data:</strong> ${date}</p>
                            <p style="margin: 5px 0;"><strong>Horário:</strong> ${time}</p>
                            <p style="margin: 5px 0;"><strong>Terapeuta:</strong> ${therapistName || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Seu Terapeuta'}</p>
                        </div>
                        ` : ''}

                        <p>${therapistName || user?.user_metadata?.name ? `O(a) terapeuta <strong>${therapistName || user?.user_metadata?.name}</strong> solicitou o preenchimento da sua ficha` : 'Solicitamos o preenchimento da sua ficha'} de anamnese antes da sua sessão.</p>
                        <p>Por favor, clique no botão abaixo para acessar a sua área do cliente</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${link}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Acessar Área do Cliente</a>
                        </div>
                        <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
                            Enviado por TeraNexus · Gestão Terapêutica
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const resendKey = process.env.RESEND_API_KEY;

        // --- Strategy 1: Try Resend (best deliverability) ---
        if (resendKey) {
            const resend = new Resend(resendKey);
            const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

            const { data, error: sendError } = await resend.emails.send({
                from: `TeraNexus <${fromAddress}>`,
                to: [email],
                subject: subject,
                html: html,
            });

            if (!sendError) {
                console.log('Email sent via Resend:', data?.id);
                return res.status(200).json({ message: 'Email sent via Resend', id: data?.id });
            }

            // If Resend fails due to domain restriction, fall through to SMTP
            console.warn('Resend failed, falling back to SMTP:', sendError.message);
        }

        // --- Strategy 2: Fallback to Gmail SMTP ---
        const port = Number(process.env.SMTP_PORT) || 587;
        const host = (process.env.SMTP_HOST || '').trim().replace(/\r?\n/g, '');
        const smtpUser = (process.env.SMTP_USER || '').trim().replace(/\r?\n/g, '');
        const pass = (process.env.SMTP_PASS || '').trim().replace(/\r?\n/g, '');

        if (!host || !smtpUser || !pass) {
            return res.status(500).json({ error: 'Email service not configured. Verify Resend domain or check SMTP settings.' });
        }

        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465,
            auth: { user: smtpUser, pass: pass },
        });

        await transporter.sendMail({
            from: `"TeraNexus - Gestão Terapêutica" <${smtpUser}>`,
            to: email,
            subject: subject,
            html: html,
        });

        console.log('Email sent via SMTP fallback');
        return res.status(200).json({ message: 'Email sent via SMTP' });

    } catch (error: any) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: error.message || 'Unknown server error' });
    }
}
