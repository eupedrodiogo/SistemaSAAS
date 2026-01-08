import nodemailer from 'nodemailer';
import twilio from 'twilio';

interface BookingNotificationData {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    therapistName?: string;
    therapistEmail?: string | null;
    mainComplaint?: string;
    location?: string;
}

// Helper to generate iCal content
function generateIcsContent(data: BookingNotificationData): string {
    const { name, date, time, therapistName, location, mainComplaint } = data;

    // Attempt to parse date from DD/MM/YYYY or YYYY-MM-DD
    let year, month, day;
    if (date.includes('/')) {
        const parts = date.split('/');
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
    } else {
        const parts = date.split('-');
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
    }

    // Parse time HH:mm
    const timeParts = time.split(':');
    const hours = timeParts[0].padStart(2, '0');
    const mins = timeParts[1].padStart(2, '0');

    const startDateTime = `${year}${month}${day}T${hours}${mins}00`;

    // Calculate end time (assuming 60 mins session)
    const startDate = new Date(`${year}-${month}-${day}T${hours}:${mins}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMins = String(endDate.getMinutes()).padStart(2, '0');
    const endDateTime = `${endYear}${endMonth}${endDay}T${endHours}${endMins}00`;

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@trgnexus.com`;

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TRG Nexus//NONSGML v1.0//EN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDateTime}`,
        `DTEND:${endDateTime}`,
        `SUMMARY:Sessão TRG: ${name}`,
        `DESCRIPTION:Sessão de TRG agendada com ${name}.\\n\\nQueixa: ${mainComplaint || 'Não informada'}`,
        `LOCATION:${location || 'Sessão Online'}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Lembrete de Sessão TRG',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

export async function sendBookingNotification(data: BookingNotificationData) {
    console.log('Preparing to send notifications for:', data.email);
    let result = { status: 'pending', error: null, info: null };

    // 1. Email Notification - Setup Transporter
    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP credentials not found. Skipping email sending.');
            result.status = 'skipped_no_credentials';
        } else {
            const port = Number(process.env.SMTP_PORT) || 587;
            const host = (process.env.SMTP_HOST || '').trim();
            const user = (process.env.SMTP_USER || '').trim();
            const pass = (process.env.SMTP_PASS || '').trim();

            const transporter = nodemailer.createTransport({
                host: host,
                port: port,
                secure: port === 465, // True for 465, false for other ports
                auth: {
                    user: user,
                    pass: pass,
                },
            });

            // Send Client Email
            const mailOptions = {
                from: '"TRG Nexus" <noreply@trgnexus.com>',
                to: data.email,
                subject: 'Confirmação de Agendamento - TRG Nexus',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h2 style="color: #0f172a; margin: 0;">Agendamento Confirmado!</h2>
                        </div>
                        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                            <p>Olá, <strong>${data.name}</strong>,</p>
                            <p>Seu agendamento foi realizado com sucesso. Abaixo estão os detalhes da sua sessão:</p>
                            
                            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Data:</strong> ${data.date}</p>
                                <p style="margin: 5px 0;"><strong>Horário:</strong> ${data.time}</p>
                                <p style="margin: 5px 0;"><strong>Terapeuta:</strong> ${data.therapistName || 'TRG Nexus'}</p>
                            </div>

                            <h3>Informações Importantes</h3>
                            <ul>
                                <li><strong>Cancelamento:</strong> Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência. Cancelamentos tardios podem estar sujeitos a uma taxa de 50% do valor da sessão.</li>
                                <li><strong>Pontualidade:</strong> Recomendamos entrar na sala de espera virtual 5 minutos antes do horário agendado.</li>
                                <li><strong>Ambiente:</strong> Escolha um local tranquilo, privado e com boa conexão de internet.</li>
                            </ul>

                            <p style="margin-top: 30px;">Se tiver dúvidas, entre em contato conosco pelo WhatsApp.</p>
                            
                            <p style="font-size: 12px; color: #64748b; margin-top: 30px; text-align: center;">
                                © ${new Date().getFullYear()} TRG Nexus. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `
            };

            const clientInfo = await transporter.sendMail(mailOptions);
            console.log('Client Email sent:', clientInfo.messageId);
            result.status = 'sent';
            result.info = clientInfo as any;

            // Send Therapist Email (with iCal Invite)
            if (data.therapistEmail) {
                const icsContent = generateIcsContent(data);
                const therapistHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Novo Agendamento</title>
                    </head>
                    <body style="font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                            <div style="background-color: #3b82f6; padding: 24px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 22px;">📅 Novo Agendamento Recebido</h1>
                            </div>
                            <div style="padding: 32px;">
                                <p style="color: #334155; font-size: 16px;">Olá, <strong>${data.therapistName || 'Terapeuta'}</strong>!</p>
                                <p style="color: #334155;">Você tem um novo agendamento confirmado na sua agenda.</p>
                                
                                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
                                    <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${data.name}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Data:</strong> ${data.date}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Horário:</strong> ${data.time}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Telefone:</strong> ${data.phone}</p>
                                    <p style="margin: 0;"><strong>Queixa:</strong> ${data.mainComplaint || 'Não informada'}</p>
                                </div>

                                <p style="font-size: 14px; color: #64748b; font-style: italic; margin-top: 16px;">
                                    💡 Este evento foi sincronizado automaticamente com seu calendário (anexo .ics).
                                </p>

                                <div style="text-align: center; margin-top: 32px;">
                                    <a href="https://trg-nexus.vercel.app/dashboard" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                        Ver na Minha Agenda
                                    </a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await transporter.sendMail({
                    from: '"TRG Nexus System" <noreply@trgnexus.com>',
                    to: data.therapistEmail,
                    subject: `📅 Novo Agendamento: ${data.name}`,
                    html: therapistHtml,
                    icalEvent: {
                        filename: 'sessao-trg.ics',
                        method: 'REQUEST',
                        content: icsContent
                    }
                });
                console.log('Therapist email sent with iCal invite.');
            }
        }
    } catch (error: any) {
        console.error('Error sending email:', error);
        result.status = 'error';
        result.error = error.message || error;
    }

    // 2. WhatsApp Notification (Meta WhatsApp API)
    try {
        const { therapistPhone, name, date, time, therapistName, mainComplaint } = data as any;

        // A. Client Message
        if (data.phone) {
            // Template: notificacao_sessao_cliente
            // Components: {{1}} clientName, {{2}} therapistName, {{3}} date, {{4}} time
            await sendMetaWhatsApp(data.phone, 'notificacao_sessao_cliente', 'pt_BR', [
                {
                    type: 'body', parameters: [
                        { type: 'text', text: name },
                        { type: 'text', text: therapistName || 'Terapeuta TRG' },
                        { type: 'text', text: date },
                        { type: 'text', text: time }
                    ]
                }
            ]);
        }

        // B. Therapist Message
        if (therapistPhone) {
            // Template: confirmacao_agendamento
            // Components: {{1}} therapistName, {{2}} patientName, {{3}} date, {{4}} time
            // Note: Per manual.ts, valid template is 'confirmacao_agendamento' 
            // for "BOOKING_CONFIRMATION" which likely is reused here for the therapist notification.
            await sendMetaWhatsApp(therapistPhone, 'confirmacao_agendamento', 'pt_BR', [
                {
                    type: 'body', parameters: [
                        { type: 'text', text: therapistName || 'Terapeuta' },
                        { type: 'text', text: name },
                        { type: 'text', text: date },
                        { type: 'text', text: time }
                    ]
                }
            ]);
        }

        result.status = 'sent_meta_whatsapp';

    } catch (error: any) {
        console.error('Error sending WhatsApp (Meta):', error);
        result.status = 'error_meta';
        result.error = error;
    }
}

export async function sendBookingCancellation(data: { name: string, email: string, phone: string, date: string, time: string, therapistName?: string }) {
    console.log('[Notification] Sending Cancellation to:', data.email);

    // 1. WhatsApp Cancellation
    if (data.phone) {
        // Template: cancelamento_agendamento
        // Parameters: {{1}} recipientName, {{2}} date, {{3}} time
        await sendMetaWhatsApp(data.phone, 'cancelamento_agendamento', 'pt_BR', [
            {
                type: 'body', parameters: [
                    { type: 'text', text: data.name },
                    { type: 'text', text: data.date },
                    { type: 'text', text: data.time }
                ]
            }
        ]);
    }
    // TODO: Add Email Cancellation (Optional for now)
}

export async function sendSessionReminder(data: { name: string, phone: string, date: string, time: string }) {
    console.log('[Notification] Sending Reminder to:', data.name);

    if (data.phone) {
        // Template: lembrete_sessao_15min_v2
        // Parameters: {{1}} patientName
        await sendMetaWhatsApp(data.phone, 'lembrete_sessao_15min_v2', 'pt_BR', [
            {
                type: 'body', parameters: [
                    { type: 'text', text: data.name }
                ]
            }
        ]);
    }
}

export async function sendMetaWhatsApp(to: string, templateName: string, languageCode: string = 'pt_BR', components: any[] = []) {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    if (!token || !phoneId) {
        console.warn('Meta WhatsApp credentials missing.');
        return { success: false, error: 'missing_credentials' };
    }

    // Format phone: remove non-digits, ensure country code.
    // Meta requires plain numbers like "55219..." without +
    let cleanPhone = to.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

    // Payload for template
    const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
            components: components
        }
    };

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Meta WhatsApp Error:', JSON.stringify(data));
            return { success: false, error: data };
        }

        console.log(`Meta WhatsApp sent to ${cleanPhone}:`, data.messages?.[0]?.id);
        return { success: true, id: data.messages?.[0]?.id };

    } catch (error: any) {
        console.error('Meta WhatsApp Network Error:', error);
        return { success: false, error: error.message };
    }
}
