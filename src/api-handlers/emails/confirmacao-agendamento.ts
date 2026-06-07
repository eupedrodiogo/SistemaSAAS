import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// ─── Enviar Email via Resend (preferencial) ou SMTP (fallback) ────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
        const resend = new Resend(resendKey);
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const { error: sendError } = await resend.emails.send({
            from: `TRG Nexus <${fromAddress}>`,
            to: [to],
            subject,
            html,
        });
        if (!sendError) return;
        console.warn('Resend falhou, usando SMTP:', sendError.message);
    }

    // Fallback SMTP
    const port = Number(process.env.SMTP_PORT) || 587;
    const host = (process.env.SMTP_HOST || '').trim();
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').trim();

    if (!host || !smtpUser || !pass) {
        throw new Error('Serviço de e-mail não configurado (Resend + SMTP indisponíveis).');
    }

    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: smtpUser, pass } });
    await transporter.sendMail({ from: `"TRG Nexus" <${smtpUser}>`, to, subject, html });
}

// ─── Template do E-mail para o CLIENTE ────────────────────────────────────────
function buildClientEmail(patientName: string, therapistName: string, date: string, time: string): string {
    return `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:20px;background:#f8fafc;font-family:'Segoe UI',Tahoma,sans-serif;">
            <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#fff;">
                <div style="background:#0f172a;padding:32px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:24px;">TRG <span style="color:#3b82f6">Nexus</span></h1>
                </div>
                <div style="padding:40px 32px;color:#334155;line-height:1.6;">
                    <h2 style="color:#0f172a;margin-top:0;">✅ Agendamento Confirmado!</h2>
                    <p style="font-size:18px;">Olá, <strong>${patientName}</strong>!</p>
                    <p>Sua sessão com <strong>${therapistName}</strong> foi agendada com sucesso.</p>
                    <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin:24px 0;">
                        <p style="margin:0 0 8px 0;color:#64748b;font-size:12px;font-weight:bold;text-transform:uppercase;">Detalhes do Agendamento</p>
                        <p style="margin:4px 0;font-size:16px;font-weight:bold;color:#0f172a;">📅 ${date}</p>
                        <p style="margin:4px 0;font-size:16px;font-weight:bold;color:#0f172a;">🕐 ${time}</p>
                    </div>
                    <p>Se precisar remarcar ou cancelar, entre em contato com seu terapeuta.</p>
                    <p style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:20px;font-size:12px;color:#64748b;text-align:center;">
                        Enviado por TRG Nexus · Gestão Terapêutica
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ─── Template do E-mail para o TERAPEUTA ─────────────────────────────────────
function buildTherapistEmail(therapistName: string, patientName: string, patientEmail: string, patientPhone: string, date: string, time: string, type: string): string {
    const portalUrl = process.env.VITE_APP_URL || 'https://trg-nexus.vercel.app';
    return `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:20px;background:#f8fafc;font-family:'Segoe UI',Tahoma,sans-serif;">
            <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#fff;">
                <div style="background:#0f172a;padding:32px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:24px;">TRG <span style="color:#3b82f6">Nexus</span></h1>
                </div>
                <div style="padding:40px 32px;color:#334155;line-height:1.6;">
                    <h2 style="color:#0f172a;margin-top:0;">📅 Novo Agendamento na Sua Agenda</h2>
                    <p style="font-size:18px;">Olá, <strong>${therapistName}</strong>!</p>
                    <p>Um novo agendamento do tipo <strong>${type}</strong> foi criado na sua agenda.</p>
                    <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin:24px 0;">
                        <p style="margin:0 0 8px 0;color:#64748b;font-size:12px;font-weight:bold;text-transform:uppercase;">Detalhes</p>
                        <p style="margin:4px 0;"><strong>Paciente:</strong> ${patientName}</p>
                        ${patientEmail ? `<p style="margin:4px 0;"><strong>E-mail:</strong> ${patientEmail}</p>` : ''}
                        ${patientPhone ? `<p style="margin:4px 0;"><strong>Telefone:</strong> ${patientPhone}</p>` : ''}
                        <p style="margin:4px 0;"><strong>Data:</strong> ${date}</p>
                        <p style="margin:4px 0;"><strong>Horário:</strong> ${time}</p>
                    </div>
                    <div style="text-align:center;margin-top:24px;">
                        <a href="${portalUrl}/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
                            Ver Agenda
                        </a>
                    </div>
                    <p style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:20px;font-size:12px;color:#64748b;text-align:center;">
                        Enviado por TRG Nexus · Gestão Terapêutica
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ─── Handler Principal ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Autenticar via Supabase token
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const supabaseToken = (Array.isArray(authHeader) ? authHeader[0] : authHeader).split(' ')[1];
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL || '',
        process.env.VITE_SUPABASE_ANON_KEY || ''
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseToken);
    if (authError || !user) return res.status(401).json({ error: 'Token inválido ou expirado.' });

    try {
        const {
            patientName,
            patientEmail,
            patientPhone,
            therapistName,
            therapistEmail,
            date,   // formato: "03/06/2026"
            time,   // formato: "09:00"
            type,   // "Regular" | "Anjo"
        } = req.body;

        if (!patientName || !date || !time) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes: patientName, date, time.' });
        }

        const results: string[] = [];
        const errors: string[] = [];

        // 1. Enviar e-mail de confirmação para o CLIENTE (se tiver email)
        if (patientEmail) {
            try {
                await sendEmail(
                    patientEmail,
                    `✅ Agendamento Confirmado — ${date} às ${time}`,
                    buildClientEmail(patientName, therapistName || 'Seu Terapeuta', date, time)
                );
                results.push('Cliente ✓');
            } catch (e: any) {
                errors.push(`Cliente: ${e.message}`);
            }
        }

        // 2. Enviar e-mail de aviso para o TERAPEUTA (se tiver email)
        if (therapistEmail) {
            try {
                await sendEmail(
                    therapistEmail,
                    `📅 Novo Agendamento: ${patientName} — ${date} às ${time}`,
                    buildTherapistEmail(therapistName || 'Terapeuta', patientName, patientEmail || '', patientPhone || '', date, time, type || 'Regular')
                );
                results.push('Terapeuta ✓');
            } catch (e: any) {
                errors.push(`Terapeuta: ${e.message}`);
            }
        }

        return res.status(200).json({ results, errors });

    } catch (error: any) {
        console.error('Erro ao enviar e-mails de confirmação:', error);
        return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
}
