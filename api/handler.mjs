var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/api-handlers/notifications/templates.ts
var WHATSAPP_TEMPLATES, templates_default;
var init_templates = __esm({
  "src/api-handlers/notifications/templates.ts"() {
    WHATSAPP_TEMPLATES = {
      WELCOME: (userName) => ({
        name: "welcome_trg_nexus",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: userName }
            ]
          }
        ]
      }),
      HELLO_WORLD: {
        name: "hello_world",
        language: { code: "en_US" }
      },
      // Novos Templates (Aguardando Aprovação na Meta)
      BOOKING_CONFIRMATION: (therapistName, patientName, date, time) => ({
        name: "confirmacao_agendamento",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: therapistName },
              { type: "text", text: patientName },
              { type: "text", text: date },
              { type: "text", text: time }
            ]
          }
        ]
      }),
      BOOKING_CANCELLATION: (recipientName, date, time) => ({
        name: "cancelamento_agendamento",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: recipientName },
              { type: "text", text: date },
              { type: "text", text: time }
            ]
          }
        ]
      }),
      SESSION_REMINDER_15MIN: (patientName) => ({
        name: "lembrete_sessao_15min_v2",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName }
            ]
          }
        ]
      }),
      SESSION_NOTIFICATION_CLIENT: (clientName, therapistName, date, time) => ({
        name: "notificacao_sessao_cliente",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: clientName },
              { type: "text", text: therapistName },
              { type: "text", text: date },
              { type: "text", text: time }
            ]
          }
        ]
      })
    };
    templates_default = WHATSAPP_TEMPLATES;
  }
});

// src/api-handlers/utils/notifications.ts
var notifications_exports = {};
__export(notifications_exports, {
  sendBookingCancellation: () => sendBookingCancellation,
  sendBookingNotification: () => sendBookingNotification,
  sendMetaWhatsApp: () => sendMetaWhatsApp,
  sendSessionReminder: () => sendSessionReminder
});
import nodemailer from "nodemailer";
function generateIcsContent(data) {
  const { name, date, time, therapistName, location, mainComplaint } = data;
  let year, month, day;
  if (date.includes("/")) {
    const parts = date.split("/");
    day = parts[0].padStart(2, "0");
    month = parts[1].padStart(2, "0");
    year = parts[2];
  } else {
    const parts = date.split("-");
    year = parts[0];
    month = parts[1].padStart(2, "0");
    day = parts[2].padStart(2, "0");
  }
  const timeParts = time.split(":");
  const hours = timeParts[0].padStart(2, "0");
  const mins = timeParts[1].padStart(2, "0");
  const startDateTime = `${year}${month}${day}T${hours}${mins}00`;
  const startDate = /* @__PURE__ */ new Date(`${year}-${month}-${day}T${hours}:${mins}:00`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1e3);
  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");
  const endHours = String(endDate.getHours()).padStart(2, "0");
  const endMins = String(endDate.getMinutes()).padStart(2, "0");
  const endDateTime = `${endYear}${endMonth}${endDay}T${endHours}${endMins}00`;
  const now = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@trgnexus.com`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TRG Nexus//NONSGML v1.0//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:Sess\xE3o TRG: ${name}`,
    `DESCRIPTION:Sess\xE3o de TRG agendada com ${name}.\\n\\nQueixa: ${mainComplaint || "N\xE3o informada"}`,
    `LOCATION:${location || "Sess\xE3o Online"}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete de Sess\xE3o TRG",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
function formatDateToBr(dateStr) {
  if (!dateStr) return dateStr;
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}
async function sendBookingNotification(data) {
  console.log("Preparing to send notifications for:", data.email);
  data.date = formatDateToBr(data.date);
  let result = { status: "pending", error: null, info: null };
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not found. Skipping email sending.");
      result.status = "skipped_no_credentials";
    } else {
      const port = Number(process.env.SMTP_PORT) || 587;
      const host = (process.env.SMTP_HOST || "").trim();
      const user = (process.env.SMTP_USER || "").trim();
      const pass = (process.env.SMTP_PASS || "").trim();
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        // True for 465, false for other ports
        auth: {
          user,
          pass
        }
      });
      const mailOptions = {
        from: '"TRG Nexus" <noreply@trgnexus.com>',
        to: data.email,
        subject: "Confirma\xE7\xE3o de Agendamento - TRG Nexus",
        html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h2 style="color: #0f172a; margin: 0;">Agendamento Confirmado!</h2>
                        </div>
                        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                            <p>Ol\xE1, <strong>${data.name}</strong>,</p>
                            <p>Seu agendamento foi realizado com sucesso. Abaixo est\xE3o os detalhes da sua sess\xE3o:</p>
                            
                            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Data:</strong> ${data.date}</p>
                                <p style="margin: 5px 0;"><strong>Hor\xE1rio:</strong> ${data.time}</p>
                                <p style="margin: 5px 0;"><strong>Terapeuta:</strong> ${data.therapistName || "TRG Nexus"}</p>
                            </div>

                            <h3>Informa\xE7\xF5es Importantes</h3>
                            <ul>
                                <li><strong>Cancelamento:</strong> Cancelamentos devem ser feitos com pelo menos 24 horas de anteced\xEAncia. Cancelamentos tardios podem estar sujeitos a uma taxa de 50% do valor da sess\xE3o.</li>
                                <li><strong>Pontualidade:</strong> Recomendamos entrar na sala de espera virtual 5 minutos antes do hor\xE1rio agendado.</li>
                                <li><strong>Ambiente:</strong> Escolha um local tranquilo, privado e com boa conex\xE3o de internet.</li>
                            </ul>

                            <p style="margin-top: 30px;">Se tiver d\xFAvidas, entre em contato conosco pelo WhatsApp.</p>
                            
                            <p style="font-size: 12px; color: #64748b; margin-top: 30px; text-align: center;">
                                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} TRG Nexus. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `
      };
      const clientInfo = await transporter.sendMail(mailOptions);
      console.log("Client Email sent:", clientInfo.messageId);
      result.status = "sent";
      result.info = clientInfo;
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
                                <h1 style="color: #ffffff; margin: 0; font-size: 22px;">\u{1F4C5} Novo Agendamento Recebido</h1>
                            </div>
                            <div style="padding: 32px;">
                                <p style="color: #334155; font-size: 16px;">Ol\xE1, <strong>${data.therapistName || "Terapeuta"}</strong>!</p>
                                <p style="color: #334155;">Voc\xEA tem um novo agendamento confirmado na sua agenda.</p>
                                
                                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
                                    <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${data.name}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Data:</strong> ${data.date}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Hor\xE1rio:</strong> ${data.time}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Telefone:</strong> ${data.phone}</p>
                                    <p style="margin: 0;"><strong>Queixa:</strong> ${data.mainComplaint || "N\xE3o informada"}</p>
                                </div>

                                <p style="font-size: 14px; color: #64748b; font-style: italic; margin-top: 16px;">
                                    \u{1F4A1} Este evento foi sincronizado automaticamente com seu calend\xE1rio (anexo .ics).
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
          subject: `\u{1F4C5} Novo Agendamento: ${data.name}`,
          html: therapistHtml,
          icalEvent: {
            filename: "sessao-trg.ics",
            method: "REQUEST",
            content: icsContent
          }
        });
        console.log("Therapist email sent with iCal invite.");
      }
    }
  } catch (error) {
    console.error("Error sending email:", error);
    result.status = "error";
    result.error = error.message || error;
  }
  try {
    const { therapistPhone, name, date, time, therapistName, mainComplaint } = data;
    if (data.phone) {
      const template = WHATSAPP_TEMPLATES.SESSION_NOTIFICATION_CLIENT(
        name,
        therapistName || "Terapeuta TRG",
        date,
        time
      );
      await sendMetaWhatsApp(data.phone, template.name, template.language.code, template.components);
    }
    if (therapistPhone) {
      const template = WHATSAPP_TEMPLATES.BOOKING_CONFIRMATION(
        therapistName || "Terapeuta",
        name,
        date,
        time
      );
      await sendMetaWhatsApp(therapistPhone, template.name, template.language.code, template.components);
    }
    result.status = "sent_meta_whatsapp";
  } catch (error) {
    console.error("Error sending WhatsApp (Meta):", error);
    result.status = "error_meta";
    result.error = error;
  }
}
async function sendBookingCancellation(data) {
  console.log("[Notification] Sending Cancellation to:", data.email);
  if (data.phone) {
    const formattedDate = formatDateToBr(data.date);
    const template = WHATSAPP_TEMPLATES.BOOKING_CANCELLATION(data.name, formattedDate, data.time);
    await sendMetaWhatsApp(data.phone, template.name, template.language.code, template.components);
  }
}
async function sendSessionReminder(data) {
  console.log("[Notification] Sending Reminder to:", data.name);
  if (data.phone) {
    const template = WHATSAPP_TEMPLATES.SESSION_REMINDER_15MIN(data.name);
    await sendMetaWhatsApp(data.phone, template.name, template.language.code, template.components);
  }
}
async function sendMetaWhatsApp(to, templateName, languageCode = "pt_BR", components = []) {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_ID;
  if (!token || !phoneId) {
    console.warn("Meta WhatsApp credentials missing.");
    return { success: false, error: "missing_credentials" };
  }
  let cleanPhone = to.replace(/\D/g, "");
  if (!cleanPhone.startsWith("55") && cleanPhone.length <= 11) cleanPhone = "55" + cleanPhone;
  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components
    }
  };
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Meta WhatsApp Error:", JSON.stringify(data));
      return { success: false, error: data };
    }
    console.log(`Meta WhatsApp sent to ${cleanPhone}:`, data.messages?.[0]?.id);
    if (data.error) {
      console.error("Meta WhatsApp API Error Payload:", JSON.stringify(data));
      return { success: false, error: data.error };
    }
    return { success: true, id: data.messages?.[0]?.id };
  } catch (error) {
    console.error("Meta WhatsApp Network Error:", error);
    return { success: false, error: error.message };
  }
}
var init_notifications = __esm({
  "src/api-handlers/utils/notifications.ts"() {
    init_templates();
  }
});

// src/api-handlers/appointments.ts
import { createClient } from "@supabase/supabase-js";
async function verifyAuth(req, res) {
  const auth = req.headers["authorization"];
  if (!auth) {
    res.status(401).json({ message: "Token n\xE3o fornecido" });
    return null;
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(" ")[1];
  const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl11 || !supabaseKey) {
    console.error("Supabase Config Missing in verifyAuth");
    res.status(500).json({ message: "Server Configuration Error" });
    return null;
  }
  const supabase6 = createClient(supabaseUrl11, supabaseKey);
  const { data: { user }, error } = await supabase6.auth.getUser(token);
  if (error || !user) {
    console.warn("Auth Failed:", error?.message);
    res.status(403).json({ message: "Token inv\xE1lido ou expirado" });
    return null;
  }
  return { id: user.id, email: user.email || "" };
}
async function handler(req, res) {
  const user = await verifyAuth(req, res);
  if (!user) return;
  const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl11 || !supabaseKey) {
    return res.status(500).json({ error: "Database configuration missing" });
  }
  const supabase6 = createClient(supabaseUrl11, supabaseKey);
  const { id } = req.query;
  try {
    if (id) {
      const appointmentId = Array.isArray(id) ? id[0] : id;
      if (req.method === "GET") {
        const { data, error } = await supabase6.from("appointments").select("*, patients(name, email, phone)").eq("id", appointmentId).eq("therapist_id", user.id).single();
        if (error || !data) {
          return res.status(404).json({ error: "Appointment not found" });
        }
        const formatted = {
          id: data.id,
          patientId: data.patient_id,
          patientName: data.patients?.name || "Desconhecido",
          date: data.date,
          time: data.time,
          status: data.status,
          type: data.type,
          notes: data.notes,
          sessionData: data.session_data || {}
        };
        return res.status(200).json(formatted);
      }
      if (req.method === "PUT") {
        const { date, time, status, type, notes, sessionData } = req.body;
        let dbStatus = status;
        if (status === "Agendado") dbStatus = "scheduled";
        if (status === "Conclu\xEDdo") dbStatus = "completed";
        if (status === "Cancelado") dbStatus = "cancelled";
        let shouldNotify = dbStatus === "cancelled" || status === "Cancelado";
        let existingAppointment = null;
        if (shouldNotify) {
          const { data: existing } = await supabase6.from("appointments").select("*, patients(name, email, phone), therapists(id, name)").eq("id", appointmentId).single();
          existingAppointment = existing;
        }
        const updatePayload = {
          date,
          time,
          status: dbStatus,
          type,
          notes
        };
        if (sessionData !== void 0) {
          updatePayload.session_data = sessionData;
        }
        const { data, error } = await supabase6.from("appointments").update(updatePayload).eq("id", appointmentId).eq("therapist_id", user.id).select().single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Appointment not found or unauthorized" });
        if (shouldNotify && existingAppointment && existingAppointment.patients) {
          try {
            const { sendBookingCancellation: sendBookingCancellation2 } = await Promise.resolve().then(() => (init_notifications(), notifications_exports));
            const p = existingAppointment.patients;
            const t = existingAppointment.therapists || {};
            let dateStr = existingAppointment.date;
            const [y, m, d] = dateStr.split("-");
            const formattedDate = `${d}/${m}/${y}`;
            await sendBookingCancellation2({
              name: p.name,
              email: p.email,
              phone: p.phone,
              date: formattedDate,
              time: existingAppointment.time,
              therapistName: t.name || "Terapeuta"
            });
          } catch (notifyErr) {
            console.error("Notification Error:", notifyErr);
          }
        }
        return res.status(200).json(data);
      } else if (req.method === "DELETE") {
        const { error } = await supabase6.from("appointments").delete().eq("id", appointmentId).eq("therapist_id", user.id);
        if (error) throw error;
        return res.status(200).json({ message: "Deleted successfully" });
      } else if (req.method === "GET") {
        const { data, error } = await supabase6.from("appointments").select("*, patients(name, email, phone)").eq("id", appointmentId).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Appointment not found" });
        const formatted = {
          id: data.id.toString(),
          patientId: data.patient_id.toString(),
          patientName: data.patients?.name || "Desconhecido",
          date: data.date,
          time: data.time,
          status: data.status,
          type: data.type,
          notes: data.notes,
          sessionData: data.session_data || {}
        };
        return res.status(200).json(formatted);
      } else {
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    } else {
      if (req.method === "GET") {
        const { data, error } = await supabase6.from("appointments").select("*, patients(name)").eq("therapist_id", user.id).order("date", { ascending: true }).order("time", { ascending: true });
        if (error) throw error;
        const formatted = (data || []).map((row) => {
          let dateStr = row.date;
          return {
            id: row.id.toString(),
            patientId: row.patient_id.toString(),
            patientName: row.patients?.name || "Desconhecido",
            date: dateStr,
            time: row.time,
            status: row.status,
            type: row.type,
            notes: row.notes,
            sessionData: row.session_data || {}
          };
        });
        return res.status(200).json(formatted);
      } else if (req.method === "POST") {
        const { patientId, date, time, status, type, notes, sessionData } = req.body;
        let dbStatus = status;
        if (status === "Agendado") dbStatus = "scheduled";
        const { data, error } = await supabase6.from("appointments").insert([{
          patient_id: patientId,
          date,
          time,
          status: dbStatus,
          type,
          notes,
          session_data: sessionData || {},
          therapist_id: user.id
        }]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      } else {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    console.error("Appointments API Error:", error);
    res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/availability.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler2(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Server Misconfiguration", details: "Missing keys" });
  }
  const { date, therapistId } = req.query;
  if (!date) {
    return res.status(400).json({ error: "Missing date parameter" });
  }
  const supabase6 = createClient2(supabaseUrl, supabaseServiceKey);
  try {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    let startHour = 8;
    let endHour = 18;
    let isActive = true;
    if (therapistId) {
      const { data: settings } = await supabase6.from("availability_settings").select("start_time, end_time, is_active").eq("therapist_id", therapistId).eq("day_of_week", dayOfWeek).single();
      if (settings) {
        isActive = settings.is_active;
        startHour = parseInt(settings.start_time.split(":")[0]);
        endHour = parseInt(settings.end_time.split(":")[0]);
      }
    }
    if (!isActive) {
      return res.status(200).json({ slots: [] });
    }
    const allSlots = [];
    for (let h = startHour; h < endHour; h++) {
      allSlots.push(`${h.toString().padStart(2, "0")}:00`);
    }
    let query = supabase6.from("appointments").select("time").eq("date", date).neq("status", "Cancelado");
    if (therapistId) {
      query = query.eq("therapist_id", therapistId);
    }
    const { data: appointments, error: appError } = await query;
    if (appError) throw appError;
    const occupiedSlots = new Set(appointments?.map((a) => a.time.substring(0, 5)) || []);
    const slots = allSlots.map((time) => ({
      id: time,
      time,
      available: !occupiedSlots.has(time)
    }));
    return res.status(200).json({ slots });
  } catch (error) {
    console.error("Availability Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/blocked-slots.ts
import pg from "pg";
import { createClient as createClient3 } from "@supabase/supabase-js";
async function handler3(req, res) {
  const auth = req.headers["authorization"];
  if (!auth) {
    return res.status(401).json({ error: "Token n\xE3o fornecido" });
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(" ")[1];
  const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl11 || !supabaseKey) {
    return res.status(500).json({ error: "Configura\xE7\xE3o de Auth ausente no servidor" });
  }
  const supabase6 = createClient3(supabaseUrl11, supabaseKey);
  const { data: { user }, error: authError } = await supabase6.auth.getUser(token);
  if (authError || !user) {
    return res.status(403).json({ error: "Token inv\xE1lido ou expirado" });
  }
  const { Pool: Pool7 } = pg;
  const { id } = req.query;
  const connectionString4 = process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace("?sslmode=require", "?") : void 0;
  if (!connectionString4) {
    return res.status(500).json({ error: "Database configuration missing" });
  }
  const pool5 = new Pool7({
    connectionString: connectionString4,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5e3
  });
  const client = await pool5.connect();
  try {
    if (req.method === "GET") {
      const { rows } = await client.query(
        'SELECT id, day_of_week as "dayOfWeek", date, start_time as "startTime", end_time as "endTime", label FROM blocked_slots WHERE therapist_id = $1',
        [user.id]
      );
      return res.status(200).json(rows);
    } else if (req.method === "POST") {
      const { dayOfWeek, date, startTime, endTime, label } = req.body;
      if (dayOfWeek === void 0 && !date || !startTime || !endTime) {
        return res.status(400).json({ error: "Missing required fields (dayOfWeek or date)" });
      }
      const { rows } = await client.query(
        `INSERT INTO blocked_slots (therapist_id, day_of_week, date, start_time, end_time, label)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, day_of_week as "dayOfWeek", date, start_time as "startTime", end_time as "endTime", label`,
        [user.id, dayOfWeek ?? null, date ?? null, startTime, endTime, label || ""]
      );
      return res.status(201).json(rows[0]);
    } else if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ error: "Missing ID" });
      const { rowCount } = await client.query(
        "DELETE FROM blocked_slots WHERE id = $1 AND therapist_id = $2",
        [id, user.id]
      );
      if (rowCount === 0) return res.status(404).json({ error: "Slot not found or unauthorized" });
      return res.status(200).json({ message: "Deleted successfully" });
    } else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Blocked Slots API Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
    await pool5.end();
  }
}

// src/api-handlers/booking.ts
import { createClient as createClient4 } from "@supabase/supabase-js";
var supabaseUrl2 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler4(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!supabaseUrl2 || !supabaseServiceKey2) {
    return res.status(500).json({ error: "Server Misconfiguration" });
  }
  const supabase6 = createClient4(supabaseUrl2, supabaseServiceKey2);
  const { name, email, phone, date, time, therapistId, status = "scheduled", price, ...restData } = req.body || {};
  const anamnesisData = {
    ...restData,
    transtornos: restData.transtornos || [],
    doresFisicas: restData.doresFisicas || [],
    temasFuturo: restData.temasFuturo || []
  };
  if (!name || !email || !date || !time || !therapistId) {
    return res.status(400).json({ error: "Missing required fields: name, email, date, time, or therapistId" });
  }
  try {
    console.log(`[Booking] Processing for ${email} with ${therapistId || "System"} (Status: ${status})`);
    let therapistName = "Terapeuta TRG";
    if (therapistId) {
      const { data: t } = await supabase6.from("therapists").select("name").eq("id", therapistId).single();
      if (t) therapistName = t.name;
    }
    let patientId;
    const { data: existing } = await supabase6.from("patients").select("id").eq("email", email).eq("therapist_id", therapistId).limit(1);
    if (existing && existing.length > 0) {
      patientId = existing[0].id;
      await supabase6.from("patients").update({ name, phone }).eq("id", patientId);
    } else {
      const { data: newP, error: pError } = await supabase6.from("patients").insert({
        name,
        email,
        phone,
        therapist_id: therapistId,
        status: "active",
        notes: `Queixa: ${anamnesisData.complaint || anamnesisData.queixaPrincipal || "N\xE3o informado"} | Transtornos: ${(anamnesisData.transtornos || []).map((t) => `${t.name} (${t.level})`).join(", ")}`
      }).select("id").single();
      if (pError) throw pError;
      patientId = newP.id;
    }
    const appointmentQuery = supabase6.from("appointments").insert({
      patient_id: patientId,
      therapist_id: therapistId,
      date,
      time,
      status,
      type: "Primeira Consulta",
      notes: JSON.stringify(anamnesisData),
      session_data: { price: price || 0 }
      // Save price here
    }).select("id");
    const { data: rows, error: aError } = await appointmentQuery;
    if (aError) throw aError;
    if (status === "scheduled") {
      console.log("[Booking] Starting notifications...");
      const { data: therapistData } = await supabase6.from("therapists").select("email, name, phone").eq("id", therapistId).single();
      const notificationData = {
        name,
        email,
        phone,
        date,
        time,
        therapistName: therapistData?.name || "Terapeuta TRG",
        therapistEmail: therapistData?.email,
        therapistPhone: therapistData?.phone,
        // Add phone for WhatsApp
        mainComplaint: anamnesisData.complaint || anamnesisData.queixaPrincipal,
        location: "Sess\xE3o Online"
      };
      try {
        const { sendBookingNotification: sendBookingNotification2 } = await Promise.resolve().then(() => (init_notifications(), notifications_exports));
        await sendBookingNotification2(notificationData);
      } catch (nError) {
        console.error("[Booking] Notification Error:", nError);
      }
      console.log("[Booking] Notifications processed.");
    } else {
      console.log(`[Booking] Status is ${status}, skipping notifications.`);
    }
    return res.status(200).json({ message: "Booking processed", patientId, appointmentId: rows && rows[0] ? rows[0].id : void 0 });
  } catch (error) {
    console.error("[Booking] Fatal Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/client-portal.ts
import { createClient as createClient5 } from "@supabase/supabase-js";
var supabaseUrl3 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey3 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler5(req, res) {
  if (!supabaseUrl3 || !supabaseServiceKey3) {
    return res.status(500).json({ error: "Server Misconfiguration" });
  }
  const supabase6 = createClient5(supabaseUrl3, supabaseServiceKey3);
  const { action, patientId } = req.query;
  try {
    if (req.method === "POST" && action === "login") {
      const { email, password } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });
      const { data: patients, error } = await supabase6.from("patients").select("id, name, email, password_hash").eq("email", email.toLowerCase());
      if (error) throw error;
      if (patients && patients.length > 0) {
        const patient = patients[0];
        if (patient.password_hash) {
          if (!password) {
            return res.status(401).json({ error: "Sua conta requer uma senha.", requiresPassword: true });
          }
          const crypto2 = await import("crypto");
          const hashedPassword = crypto2.createHash("sha256").update(password + process.env.STRIPE_SECRET_KEY).digest("hex");
          if (hashedPassword !== patient.password_hash) {
            return res.status(401).json({ error: "Senha incorreta." });
          }
        }
        return res.status(200).json({
          patientId: patient.id,
          name: patient.name,
          email: patient.email
        });
      } else {
        return res.status(404).json({ error: "E-mail n\xE3o encontrado. Verifique se voc\xEA j\xE1 agendou uma sess\xE3o." });
      }
    }
    if (req.method === "GET" && action === "data") {
      if (!patientId) return res.status(400).json({ error: "Patient ID required" });
      const { data: patient, error: pError } = await supabase6.from("patients").select("*, therapists(name)").eq("id", patientId).single();
      if (pError) return res.status(404).json({ error: "Patient not found" });
      const patientData = {
        ...patient,
        therapist_name: patient.therapists?.name
      };
      const { data: appointments, error: aError } = await supabase6.from("appointments").select("*").eq("patient_id", patientId).order("date", { ascending: false }).order("time", { ascending: false });
      if (aError) throw aError;
      return res.status(200).json({
        patient: patientData,
        appointments: appointments || []
      });
    }
    if (req.method === "GET" && action === "recordings") {
      if (!patientId) return res.status(400).json({ error: "Patient ID required" });
      const { data: recordings, error: rError } = await supabase6.from("recordings").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
      if (rError) throw rError;
      return res.status(200).json(recordings || []);
    }
    return res.status(400).json({ error: "Invalid action or method" });
  } catch (error) {
    console.error("Client Portal API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/dashboard.ts
import { createClient as createClient6 } from "@supabase/supabase-js";
import * as jwt from "jsonwebtoken";
var getSecret = () => process.env.SECRET_KEY || "change-this-secret-in-prod";
function verifyAuth2(req, res) {
  const auth = req.headers["authorization"];
  if (!auth) {
    res.status(401).json({ message: "Token n\xE3o fornecido" });
    return null;
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(" ")[1];
  try {
    const decoded = jwt.verify(token, getSecret());
    return decoded;
  } catch {
    res.status(403).json({ message: "Token inv\xE1lido" });
    return null;
  }
}
var supabaseUrl4 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey4 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler6(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseUrl4 || !supabaseServiceKey4) {
    return res.status(500).json({ error: "Server Misconfiguration", details: "Missing keys" });
  }
  const user = verifyAuth2(req, res);
  if (!user) return;
  const therapistId = user.id;
  const supabase6 = createClient6(supabaseUrl4, supabaseServiceKey4);
  try {
    const { count: totalPatients, error: pError } = await supabase6.from("patients").select("*", { count: "exact", head: true }).eq("therapist_id", therapistId);
    if (pError) throw pError;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { count: sessionsToday, error: sError } = await supabase6.from("appointments").select("*", { count: "exact", head: true }).eq("therapist_id", therapistId).eq("date", today);
    if (sError) throw sError;
    const { data: allAppointments, error: allAppError } = await supabase6.from("appointments").select("date").eq("therapist_id", therapistId);
    if (allAppError) throw allAppError;
    const totalSessions = allAppointments?.length || 0;
    const revenueMonth = totalSessions * 250;
    const weeklyActivityMap = /* @__PURE__ */ new Map();
    const now = /* @__PURE__ */ new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      if (!weeklyActivityMap.has(dayName)) {
        weeklyActivityMap.set(dayName, 0);
      }
    }
    const sevenDaysAgo = /* @__PURE__ */ new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    allAppointments?.forEach((app) => {
      const appDate = new Date(app.date);
      if (appDate >= sevenDaysAgo && appDate <= now) {
        const dayName = appDate.toLocaleDateString("en-US", { weekday: "short" });
        if (weeklyActivityMap.has(dayName)) {
          weeklyActivityMap.set(dayName, (weeklyActivityMap.get(dayName) || 0) + 1);
        }
      }
    });
    const weeklyActivity = Array.from(weeklyActivityMap.entries()).map(([day, sessions]) => ({
      day,
      sessions,
      revenue: sessions * 250
    }));
    res.status(200).json({
      stats: {
        patients: totalPatients || 0,
        sessionsToday: sessionsToday || 0,
        revenue: revenueMonth,
        productivity: (totalPatients || 0) > 0 ? 95 : 0
      },
      weeklyActivity
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/feedback.ts
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
async function handler7(req, res) {
  const connectionString4 = process.env.POSTGRES_URL;
  if (!connectionString4) {
    return res.status(500).json({ error: "Database configuration missing (POSTGRES_URL)" });
  }
  const pool5 = new Pool({
    connectionString: connectionString4,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5e3
  });
  const client = await pool5.connect();
  try {
    if (req.method === "POST") {
      const { therapistId, patientId, userType, rating, category, comment, metadata } = req.body;
      if (!userType || !rating) {
        return res.status(400).json({ error: "Missing required fields: userType, rating" });
      }
      const { rows } = await client.query(
        `INSERT INTO feedbacks (therapist_id, patient_id, user_type, rating, category, comment, metadata) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [therapistId || null, patientId || null, userType, rating, category, comment, JSON.stringify(metadata || {})]
      );
      return res.status(201).json(rows[0]);
    } else if (req.method === "GET") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    } else {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Feedback API Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
    await pool5.end();
  }
}

// src/api-handlers/financials.ts
import pg2 from "pg";

// src/api-handlers/utils/auth.ts
import * as jwt2 from "jsonwebtoken";
var getSecret2 = () => process.env.SECRET_KEY || "change-this-secret-in-prod";
function verifyAuth3(req, res) {
  const auth = req.headers["authorization"];
  if (!auth) {
    res.status(401).json({ message: "Token n\xE3o fornecido" });
    return null;
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(" ")[1];
  try {
    const decoded = jwt2.verify(token, getSecret2());
    return decoded;
  } catch {
    res.status(403).json({ message: "Token inv\xE1lido" });
    return null;
  }
}

// src/api-handlers/financials.ts
async function handler8(req, res) {
  const user = verifyAuth3(req, res);
  if (!user) return;
  const { Pool: Pool7 } = pg2;
  const therapistId = user.id;
  const connectionString4 = process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace("?sslmode=require", "?") : void 0;
  if (!connectionString4) {
    return res.status(500).json({ error: "Database configuration missing" });
  }
  const pool5 = new Pool7({
    connectionString: connectionString4,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5e3
  });
  const client = await pool5.connect();
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (!therapistId) {
      return res.status(400).json({ error: "Missing therapistId" });
    }
    const appointmentsRes = await client.query(
      `SELECT a.*, p.name as patient_name 
             FROM appointments a
             LEFT JOIN patients p ON a.patient_id = p.id
             WHERE a.therapist_id = $1
             ORDER BY a.date DESC`,
      [therapistId]
    );
    const PRICE_PER_SESSION = 250;
    const transactions = appointmentsRes.rows.map((apt) => ({
      id: apt.id,
      type: "income",
      description: `Sess\xE3o - ${apt.patient_name}`,
      category: "Sess\xE3o TRG",
      date: apt.date instanceof Date ? apt.date.toISOString().split("T")[0] : apt.date,
      amount: PRICE_PER_SESSION,
      status: apt.status === "Conclu\xEDda" ? "Pago" : "Pendente"
    }));
    const monthlyDataMap = /* @__PURE__ */ new Map();
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    appointmentsRes.rows.forEach((apt) => {
      const date = new Date(apt.date);
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];
      if (!monthlyDataMap.has(monthName)) {
        monthlyDataMap.set(monthName, { receita: 0, despesas: 0 });
      }
      const current = monthlyDataMap.get(monthName);
      current.receita += PRICE_PER_SESSION;
    });
    const currentMonthIndex = (/* @__PURE__ */ new Date()).getMonth();
    const monthlyData = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      const m = months[i];
      monthlyData.push({
        name: m,
        receita: monthlyDataMap.get(m)?.receita || 0,
        despesas: 0
        // No expense tracking yet
      });
    }
    const totalRevenue = transactions.filter((t) => t.type === "income" && t.status === "Pago").reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    const pendingAmount = transactions.filter((t) => t.type === "income" && t.status === "Pendente").reduce((acc, t) => acc + t.amount, 0);
    const balance = totalRevenue - totalExpenses;
    res.status(200).json({
      transactions,
      monthlyData,
      summary: {
        balance,
        totalRevenue,
        totalExpenses,
        pendingAmount
      }
    });
  } catch (error) {
    console.error("Financials API Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
    await pool5.end();
  }
}

// src/api-handlers/fix-booking.ts
init_notifications();
import { createClient as createClient7 } from "@supabase/supabase-js";
var supabaseUrl5 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey5 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = createClient7(supabaseUrl5, supabaseServiceKey5);
async function handler9(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email parameter is required" });
  }
  try {
    console.log(`[Fix] Searching for pending booking for email: ${email}`);
    const { data: patients, error: pError } = await supabase.from("patients").select("id, name, email, phone").eq("email", email).limit(1);
    if (pError || !patients || patients.length === 0) {
      return res.status(404).json({ error: "Patient not found", details: pError });
    }
    const patient = patients[0];
    console.log(`[Fix] Found Patient: ${patient.name} (${patient.id})`);
    const { data: appointments, error: aError } = await supabase.from("appointments").select(`
                id, date, time, 
                status,
                therapists (name, email, phone)
            `).eq("patient_id", patient.id).eq("status", "pending_payment").order("created_at", { ascending: false }).limit(1);
    if (aError || !appointments || appointments.length === 0) {
      const { data: scheduled } = await supabase.from("appointments").select("id, status").eq("patient_id", patient.id).eq("status", "scheduled").limit(1);
      if (scheduled && scheduled.length > 0) {
        return res.json({ message: "Appointment is already SCHEDULED.", id: scheduled[0].id });
      }
      return res.status(404).json({ error: "No PENDING_PAYMENT appointment found for this patient." });
    }
    const appointment = appointments[0];
    console.log(`[Fix] Found Appointment ${appointment.id} with status ${appointment.status}`);
    const { error: uError } = await supabase.from("appointments").update({ status: "scheduled" }).eq("id", appointment.id);
    if (uError) {
      return res.status(500).json({ error: "Failed to update status", details: uError });
    }
    console.log("[Fix] Sending Notification...");
    await sendBookingNotification({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      date: appointment.date,
      time: appointment.time,
      therapistName: appointment.therapists?.name || "Terapeuta TRG",
      therapistEmail: appointment.therapists?.email,
      therapistPhone: appointment.therapists?.phone
    });
    return res.json({
      success: true,
      message: "Appointment fixed and notifications sent.",
      appointmentId: appointment.id,
      patient: patient.name
    });
  } catch (error) {
    console.error("[Fix] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/manual-confirm.ts
init_notifications();
import Stripe from "stripe";
import { createClient as createClient8 } from "@supabase/supabase-js";
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia"
});
var supabase2 = createClient8(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function handler10(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { paymentIntentId, appointmentId } = req.body;
  if (!paymentIntentId || !appointmentId) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not successful yet" });
    }
    const { error: updateError } = await supabase2.from("appointments").update({ status: "scheduled" }).eq("id", appointmentId);
    if (updateError) {
      console.error("DB Update Error:", updateError);
      throw updateError;
    }
    const { data: appt, error: fetchError } = await supabase2.from("appointments").select(`
                date, time,
                patients (name, email, phone, notes),
                therapists (name, email, phone)
            `).eq("id", appointmentId).single();
    if (appt && appt.patients && appt.therapists) {
      const patient = appt.patients;
      const therapist = appt.therapists;
      console.log(`[Manual Confirm] Sending WhatsApp to ${patient.name}`);
      await sendBookingNotification({
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        date: appt.date,
        time: appt.time,
        therapistName: therapist.name,
        therapistEmail: therapist.email,
        therapistPhone: therapist.phone
      });
      return res.status(200).json({
        success: true,
        message: "Booking confirmed and notification sent"
      });
    } else {
      console.warn("Could not fetch appointment details:", fetchError);
      return res.status(200).json({
        success: true,
        warning: "Booking confirmed but notification details fetch failed"
      });
    }
  } catch (err) {
    console.error("[Manual Confirm Error]", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
}

// src/api-handlers/notifications.ts
import pg3 from "pg";
async function handler11(req, res) {
  const { Pool: Pool7 } = pg3;
  const connectionString4 = process.env.trgnexus_POSTGRES_URL || process.env.POSTGRES_URL;
  if (!connectionString4) {
    return res.status(500).json({ error: "Database connection string missing" });
  }
  const pool5 = new Pool7({
    connectionString: connectionString4.replace("?sslmode=require", "?"),
    ssl: { rejectUnauthorized: false }
  });
  const client = await pool5.connect();
  try {
    if (req.method === "GET") {
      const { role, userId } = req.query;
      if (!role || !userId) {
        return res.status(400).json({ error: "Missing role or userId" });
      }
      const result = await client.query(
        `SELECT * FROM notifications 
                 WHERE recipient_role = $1 AND recipient_id = $2 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
        [role, userId]
      );
      const notifications = result.rows.map((n) => ({
        ...n,
        time: new Date(n.created_at).toLocaleString("pt-BR")
        // Frontend can reformat this
      }));
      return res.status(200).json({ notifications });
    }
    if (req.method === "PUT") {
      const { action, id, role, userId } = req.body;
      if (action === "markAsRead" && id) {
        await client.query(
          "UPDATE notifications SET read = true WHERE id = $1",
          [id]
        );
        return res.status(200).json({ success: true });
      }
      if (action === "markAllAsRead" && role && userId) {
        await client.query(
          "UPDATE notifications SET read = true WHERE recipient_role = $1 AND recipient_id = $2",
          [role, userId]
        );
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: "Invalid action" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
    await pool5.end();
  }
}

// src/api-handlers/patient-details.ts
import { createClient as createClient9 } from "@supabase/supabase-js";
import * as jwt3 from "jsonwebtoken";
var getSecret3 = () => process.env.SECRET_KEY || "change-this-secret-in-prod";
function verifyAuth4(req, res) {
  const auth = req.headers["authorization"];
  if (!auth) {
    res.status(401).json({ message: "Token n\xE3o fornecido" });
    return null;
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(" ")[1];
  try {
    const decoded = jwt3.verify(token, getSecret3());
    return decoded;
  } catch {
    res.status(403).json({ message: "Token inv\xE1lido" });
    return null;
  }
}
async function handler12(req, res) {
  const user = verifyAuth4(req, res);
  if (!user) return;
  const { patientId } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: "Missing patientId" });
  }
  if (patientId === "demo") {
    return res.status(200).json({
      timeline: [
        { id: "demo1", type: "session", date: (/* @__PURE__ */ new Date()).toISOString(), title: "Sess\xE3o - TRG", desc: "Status: Conclu\xEDda. Evolu\xE7\xE3o positiva.", status: "Conclu\xEDda" }
      ],
      financial: {
        totalInvested: 1e3,
        pending: 0,
        history: []
      },
      documents: []
    });
  }
  const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl11 || !supabaseKey) {
    return res.status(500).json({ error: "Database configuration missing" });
  }
  const supabase6 = createClient9(supabaseUrl11, supabaseKey);
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const pId = Array.isArray(patientId) ? patientId[0] : patientId;
    const { data: patient, error: pError } = await supabase6.from("patients").select("id").eq("id", pId).eq("therapist_id", user.id).single();
    if (pError || !patient) {
      return res.status(403).json({ error: "Unauthorized access or patient not found" });
    }
    const { data: appointments, error: aError } = await supabase6.from("appointments").select("*").eq("patient_id", pId).eq("therapist_id", user.id).order("date", { ascending: false });
    if (aError) throw aError;
    const timeline = appointments.map((apt) => ({
      id: apt.id,
      type: "session",
      date: apt.date + "T" + apt.time,
      // Construct roughly if stored separately
      title: `Sess\xE3o - ${apt.type}`,
      desc: `Status: ${apt.status}. ${apt.session_data?.notes || ""}`,
      status: apt.status
    }));
    const PRICE_PER_SESSION = 250;
    const completedAppointments = appointments.filter((a) => a.status === "Conclu\xEDda" || a.status === "completed");
    const pendingAppointments = appointments.filter((a) => a.status === "Agendado" || a.status === "scheduled" || a.status === "pending_payment");
    const totalInvested = completedAppointments.length * PRICE_PER_SESSION;
    const pending = pendingAppointments.length * PRICE_PER_SESSION;
    const financialHistory = appointments.map((apt) => ({
      id: apt.id,
      date: apt.date,
      desc: `Sess\xE3o ${apt.type}`,
      value: PRICE_PER_SESSION,
      status: apt.status === "Conclu\xEDda" || apt.status === "completed" ? "Pago" : "Pendente"
    }));
    const documents = [];
    res.status(200).json({
      timeline,
      financial: {
        totalInvested,
        pending,
        history: financialHistory
      },
      documents
    });
  } catch (error) {
    console.error("Patient Details API Error:", error);
    res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/patients.ts
import { createClient as createClient10 } from "@supabase/supabase-js";
import * as jwt4 from "jsonwebtoken";
var getSecret4 = () => process.env.SECRET_KEY || "change-this-secret-in-prod";
function verifyAuth5(req, res) {
  const auth = req.headers["authorization"];
  if (!auth) {
    res.status(401).json({ message: "Token n\xE3o fornecido" });
    return null;
  }
  const token = (Array.isArray(auth) ? auth[0] : auth).split(" ")[1];
  try {
    const decoded = jwt4.verify(token, getSecret4());
    return decoded;
  } catch {
    res.status(403).json({ message: "Token inv\xE1lido" });
    return null;
  }
}
async function handler13(req, res) {
  const user = verifyAuth5(req, res);
  if (!user) return;
  console.log("Requesting Patients via Supabase Client...");
  const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl11 || !supabaseKey) {
    return res.status(500).json({ error: "Database configuration missing" });
  }
  const supabase6 = createClient10(supabaseUrl11, supabaseKey);
  const { id } = req.query;
  try {
    if (id) {
      const patientId = Array.isArray(id) ? id[0] : id;
      if (req.method === "PUT") {
        const { name, email, phone, status, notes } = req.body;
        const { data, error } = await supabase6.from("patients").update({ name, email, phone, status, notes }).eq("id", patientId).eq("therapist_id", user.id).select().single();
        if (error || !data) return res.status(404).json({ error: "Patient not found or unauthorized" });
        return res.status(200).json(data);
      } else if (req.method === "DELETE") {
        const { error } = await supabase6.from("patients").delete().eq("id", patientId).eq("therapist_id", user.id);
        if (error) throw error;
        return res.status(200).json({ message: "Deleted successfully" });
      } else {
        res.setHeader("Allow", ["PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    } else {
      if (req.method === "GET") {
        const { data, error } = await supabase6.from("patients").select("*, appointments(status)").eq("therapist_id", user.id).order("created_at", { ascending: false });
        if (error) throw error;
        const enrichedData = data.map((p) => {
          const completedApts = p.appointments?.filter((a) => a.status === "Conclu\xEDda" || a.status === "completed").length || 0;
          const { appointments, ...patientData } = p;
          return {
            ...patientData,
            totalInvested: completedApts * 250
          };
        });
        return res.status(200).json(enrichedData);
      } else if (req.method === "POST") {
        const { name, email, phone, status, notes } = req.body;
        const { data, error } = await supabase6.from("patients").insert([{
          name,
          email,
          phone,
          status,
          notes,
          therapist_id: user.id
        }]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      } else {
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    console.error("Patients API Error:", error);
    res.status(500).json({
      error: error.message,
      details: error.toString()
    });
  }
}

// src/api-handlers/payments.ts
import Stripe2 from "stripe";
var getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
  }
  return new Stripe2(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia"
  });
};
async function handler14(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { action } = req.query;
  try {
    const stripe3 = getStripe();
    if (action === "checkout") {
      const { priceId, amount, productName, successUrl, cancelUrl, mode = "payment", couponId } = req.body;
      let lineItem;
      if (amount) {
        lineItem = {
          price_data: {
            currency: "brl",
            product_data: {
              name: productName || "Sess\xE3o de Terapia"
            },
            unit_amount: Math.round(Number(amount))
            // Ensure integer cents
          },
          quantity: 1
        };
      } else {
        lineItem = {
          price: priceId,
          quantity: 1
        };
      }
      const sessionParams = {
        payment_method_types: ["card", "pix"],
        line_items: [lineItem],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
          metadata: req.body.metadata
          // Pass metadata to PaymentIntent
        },
        metadata: req.body.metadata
        // Also pass to Session for easy access
      };
      if (couponId) {
        sessionParams.discounts = [{ coupon: couponId }];
      }
      const session = await stripe3.checkout.sessions.create(sessionParams);
      return res.status(200).json({ id: session.id, url: session.url });
    } else if (action === "intent") {
      const { amount, currency, metadata } = req.body;
      const paymentIntent = await stripe3.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: { enabled: true }
      });
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } else if (action === "check") {
      return res.status(200).json({ status: "ok", message: "Stripe Configured Correctly" });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    console.error("Stripe Error:", err);
    return res.status(500).json({ statusCode: 500, message: err.message || "Internal Server Error" });
  }
}

// src/api-handlers/recordings.ts
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
async function handler15(req, res) {
  const user = verifyAuth3(req, res);
  if (!user) return;
  const { method } = req;
  try {
    if (method === "GET") {
      const { patientId } = req.query;
      if (!patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      const { rows: patientCheck } = await sql`
                SELECT id FROM patients WHERE id = ${patientId} AND therapist_id = ${user.id}
            `;
      if (patientCheck.length === 0) {
        return res.status(403).json({ error: "Unauthorized access to this patient" });
      }
      const { rows } = await sql`
                SELECT * FROM recordings 
                WHERE patient_id = ${patientId} 
                ORDER BY created_at DESC
            `;
      return res.status(200).json(rows);
    } else if (method === "POST") {
      const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
      const filename = searchParams.get("filename") || "recording.webm";
      const patientId = searchParams.get("patientId");
      const duration = searchParams.get("duration");
      const size = searchParams.get("size");
      const phase = searchParams.get("phase");
      if (!patientId) return res.status(400).json({ error: "Patient ID required" });
      const { rows: patientCheck } = await sql`
                SELECT id FROM patients WHERE id = ${patientId} AND therapist_id = ${user.id}
            `;
      if (patientCheck.length === 0) {
        return res.status(403).json({ error: "Unauthorized access to this patient" });
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not defined");
      }
      const blob = await put(filename, req, {
        access: "public"
      });
      await sql`
                INSERT INTO recordings (patient_id, url, filename, size, duration, phase, type)
                VALUES (${patientId}, ${blob.url}, ${filename}, ${size}, ${duration}, ${phase}, 'video')
            `;
      return res.status(200).json(blob);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Recordings API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/reports.ts
import pg4 from "pg";
var { Pool: Pool2 } = pg4;
var connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
var pool = new Pool2({
  connectionString: connectionString ? connectionString.replace("?sslmode=require", "") : void 0,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5e3
});
async function handler16(req, res) {
  const user = verifyAuth3(req, res);
  if (!user) return;
  const client = await pool.connect();
  try {
    if (req.method === "GET") {
      const { patientId } = req.query;
      let query = `
                SELECT r.*, p.name as patient_name 
                FROM reports r
                LEFT JOIN patients p ON r.patient_id = p.id
                WHERE r.therapist_id = $1
            `;
      const params = [user.id];
      if (patientId) {
        query += ` AND r.patient_id = $2`;
        params.push(patientId);
      }
      query += ` ORDER BY r.created_at DESC`;
      const result = await client.query(query, params);
      return res.status(200).json(result.rows);
    }
    if (req.method === "POST") {
      const { patientId, title, type, content, metadata } = req.body;
      if (!patientId || !title || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const query = `
                INSERT INTO reports (therapist_id, patient_id, title, type, content, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
      const result = await client.query(query, [
        user.id,
        // Force ID from token
        patientId,
        title,
        type || "evolution",
        content,
        metadata || {}
      ]);
      return res.status(201).json(result.rows[0]);
    }
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Missing report ID" });
      }
      const { rowCount } = await client.query("DELETE FROM reports WHERE id = $1 AND therapist_id = $2", [id, user.id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: "Report not found or unauthorized" });
      }
      return res.status(200).json({ success: true });
    }
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Reports API Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

// src/api-handlers/setup_sud.ts
import pg5 from "pg";
var { Pool: Pool3 } = pg5;
var connectionString2 = process.env.POSTGRES_URL || process.env.DATABASE_URL;
var pool2 = new Pool3({
  connectionString: connectionString2 ? connectionString2.replace("?sslmode=require", "") : void 0,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5e3
});
async function handler17(req, res) {
  const client = await pool2.connect();
  try {
    await client.query(`
            CREATE TABLE IF NOT EXISTS sud_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                therapist_id UUID NOT NULL,
                patient_id UUID NOT NULL,
                score INTEGER NOT NULL,
                date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    await client.query(`
            CREATE INDEX IF NOT EXISTS idx_sud_records_patient ON sud_records(patient_id);
        `);
    return res.status(200).json({ success: true, message: "Table sud_records created successfully." });
  } catch (error) {
    console.error("Setup Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

// src/api-handlers/sud.ts
import pg6 from "pg";
var { Pool: Pool4 } = pg6;
var connectionString3 = process.env.POSTGRES_URL || process.env.DATABASE_URL;
var pool3 = new Pool4({
  connectionString: connectionString3 ? connectionString3.replace("?sslmode=require", "") : void 0,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5e3
});
async function handler18(req, res) {
  const client = await pool3.connect();
  try {
    if (req.method === "GET") {
      const { patientId } = req.query;
      if (!patientId) {
        return res.status(400).json({ error: "Missing patientId" });
      }
      const result = await client.query(
        "SELECT * FROM sud_records WHERE patient_id = $1 ORDER BY date ASC",
        [patientId]
      );
      return res.status(200).json(result.rows);
    }
    if (req.method === "POST") {
      const { therapistId, patientId, score, notes, date } = req.body;
      if (!therapistId || !patientId || score === void 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const result = await client.query(
        `INSERT INTO sud_records (therapist_id, patient_id, score, notes, date)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
        [therapistId, patientId, score, notes || "", date || (/* @__PURE__ */ new Date()).toISOString()]
      );
      return res.status(201).json(result.rows[0]);
    }
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Missing record ID" });
      }
      await client.query("DELETE FROM sud_records WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("SUD API Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

// src/api-handlers/test-whatsapp.ts
init_notifications();
init_templates();
async function handler19(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { phone, type = "test" } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Missing phone number" });
  }
  try {
    let result;
    if (type === "test") {
      const template = WHATSAPP_TEMPLATES.HELLO_WORLD;
      result = await sendMetaWhatsApp(phone, template.name, template.language.code);
    } else if (type === "welcome") {
      const template = WHATSAPP_TEMPLATES.WELCOME("Teste de Sistema");
      result = await sendMetaWhatsApp(phone, template.name, template.language.code, template.components);
    } else if (type === "booking") {
      const template = WHATSAPP_TEMPLATES.BOOKING_CONFIRMATION(
        "Teapeuta Teste",
        "Paciente Teste",
        "01/01/2026",
        "10:00"
      );
      result = await sendMetaWhatsApp(phone, template.name, template.language.code, template.components);
    } else {
      return res.status(400).json({ error: 'Invalid test type. Use "test" (hello_world), "welcome", or "booking".' });
    }
    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: "Meta API Error",
        details: result.error
      });
    }
    return res.status(200).json({
      success: true,
      data: result,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Handler Error:", error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}

// src/api-handlers/webhook.ts
init_notifications();
import Stripe3 from "stripe";
import { createClient as createClient11 } from "@supabase/supabase-js";
var stripe2 = new Stripe3(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia"
});
var endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
var supabaseUrl6 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey6 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase3 = createClient11(supabaseUrl6, supabaseServiceKey6);
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
async function handler20(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    if (!endpointSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
    const rawBody = await buffer(req);
    event = stripe2.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`[Webhook Error] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log(`[Webhook] Received event type: ${event.type}`);
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { appointmentId } = paymentIntent.metadata;
    console.log(`[Webhook] Payment succeeded for Appointment ${appointmentId}`);
    if (appointmentId) {
      const { error: updateError } = await supabase3.from("appointments").update({ status: "scheduled" }).eq("id", appointmentId);
      if (updateError) {
        console.error("[Webhook] Failed to update appointment:", updateError);
        return res.status(500).json({ error: "Database Update Failed" });
      }
      console.log(`[Webhook] Appointment ${appointmentId} updated to 'scheduled'`);
      const { data: appt, error: fetchError } = await supabase3.from("appointments").select(`
                    date, time,
                    patients (name, email, phone, notes),
                    therapists (name, email, phone)
                `).eq("id", appointmentId).single();
      if (appt) {
        const patient = appt.patients;
        const therapist = appt.therapists;
        console.log(`[Webhook] Preparing notifications for ${patient?.name}`);
        await sendBookingNotification({
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          date: appt.date,
          time: appt.time,
          therapistName: therapist.name,
          therapistEmail: therapist.email,
          therapistPhone: therapist.phone
        });
        console.log("[Webhook] Notifications Sent Successfully");
      } else {
        console.error("[Webhook] Could not fetch appointment details for notification. Fetch Error:", fetchError);
      }
    } else {
      console.warn("[Webhook] No appointmentId found in PaymentIntent metadata.");
    }
  }
  res.json({ received: true });
}

// src/api-handlers/ai/chat.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
var genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
var model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
var SYSTEM_PROMPT = `
Voc\xEA \xE9 o Nexus Copilot, um assistente especializado na Terapia de Reprocessamento Generativo (TRG).
Seu objetivo \xE9 auxiliar terapeutas com d\xFAvidas sobre o protocolo, marketing para psic\xF3logos e gest\xE3o de consult\xF3rio.

Contexto de Conhecimento TRG:
1. M\xE9todos: Cronol\xF3gico (linha do tempo, traumas passados), Som\xE1tico (dores f\xEDsicas e sensa\xE7\xF5es), Tem\xE1tico (fobias e medos espec\xEDficos), Potencializa\xE7\xE3o (recursos positivos).
2. Escala SUD: 0 a 10 (n\xEDvel de desconforto). O objetivo \xE9 sempre zerar a SUD.
3. Seguran\xE7a: Nunca sugira diagn\xF3sticos m\xE9dicos. Foque no reprocessamento emocional.

Diretrizes:
- Responda de forma direta e profissional, mas acolhedora.
- Se a pergunta for sobre funcionalidades do sistema "TRG Nexus", explique como usar (Dashboard, Agenda, Prontu\xE1rio).
- Se a pergunta for cl\xEDnica, sugira a aplica\xE7\xE3o do m\xE9todo TRG adequado.

Sempre responda em Portugu\xEAs do Brasil.
`;
async function handler21(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const user = verifyAuth3(req, res);
  if (!user) return;
  try {
    const { messages, context } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Servidor n\xE3o configurado com chave de IA (GEMINI_API_KEY missing).");
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inv\xE1lidas." });
    }
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.text) return res.status(400).json({ error: "Mensagem vazia." });
    let prompt = `${SYSTEM_PROMPT}

Contexto Atual da Tela: ${context || "Dashboard"}

Hist\xF3rico da Conversa:
`;
    messages.slice(-6).forEach((msg) => {
      prompt += `${msg.role === "user" ? "Terapeuta" : "Nexus AI"}: ${msg.text}
`;
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ error: error.message || "Erro interno na IA." });
  }
}

// src/api-handlers/ai/optimize.ts
import { GoogleGenerativeAI as GoogleGenerativeAI2 } from "@google/generative-ai";
async function handler22(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = verifyAuth3(req, res);
  if (!user) return;
  try {
    const { appointments, dateRange, blockedTimes } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Configura\xE7\xE3o de API ausente" });
    }
    const genAI2 = new GoogleGenerativeAI2(apiKey);
    const model2 = genAI2.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
            Voc\xEA \xE9 um assistente de produtividade cl\xEDnica para terapeutas TRG.
            Analise a seguinte lista de agendamentos e hor\xE1rios bloqueados para o per\xEDodo: ${dateRange}.
            
            Dados de Entrada:
            1. Agendamentos (JSON):
            ${JSON.stringify(appointments)}

            2. Hor\xE1rios Bloqueados (JSON) - Respeite RIGOROSAMENTE estes bloqueios:
            ${JSON.stringify(blockedTimes || [])}

            OBJETIVO: Otimizar a agenda para aumentar a produtividade e eliminar "buracos" (janelas ociosas) desnecess\xE1rios.
            
            REGRAS DE OURO:
            - N\xC3O sugira hor\xE1rios que conflitem com "Hor\xE1rios Bloqueados".
            - Tente agrupar atendimentos sequencialmente (ex: 09:00, 10:00, 11:00) para evitar janelas de 30min ou 1h soltas no meio do dia.
            - Considere a dura\xE7\xE3o padr\xE3o de atendimento como 1 hora, salvo se o agendamento indicar outro intervalo.
            - Se um dia estiver muito vazio, sugira mover pacientes isolados para dias mais cheios (compacta\xE7\xE3o semanal), se fizer sentido.
            
            Retorne APENAS um JSON com o seguinte formato, id\xEAntico a este exemplo, sem markdown:
            {
                "analysis": "Texto explicativo sobre a efici\xEAncia atual e o que foi melhorado.",
                "suggestions": [
                    {
                        "originalAppointmentId": "id_original",
                        "patientName": "Nome do Paciente",
                        "currentDate": "YYYY-MM-DD",
                        "currentTime": "HH:MM",
                        "suggestedDate": "YYYY-MM-DD",
                        "suggestedTime": "HH:MM",
                        "reason": "Explica\xE7\xE3o clara do porqu\xEA (ex: 'Move para logo ap\xF3s o paciente X para fechar janela')"
                    }
                ],
                "savings": "Estimativa de tempo ganho (ex: '3 horas de janelas eliminadas')"
            }
        `;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonResponse = JSON.parse(text);
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("AI Optimize Error:", error);
    return res.status(500).json({
      error: "Erro na otimiza\xE7\xE3o da agenda",
      details: error.message
    });
  }
}

// src/api-handlers/ai/report.ts
import { GoogleGenerativeAI as GoogleGenerativeAI3 } from "@google/generative-ai";
var REPORT_PROMPTS = {
  "evolution": `
      Crie um Relat\xF3rio de Evolu\xE7\xE3o Cl\xEDnica formal.
      Use uma linguagem t\xE9cnica, objetiva e profissional (padr\xE3o CFP/Psicologia).
      Estrutura:
      1. Identifica\xE7\xE3o (Nome do Paciente).
      2. Resumo da Demanda Inicial.
      3. Processo Terap\xEAutico (Foque na evolu\xE7\xE3o na escala SUD e m\xE9todos TRG aplicados).
      4. Estado Atual e Progn\xF3stico.
    `,
  "laudo": `
      Elabore um Laudo T\xE9cnico Psicol\xF3gico.
      Linguagem extremamente formal e jur\xEDdica se necess\xE1rio.
      Estrutura:
      1. Cabe\xE7alho T\xE9cnico.
      2. An\xE1lise da Demanda.
      3. Procedimentos T\xE9cnicos Adotados (TRG - Terapia de Reprocessamento Generativo).
      4. An\xE1lise e Conclus\xE3o.
    `,
  "atestado": `
      Gere um Atestado Psicol\xF3gico formal.
      Deve conter:
      1. T\xEDtulo: ATESTADO PSICOL\xD3GICO
      2. Texto padr\xE3o atestando que o paciente encontra-se em acompanhamento psicoterap\xEAutico.
      3. Espa\xE7o para data e local.
      4. Espa\xE7o para assinatura do terapeuta (CRP).
      Se houver CID ou detalhes cl\xEDnicos, inclua apenas se mencionado nas notas.
    `,
  "encaminhamento": `
      Gere uma Carta de Encaminhamento.
      Estrutura:
      1. A quem possa interessar / Ao Dr(a). [Especialidade].
      2. Identifica\xE7\xE3o do Paciente.
      3. Motivo do Encaminhamento (baseado nas notas cl\xEDnicas).
      4. Breve resumo do quadro atual.
      5. Solicita\xE7\xE3o de avalia\xE7\xE3o/conduta.
    `
};
async function handler23(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = verifyAuth3(req, res);
  if (!user) return;
  try {
    const { patientName, reportType, clinicalNotes, metadata } = req.body;
    const templateType = reportType;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      console.error("SERVER ERROR: GEMINI_API_KEY is missing or empty.");
      return res.status(500).json({
        error: "Configura\xE7\xE3o de API ausente",
        details: "A chave da API Gemini n\xE3o foi configurada no servidor Vercel (Vari\xE1vel vazia ou indefinida)."
      });
    }
    const genAI2 = new GoogleGenerativeAI3(apiKey);
    const model2 = genAI2.getGenerativeModel({ model: "gemini-2.0-flash" });
    const templatePrompt = REPORT_PROMPTS[templateType] || REPORT_PROMPTS["evolution"];
    const prompt = `
      ${templatePrompt}

      DADOS DO PACIENTE:
      Nome: ${patientName}
      
      NOTAS CL\xCDNICAS (Rascunho do Terapeuta):
      ${clinicalNotes}

      METADADOS DA SESS\xC3O:
      Fase Atual: ${metadata?.phase || "N/A"}
      Dura\xE7\xE3o: ${metadata?.duration || "N/A"}
      SINTOMAS: ${metadata?.symptoms || "N/A"}
      
      Instru\xE7\xE3o Final: Responda apenas com o texto do relat\xF3rio, formatado em Markdown.
    `;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return res.status(200).json({ report: text });
  } catch (error) {
    console.error("AI Report Error:", error);
    return res.status(500).json({
      error: "Erro na gera\xE7\xE3o do relat\xF3rio",
      details: error.message
    });
  }
}

// src/api-handlers/auth/login.ts
import { createClient as createClient12 } from "@supabase/supabase-js";
import dotenv2 from "dotenv";
import path2 from "path";
import * as jwt5 from "jsonwebtoken";
dotenv2.config({ path: path2.resolve(process.cwd(), ".env.local") });
var getSecret5 = () => process.env.SECRET_KEY || "change-this-secret-in-prod";
function signToken(payload) {
  return jwt5.sign(payload, getSecret5(), { expiresIn: "8h" });
}
async function handler24(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl11 || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }
    const supabase6 = createClient12(supabaseUrl11, supabaseKey);
    const { data: authData, error: authError } = await supabase6.auth.signInWithPassword({
      email,
      password
    });
    if (authError || !authData.user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { data: therapist, error: dbError } = await supabase6.from("therapists").select("*").eq("email", email).single();
    const therapistId = therapist?.id || authData.user.id;
    const token = signToken({
      id: therapistId,
      email: email.toLowerCase()
    });
    return res.status(200).json({
      token,
      // Custom JWT
      supabaseToken: authData.session.access_token,
      // Keep for potential frontend usage
      user: authData.user,
      therapist: therapist || {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// src/api-handlers/auth/register-complete.ts
import { createClient as createClient13 } from "@supabase/supabase-js";
import nodemailer2 from "nodemailer";
import twilio from "twilio";
async function sendMetaWhatsAppInlined(to, templateName, languageCode, components = []) {
  try {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;
    if (!token || !phoneId) return { success: false, error: "missing_credentials" };
    let cleanPhone = to.replace(/\D/g, "");
    if (!cleanPhone.startsWith("55") && cleanPhone.length <= 11) cleanPhone = "55" + cleanPhone;
    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    };
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Meta API Error:", errData);
      return { success: false, error: errData };
    }
    return { success: true };
  } catch (e) {
    console.error("Local Meta Send Error:", e);
    return { success: false, error: e };
  }
}
var getEmailTemplate = (plan, name) => {
  const primaryColor = "#0f172a";
  const accentColor = "#3b82f6";
  const footerColor = "#64748b";
  const loginUrl = `${process.env.VITE_APP_URL || "https://trg-nexus-saas.vercel.app"}/login`;
  let title, subject, content;
  switch (plan) {
    case "price_1SZgFjKPo7EypB7V8hI35TpO":
    case "price_1Sd8DXKPo7EypB7VZwytTUEP":
    case "profissional":
    case "pro":
      subject = "Elite TRG: Bem-vindo ao Nexus Profissional \u{1F48E}";
      title = "Alta Performance Ativada";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Voc\xEA acaba de entrar para o grupo dos terapeutas que levam a gest\xE3o a s\xE9rio. O <strong>Plano Profissional</strong> \xE9 a nossa experi\xEAncia completa.</p>
                <p>Sua conta foi criada com sucesso. Use seu email e senha para acessar.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 24px;">Fazer Login no Painel</a>
                </div>
            `;
      break;
    default:
      subject = "Bem-vindo ao TRG Nexus! \u{1F680}";
      title = "Seu acesso chegou";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Seu cadastro foi realizado com sucesso.</p>
                <p>Use seu email e senha cadastrados para acessar o sistema.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 24px;">Acessar Sistema</a>
                </div>
            `;
  }
  return {
    subject,
    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: ${primaryColor}; padding: 32px; text-align: center;">
                    <h1 style="color: white; margin: 0;">TRG <span style="color: ${accentColor}">Nexus</span></h1>
                </div>
                <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
                    <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
                    ${content}
                    <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: ${footerColor}; text-align: center;">
                        Enviado por TRG Nexus.<br>Se voc\xEA n\xE3o solicitou, ignore este email.
                    </p>
                </div>
            </div>
        `
  };
};
async function handler25(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email, name, phone, password, plan } = req.body;
  if (!email || !name || !phone || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const supabaseUrl11 = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl11 || !supabaseKey) {
      throw new Error("Supabase Configuration missing in environment variables");
    }
    const supabaseAdmin2 = createClient13(supabaseUrl11, supabaseKey);
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55") && formattedPhone.length <= 11) {
      formattedPhone = "55" + formattedPhone;
    }
    const finalPhone = "+" + formattedPhone;
    if (["pedrodiogo.suporte@gmail.com", "resignificamulher@gmail.com", "pedrodiogo.mello@gmail.com"].includes(email)) {
      console.log(`[Force Reset] Checking existence for test user: ${email}`);
      const { data: users, error: listError } = await supabaseAdmin2.auth.admin.listUsers();
      if (!listError && users.users) {
        const target = users.users.find((u) => u.email === email);
        if (target) {
          console.log(`[Force Reset] Deleting test user ${target.id}`);
          await supabaseAdmin2.auth.admin.deleteUser(target.id);
        }
      }
    }
    const mapPriceToPlan = (priceId) => {
      const planMap = {
        // Current Stripe Price IDs
        "price_1ScuH5KPo7EypB7VQ7epTjiW": "trial",
        // Estágio R$0.50
        "price_1ScuH5KPo7EypB7VnIs6qfbQ": "iniciante",
        // Iniciante R$47
        "price_1Sd8DXKPo7EypB7VZwytTUEP": "profissional",
        // Profissional R$97
        // Legacy values
        "free": "iniciante",
        "pro": "profissional",
        "enterprise": "clinica",
        // Direct plan names
        "trial": "trial",
        "iniciante": "iniciante",
        "profissional": "profissional",
        "clinica": "clinica"
      };
      return planMap[priceId] || planMap[priceId?.toLowerCase()] || "trial";
    };
    const normalizedPlan = mapPriceToPlan(plan || "trial");
    const { data: user, error: createError } = await supabaseAdmin2.auth.admin.createUser({
      email,
      phone: finalPhone,
      password,
      user_metadata: { name, phone: finalPhone, plan: normalizedPlan },
      email_confirm: true,
      phone_confirm: true
    });
    if (createError) {
      console.error("Supabase createUser Error:", createError);
      throw createError;
    }
    console.log("User created successfully:", user.user.id);
    console.log("Starting parallel notifications...");
    const notificationPromises = [];
    const port = Number(process.env.SMTP_PORT) || 587;
    const host = (process.env.SMTP_HOST || "").trim();
    const smtpUser = (process.env.SMTP_USER || "").trim();
    const smtpPass = (process.env.SMTP_PASS || "").trim();
    if (host && smtpUser && smtpPass) {
      notificationPromises.push((async () => {
        try {
          const transporter = nodemailer2.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user: smtpUser, pass: smtpPass }
          });
          const { subject, html } = getEmailTemplate(plan || "pro", name);
          await transporter.sendMail({
            from: `"TRG Nexus" <${process.env.SMTP_USER}>`,
            to: email,
            subject,
            html
          });
          console.log("Email sent successfully");
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
        }
      })());
    }
    notificationPromises.push((async () => {
      try {
        if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_ID) {
          console.log("Sending WhatsApp via Meta Cloud API...");
          const components = [{
            type: "body",
            parameters: [{ type: "text", text: name }]
          }];
          const { success, error } = await sendMetaWhatsAppInlined(finalPhone, "welcome_trg_nexus", "pt_BR", components);
          if (!success) console.error("Meta Send Failed:", error);
          else console.log("Meta WhatsApp sent successfully");
        } else {
          const twilioSid = process.env.TWILIO_ACCOUNT_SID;
          const twilioToken = process.env.TWILIO_AUTH_TOKEN;
          const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
          if (twilioSid && twilioToken && twilioFrom) {
            const client = twilio(twilioSid, twilioToken);
            const templateSid = process.env.TWILIO_TEMPLATE_SID;
            if (templateSid) {
              console.log("Sending WhatsApp using Twilio Template:", templateSid);
              await client.messages.create({
                from: twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`,
                to: `whatsapp:${finalPhone}`,
                contentSid: templateSid,
                contentVariables: JSON.stringify({
                  "1": name,
                  "2": "https://trg-nexus-saas.vercel.app/login"
                })
              });
            } else {
              await client.messages.create({
                from: twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`,
                to: `whatsapp:${finalPhone}`,
                body: `\u{1F31F} *Bem-vindo(a) ao TRG Nexus!*

Ol\xE1 ${name}, seu cadastro foi realizado com sucesso! \u{1F680}

Acesse https://trg-nexus-saas.vercel.app/login e use seu email e senha para entrar.

_Equipe TRG Nexus_`
              });
            }
          }
        }
      } catch (waError) {
        console.error("WhatsApp failed:", waError);
      }
    })());
    await Promise.allSettled(notificationPromises);
    console.log("Notifications processed.");
    return res.status(200).json({ success: true, message: "Registration complete" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/auth/request-password-reset.ts
import { createClient as createClient14 } from "@supabase/supabase-js";
import nodemailer3 from "nodemailer";
var supabaseAdmin = createClient14(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
async function handler26(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email, redirectUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectUrl || "https://trgnexus.vercel.app/update-password"
      }
    });
    if (error) throw error;
    if (!data.properties?.action_link) throw new Error("Failed to generate recovery link");
    const recoveryLink = data.properties.action_link;
    const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer3.createTransport({
      host,
      port,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    const primaryColor = "#0ea5e9";
    const backgroundColor = "#020617";
    const cardColor = "#0f172a";
    const textColor = "#f8fafc";
    const mutedColor = "#94a3b8";
    const mailOptions = {
      from: `"TRG Nexus" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Redefinir sua Senha | TRG Nexus",
      text: `Ol\xE1,

Recebemos uma solicita\xE7\xE3o para redefinir sua senha no TRG Nexus.
Use o link a seguir para criar uma nova senha:
${recoveryLink}

Se n\xE3o foi voc\xEA, ignore este e-mail.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recupera\xE7\xE3o de Senha TRG Nexus</title>
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
                                    <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: ${textColor}; text-align: center;">Recupera\xE7\xE3o de Senha</h1>
                                    
                                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1; text-align: center;">
                                        Recebemos uma solicita\xE7\xE3o para redefinir a senha da sua conta no <strong>TRG Nexus</strong>.
                                    </p>

                                    <div style="text-align: center; margin: 32px 0;">
                                        <a href="${recoveryLink}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; transition: background-color 0.2s;">
                                            Redefinir Minha Senha &rarr;
                                        </a>
                                    </div>

                                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${mutedColor}; text-align: center;">
                                        Se voc\xEA n\xE3o fez essa solicita\xE7\xE3o, pode ignorar este e-mail com seguran\xE7a. Sua senha permanecer\xE1 inalterada.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer -->
                        <table role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td align="center" style="padding-top: 30px;">
                                    <p style="margin: 0 0 10px 0; font-size: 12px; color: ${mutedColor};">
                                        &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} TRG Nexus. Todos os direitos reservados.
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: ${mutedColor};">
                                        Transformando a gest\xE3o de terapeutas.
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
    return res.status(200).json({ message: "If email exists, recovery link sent." });
  } catch (err) {
    console.error("Password Reset Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process request", details: JSON.stringify(err) });
  }
}

// src/api-handlers/client-auth/register.ts
import { Pool as Pool5 } from "pg";
import crypto from "crypto";
var pool4 = new Pool5({ connectionString: process.env.POSTGRES_URL });
var hashPassword = (password) => {
  return crypto.createHash("sha256").update(password + process.env.STRIPE_SECRET_KEY).digest("hex");
};
async function handler27(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, password, patientId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha s\xE3o obrigat\xF3rios." });
    }
    const hashedPassword = hashPassword(password);
    const existingPatient = await pool4.query(
      "SELECT id, email FROM patients WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existingPatient.rows.length > 0) {
      const patient = existingPatient.rows[0];
      await pool4.query(
        "UPDATE patients SET password_hash = $1 WHERE id = $2",
        [hashedPassword, patient.id]
      );
      return res.status(200).json({
        success: true,
        patientId: patient.id,
        message: "Senha configurada com sucesso."
      });
    }
    if (patientId) {
      await pool4.query(
        "UPDATE patients SET password_hash = $1, email = $2 WHERE id = $3",
        [hashedPassword, email.toLowerCase(), patientId]
      );
      return res.status(200).json({
        success: true,
        patientId,
        message: "Conta criada com sucesso."
      });
    }
    return res.status(404).json({ error: "Paciente n\xE3o encontrado. Complete o agendamento primeiro." });
  } catch (error) {
    console.error("Client registration error:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}

// src/api-handlers/cron/keep-alive.ts
import { createClient as createClient15 } from "@supabase/supabase-js";
async function handler28(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const supabaseUrl11 = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl11 || !supabaseKey) {
    return res.status(500).json({ error: "Missing Supabase credentials" });
  }
  try {
    const supabase6 = createClient15(supabaseUrl11, supabaseKey);
    const { data, error } = await supabase6.from("therapists").select("id").limit(1);
    if (error) throw error;
    console.log(`[Keep-Alive] Supabase ping OK \xE0s ${(/* @__PURE__ */ new Date()).toISOString()}`);
    return res.status(200).json({
      ok: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "Supabase projeto mantido ativo."
    });
  } catch (error) {
    console.error("[Keep-Alive] Erro:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/cron/reminders.ts
init_notifications();
import { createClient as createClient16 } from "@supabase/supabase-js";
var supabaseUrl7 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey7 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler29(req, res) {
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }
  if (!supabaseUrl7 || !supabaseServiceKey7) {
    return res.status(500).json({ error: "Missing Supabase Config" });
  }
  const supabase6 = createClient16(supabaseUrl7, supabaseServiceKey7);
  try {
    console.log("Cron: Checking for appointments tomorrow...");
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("pt-BR");
    console.log(`Target Date: ${tomorrowStr}`);
    const { data: appointments, error } = await supabase6.from("appointments").select(`
                id, date, time, reminder_sent,
                patients!inner (name, email, phone),
                therapists!inner (name)
            `).eq("status", "scheduled").eq("date", tomorrowStr).is("reminder_sent", false);
    if (error) throw error;
    console.log(`Found ${appointments?.length || 0} appointments for ${tomorrowStr}`);
    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ message: "No appointments to remind." });
    }
    const updates = [];
    for (const appt of appointments) {
      const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
      const therapist = Array.isArray(appt.therapists) ? appt.therapists[0] : appt.therapists;
      const pName = patient?.name || "Paciente";
      const pPhone = patient?.phone;
      const pEmail = patient?.email;
      const tName = therapist?.name || "Trg Nexus";
      console.log(`Sending reminder to ${pName} (${pPhone})...`);
      try {
        if (pPhone) {
          await sendSessionReminder({
            name: pName,
            phone: pPhone,
            date: appt.date,
            time: appt.time
          });
          updates.push(appt.id);
        }
      } catch (err) {
        console.error(`Failed to remind appointment ${appt.id}:`, err);
      }
    }
    if (updates.length > 0) {
      const { error: updateError } = await supabase6.from("appointments").update({ reminder_sent: true }).in("id", updates);
      if (updateError) throw updateError;
      console.log(`Marked ${updates.length} appointments as reminded.`);
    }
    return res.status(200).json({ success: true, processed: appointments.length, sent: updates.length });
  } catch (error) {
    console.error("Cron Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/debug/check-meta.ts
async function handler30(req, res) {
  const vars = {
    META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN ? "Set (starts with " + process.env.META_WHATSAPP_TOKEN.substring(0, 5) + "...)" : "MISSING",
    META_PHONE_ID: process.env.META_PHONE_ID ? "Set (" + process.env.META_PHONE_ID + ")" : "MISSING",
    NODE_VERSION: process.version
  };
  let apiStatus = "Not Tested";
  if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_ID) {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PHONE_ID}`, {
        headers: { "Authorization": `Bearer ${process.env.META_WHATSAPP_TOKEN}` }
      });
      const data = await response.json();
      apiStatus = response.ok ? "Valid (Phone ID Metadata Accessible)" : `Invalid (${JSON.stringify(data)})`;
    } catch (e) {
      apiStatus = `Error: ${e.message}`;
    }
  }
  return res.status(200).json({
    environment: vars,
    api_check: apiStatus
  });
}

// src/api-handlers/emails/templates.ts
var getEmailTemplate2 = (plan, name, magicLink) => {
  const primaryColor = "#0f172a";
  const accentColor = "#3b82f6";
  const footerColor = "#64748b";
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
  const loginUrl = magicLink || (process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/login` : "https://trg-nexus.vercel.app/login");
  switch (plan) {
    case "price_1ScuH5KPo7EypB7VQ7epTjiW":
    // Estágio
    case "estagio":
      subject = "Come\xE7ou! Seu Acesso ao TRG Nexus (Plano Est\xE1gio) \u{1F680}";
      title = "Bem-vindo ao In\xEDcio da Sua Jornada";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Parab\xE9ns por investir na sua carreira. O <strong>Plano Est\xE1gio</strong> \xE9 o primeiro passo para organizar seus atendimentos e ganhar confian\xE7a cl\xEDnica.</p>
                <p>Voc\xEA agora tem acesso a:</p>
                <ul style="color: #475569;">
                    <li>Prontu\xE1rio Digital Simplificado</li>
                    <li>Organiza\xE7\xE3o b\xE1sica de pacientes</li>
                    <li>Seguran\xE7a de dados criptografados</li>
                </ul>
                <p>Estamos honrados em fazer parte do seu crescimento.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Minha Conta</a>
                </div>
            `;
      break;
    case "price_1ScuH5KPo7EypB7VnIs6qfbQ":
    // Iniciante (Antigo)
    case "price_1Sd8DXKPo7EypB7VeUWX8m7L":
    // Iniciante (0.50)
    case "iniciante":
    case "starter":
      subject = "Agora \xE9 Profissional! Bem-vindo ao TRG Nexus \u{1F31F}";
      title = "Voc\xEA Subiu de N\xEDvel";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Excelente decis\xE3o. Com o <strong>Plano Iniciante</strong>, voc\xEA deixa de apenas "atender" para come\xE7ar a <strong>gerir</strong> sua cl\xEDnica.</p>
                <p>Destaques do seu acesso:</p>
                <ul style="color: #475569;">
                    <li>At\xE9 10 Pacientes ativos</li>
                    <li>Agenda inteligente</li>
                    <li>Suporte dedicado por email</li>
                </ul>
                <p>Sua organiza\xE7\xE3o acaba de ganhar um upgrade s\xE9rio.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Come\xE7ar Agora</a>
                </div>
            `;
      break;
    case "price_1SZgFjKPo7EypB7V8hI35TpO":
    // Profissional (Antigo)
    case "price_1Sd8DXKPo7EypB7VZwytTUEP":
    // Profissional (0.50)
    case "profissional":
    case "pro":
      subject = "Elite TRG: Bem-vindo ao Nexus Profissional \u{1F48E}";
      title = "Alta Performance Ativada";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Voc\xEA acaba de entrar para o grupo dos terapeutas que levam a gest\xE3o t\xE3o a s\xE9rio quanto o protocolo. O <strong>Plano Profissional</strong> \xE9 a nossa experi\xEAncia completa.</p>
                <p>Seu arsenal completo inclui:</p>
                <ul style="color: #475569;">
                    <li><strong>Pacientes Ilimitados</strong></li>
                    <li>Relat\xF3rios com Intelig\xEAncia Artificial</li>
                    <li>Gest\xE3o Financeira e Recibos</li>
                    <li>Suporte Priorit\xE1rio</li>
                </ul>
                <p>Estamos prontos para escalar junto com voc\xEA.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Painel VIP</a>
                </div>
            `;
      break;
    default:
      subject = "Seu Teste Gr\xE1tis no TRG Nexus Come\xE7ou! \u26A1";
      title = "Experimente o Poder da Organiza\xE7\xE3o";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Seja muito bem-vindo. Voc\xEA tem 7 dias para explorar o sistema que est\xE1 revolucionando a gest\xE3o de terapeutas TRG.</p>
                <p>Aproveite cada funcionalidade e veja como simplificar sua rotina.</p>
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
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 20px; background-color: #f8fafc;">
                <div style="${containerStyle}">
                    <div style="${headerStyle}">
                        <h1 style="color: white; margin: 0; font-size: 24px;">TRG <span style="color: ${accentColor}">Nexus</span></h1>
                    </div>
                    <div style="${bodyStyle}">
                        <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
                        ${content}
                        <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: ${footerColor}; text-align: center;">
                            Este email foi enviado automaticamente pelo TRG Nexus.<br>
                            Se voc\xEA n\xE3o realizou este cadastro, por favor ignore.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
  };
};
var templates_default2 = { getEmailTemplate: getEmailTemplate2 };

// src/api-handlers/emails/welcome.ts
import nodemailer4 from "nodemailer";
import { createClient as createClient17 } from "@supabase/supabase-js";
var getEmailTemplate3 = (plan, name, magicLink) => {
  const primaryColor = "#0f172a";
  const accentColor = "#3b82f6";
  const footerColor = "#64748b";
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
  const loginUrl = magicLink || (process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/login` : "https://trg-nexus.vercel.app/login");
  switch (plan) {
    case "price_1ScuH5KPo7EypB7VQ7epTjiW":
    // Estágio
    case "estagio":
      subject = "Come\xE7ou! Seu Acesso ao TRG Nexus (Plano Est\xE1gio) \u{1F680}";
      title = "Bem-vindo ao In\xEDcio da Sua Jornada";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Parab\xE9ns por investir na sua carreira. O <strong>Plano Est\xE1gio</strong> \xE9 o primeiro passo para organizar seus atendimentos e ganhar confian\xE7a cl\xEDnica.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Minha Conta</a>
                </div>
            `;
      break;
    case "price_1ScuH5KPo7EypB7VnIs6qfbQ":
    // Iniciante
    case "price_1Sd8DXKPo7EypB7VeUWX8m7L":
    // Iniciante 0.50
    case "iniciante":
    case "starter":
      subject = "Agora \xE9 Profissional! Bem-vindo ao TRG Nexus \u{1F31F}";
      title = "Voc\xEA Subiu de N\xEDvel";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>Excelente decis\xE3o. Com o <strong>Plano Iniciante</strong>, voc\xEA deixa de apenas "atender" para come\xE7ar a <strong>gerir</strong>.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Come\xE7ar Agora</a>
                </div>
            `;
      break;
    case "price_1SZgFjKPo7EypB7V8hI35TpO":
    // Profisisonal
    case "price_1Sd8DXKPo7EypB7VZwytTUEP":
    // Profissional 0.50
    case "profissional":
    case "pro":
      subject = "Elite TRG: Bem-vindo ao Nexus Profissional \u{1F48E}";
      title = "Alta Performance Ativada";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
                <p>O <strong>Plano Profissional</strong> \xE9 a nossa experi\xEAncia completa.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="${buttonStyle}">Acessar Painel VIP</a>
                </div>
            `;
      break;
    default:
      subject = "Seu Teste Gr\xE1tis no TRG Nexus Come\xE7ou! \u26A1";
      title = "Experimente o Poder da Organiza\xE7\xE3o";
      content = `
                <p style="font-size: 18px;">Ol\xE1, <strong>${name}</strong>!</p>
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
async function handler31(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, name, plan } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Missing email or name" });
    }
    const port = Number(process.env.SMTP_PORT) || 587;
    const host = (process.env.SMTP_HOST || "").trim();
    const user = (process.env.SMTP_USER || "").trim();
    const pass = (process.env.SMTP_PASS || "").trim();
    if (!host || !user || !pass) {
      console.error("SMTP configuration missing", { host: !!host, user: !!user, pass: !!pass });
      return res.status(500).json({ error: "Server misconfiguration: SMTP variables missing" });
    }
    const transporter = nodemailer4.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
    const supabaseAdmin2 = createClient17(
      process.env.VITE_SUPABASE_URL || "https://qyrsr5sa9s.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    let magicLink;
    try {
      const { data, error: linkError } = await supabaseAdmin2.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/dashboard` : "https://trg-nexus.vercel.app/dashboard"
        }
      });
      if (!linkError && data && data.properties && data.properties.action_link) {
        console.log("Magic link generated successfully");
        magicLink = data.properties.action_link;
      } else {
        console.error("Failed to generate magic link:", linkError);
      }
    } catch (genError) {
      console.error("Error generating magic link (fallback to login url):", genError);
    }
    const { subject, html } = getEmailTemplate3(plan, name, magicLink);
    await transporter.sendMail({
      from: `"TRG Nexus" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html
    });
    return res.status(200).json({ message: "Welcome email sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: error.message || "Unknown server error", stack: error.stack });
  }
}

// src/api-handlers/network/match.ts
import { createClient as createClient18 } from "@supabase/supabase-js";
var supabaseUrl8 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey8 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler32(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseUrl8 || !supabaseServiceKey8) {
    return res.status(500).json({ error: "Missing Supabase Config" });
  }
  const { sourceTherapistId, patientNeeds } = req.body;
  const supabase6 = createClient18(supabaseUrl8, supabaseServiceKey8);
  try {
    console.log(`\u{1F501} Finding match for source: ${sourceTherapistId}, needs: ${patientNeeds}`);
    let query = supabase6.from("therapists").select("id, name, specialty, rating, phone").eq("is_verified", true).eq("is_overflow_target", true).neq("id", sourceTherapistId);
    if (patientNeeds) {
      query = query.eq("specialty", patientNeeds);
    }
    const { data: candidates, error } = await query;
    if (error) throw error;
    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ success: false, message: "No qualified therapists found." });
    }
    candidates.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const topMatch = candidates[0];
    console.log(`\u2705 Update Match Found: ${topMatch.name} (Rating: ${topMatch.rating})`);
    return res.status(200).json({
      success: true,
      match: topMatch,
      candidatesCount: candidates.length
    });
  } catch (error) {
    console.error("Match Algorithm Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/network/referral.ts
init_notifications();
import { createClient as createClient19 } from "@supabase/supabase-js";
var supabaseUrl9 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey9 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler33(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseUrl9 || !supabaseServiceKey9) {
    return res.status(500).json({ error: "Missing Supabase Config" });
  }
  const {
    sourceTherapistId,
    targetTherapistId,
    patientName,
    patientContact,
    patientNeeds,
    sessionPrice
  } = req.body;
  const supabase6 = createClient19(supabaseUrl9, supabaseServiceKey9);
  try {
    console.log(`Processing Referral: ${sourceTherapistId} -> ${targetTherapistId}`);
    const price = Number(sessionPrice) || 150;
    const commission = price * 0.1;
    const { data: referral, error } = await supabase6.from("referrals").insert({
      source_therapist_id: sourceTherapistId,
      target_therapist_id: targetTherapistId,
      patient_name: patientName,
      patient_contact: patientContact,
      patient_needs: patientNeeds,
      status: "pending",
      session_price: price,
      commission_amount: commission
    }).select().single();
    if (error) throw error;
    const { data: targetTherapist } = await supabase6.from("therapists").select("phone, name, email").eq("id", targetTherapistId).single();
    if (targetTherapist?.phone) {
      console.log(`Notifying Target: ${targetTherapist.name}`);
      await sendBookingNotification({
        name: patientName,
        email: "placeholder@referral.com",
        // System placeholder, strictly for interface satisfaction
        phone: "00000000000",
        // No patient message for this specific type, processed in utils
        date: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
        time: "Agora",
        therapistName: targetTherapist.name,
        mainComplaint: `Sess\xE3o R$ ${price.toFixed(2)}`,
        // Custom Props for Refactored Notification util
        type: "referral_offer",
        therapistPhone: targetTherapist.phone
      });
    }
    return res.status(200).json({ success: true, referral });
  } catch (error) {
    console.error("Referral Creation Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/notifications/manual.ts
init_templates();
async function handler34(req, res) {
  const user = verifyAuth3(req, res);
  if (!user) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { phone, templateType, templateParams } = req.body;
    if (!phone || !templateType) {
      return res.status(400).json({ error: "Missing phone or templateType" });
    }
    let templateConfig;
    if (templateType === "WELCOME") {
      const name = templateParams?.name || "Cliente";
      templateConfig = WHATSAPP_TEMPLATES.WELCOME(name);
    } else if (templateType === "HELLO_WORLD") {
      templateConfig = WHATSAPP_TEMPLATES.HELLO_WORLD;
    } else if (templateType === "BOOKING_CONFIRMATION") {
      const { therapistName, patientName, date, time } = templateParams || {};
      if (!therapistName || !patientName || !date || !time) {
        return res.status(400).json({ error: "Missing parameters for BOOKING_CONFIRMATION (therapistName, patientName, date, time)" });
      }
      templateConfig = WHATSAPP_TEMPLATES.BOOKING_CONFIRMATION(therapistName, patientName, date, time);
    } else if (templateType === "BOOKING_CANCELLATION") {
      const { recipientName, date, time } = templateParams || {};
      if (!recipientName || !date || !time) {
        return res.status(400).json({ error: "Missing parameters for BOOKING_CANCELLATION (recipientName, date, time)" });
      }
      templateConfig = WHATSAPP_TEMPLATES.BOOKING_CANCELLATION(recipientName, date, time);
    } else if (templateType === "SESSION_REMINDER_15MIN") {
      const { patientName } = templateParams || {};
      if (!patientName) {
        return res.status(400).json({ error: "Missing parameters for SESSION_REMINDER_15MIN (patientName)" });
      }
      templateConfig = WHATSAPP_TEMPLATES.SESSION_REMINDER_15MIN(patientName);
    } else if (templateType === "SESSION_NOTIFICATION_CLIENT") {
      const { clientName, therapistName, date, time } = templateParams || {};
      if (!clientName || !therapistName || !date || !time) {
        return res.status(400).json({ error: "Missing parameters for SESSION_NOTIFICATION_CLIENT" });
      }
      templateConfig = WHATSAPP_TEMPLATES.SESSION_NOTIFICATION_CLIENT(clientName, therapistName, date, time);
    } else {
      return res.status(400).json({ error: `Invalid or unsupported template type: ${templateType}` });
    }
    if (!templateConfig) return res.status(500).json({ error: "Template config failed" });
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;
    if (!token || !phoneId) {
      throw new Error("Meta WhatsApp credentials (META_WHATSAPP_TOKEN, META_PHONE_ID) are missing.");
    }
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55") && formattedPhone.length <= 11) {
      formattedPhone = "55" + formattedPhone;
    }
    console.log(`Sending Meta Template [${templateConfig.name}] to ${formattedPhone}...`);
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: templateConfig
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Meta API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({ error: data.error?.message || "Failed to send message" });
    }
    return res.status(200).json({ success: true, metaId: data.messages?.[0]?.id });
  } catch (error) {
    console.error("Manual WhatsApp Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/notifications/register-welcome.ts
import twilio2 from "twilio";
async function handler35(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Missing name or phone" });
  }
  try {
    const twilioSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const twilioToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || "").trim();
    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.error("Twilio credentials missing");
      return res.status(500).json({ error: "Server misconfiguration: Twilio credentials missing" });
    }
    const client = twilio2(twilioSid, twilioToken);
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55") && formattedPhone.length <= 11) {
      formattedPhone = "55" + formattedPhone;
    }
    const to = `whatsapp:+${formattedPhone}`;
    const from = twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`;
    const message = `\u{1F31F} *Bem-vindo(a) ao TRG Nexus!*

Ol\xE1 ${name}, seu cadastro foi realizado com sucesso! \u{1F680}

Agora voc\xEA tem acesso \xE0 ferramenta definitiva para gest\xE3o dos seus atendimentos.

*Pr\xF3ximos passos:*
1. Acesse seu email para entrar no painel (Link M\xE1gico).
2. Complete seu perfil profissional.
3. Comece a agendar!

Qualquer d\xFAvida, estamos por aqui.

_Equipe TRG Nexus_`;
    console.log(`Sending WhatsApp Welcome to ${to}...`);
    await client.messages.create({
      from,
      to,
      body: message
    });
    return res.status(200).json({ message: "WhatsApp notification sent" });
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return res.status(500).json({ error: error.message || "Failed to send notification" });
  }
}

// src/api-handlers/notifications/subscribe.ts
import { createClient as createClient20 } from "@supabase/supabase-js";
var supabase4 = createClient20(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function handler36(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: "Missing subscription data" });
  }
  try {
    const user = await verifyAuth3(req, res);
    if (!user) return;
    const { error } = await supabase4.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }, {
      onConflict: "endpoint"
    });
    if (error) {
      console.error("Error saving subscription:", error);
      return res.status(500).json({ error: "Database error while saving subscription" });
    }
    return res.status(200).json({ success: true, message: "Subscription saved successfully" });
  } catch (error) {
    console.error("Push subscription error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// api/index.ts
init_templates();

// src/api-handlers/notifications/test-push.ts
import webpush from "web-push";
import { createClient as createClient21 } from "@supabase/supabase-js";
var supabase5 = createClient21(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || "BJ7-wfrZYbt4dQE2E5SCIS5BExiOgZ0jwQ30U7JpZM25hghTidUkyaCZmC0uegvJgIiCwyGBBlj1n1s9YxrNRYI";
var PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "aeIr6STjS0JYGvV7QqLx3YPVAYaklOAONE79aWY9TPI";
webpush.setVapidDetails(
  "mailto:contato@trgnexus.com.br",
  PUBLIC_KEY,
  PRIVATE_KEY
);
async function handler37(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const user = await verifyAuth3(req, res);
    if (!user) return;
    const { data: subscriptions, error } = await supabase5.from("push_subscriptions").select("*").eq("user_id", user.id);
    if (error) {
      return res.status(500).json({ error: "Error fetching subscriptions" });
    }
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: "No subscriptions found for this user" });
    }
    const payload = JSON.stringify({
      title: "Teste de Notifica\xE7\xE3o",
      body: "Seu sistema de notifica\xE7\xF5es push est\xE1 funcionando perfeitamente!",
      data: {
        url: "/dashboard"
      }
    });
    const results = await Promise.all(
      subscriptions.map(
        (sub) => webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload).catch((err) => {
          console.error("Error sending push to endpoint:", sub.endpoint, err);
          return { error: err };
        })
      )
    );
    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Test push error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// src/api-handlers/public/therapists.ts
import { createClient as createClient22 } from "@supabase/supabase-js";
var supabaseUrl10 = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey10 = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler38(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseUrl10 || !supabaseServiceKey10) {
    return res.status(500).json({ error: "Server Misconfiguration" });
  }
  const supabase6 = createClient22(supabaseUrl10, supabaseServiceKey10);
  try {
    let query = supabase6.from("therapists").select(`
                id,
                name,
                bio,
                photo_url,
                specialties,
                citrg_code,
                rating,
                review_count,
                appointments_count,
                price,
                currency,
                session_duration,
                is_verified
            `).eq("status", "active");
    if (req.query.id) {
      query = query.eq("id", req.query.id);
    }
    const { data: therapists, error } = await query;
    if (error) throw error;
    return res.status(200).json({ therapists: therapists || [] });
  } catch (error) {
    console.error("Error fetching therapists:", error);
    return res.status(500).json({ error: error.message });
  }
}

// src/api-handlers/system/add_session_data_column.ts
import { Pool as Pool6 } from "pg";
import dotenv3 from "dotenv";
import path3 from "path";
dotenv3.config({ path: path3.resolve(process.cwd(), ".env.local") });
async function handler39(req, res) {
  const connectionString4 = process.env.POSTGRES_URL;
  if (!connectionString4) {
    return res.status(500).json({ error: "Database configuration missing" });
  }
  const pool5 = new Pool6({
    connectionString: connectionString4,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const client = await pool5.connect();
    await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;
        `);
    client.release();
    return res.status(200).json({ message: "Migration successful: session_data column added." });
  } catch (error) {
    console.error("Migration Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool5.end();
  }
}

// src/api-handlers/system/migrate-reminders.ts
import pg7 from "pg";
async function handler40(req, res) {
  const { Pool: Pool7 } = pg7;
  const connectionString4 = process.env.trgnexus_POSTGRES_URL || process.env.POSTGRES_URL;
  if (!connectionString4) {
    return res.status(500).json({ error: "Database connection string missing" });
  }
  const pool5 = new Pool7({
    connectionString: connectionString4.replace("?sslmode=require", "?"),
    ssl: { rejectUnauthorized: false }
  });
  try {
    const client = await pool5.connect();
    console.log("Running migration: Adding reminder_sent to appointments...");
    await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
        `);
    console.log("Migration successful!");
    client.release();
    return res.status(200).json({ success: true, message: "Migration applied: reminder_sent column added." });
  } catch (error) {
    console.error("Migration Error:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool5.end();
  }
}

// src/api-handlers/system/simple-test.ts
import twilio3 from "twilio";
async function handler41(req, res) {
  if (req.method === "GET" && !req.query.phone) {
    return res.status(200).json({ status: "ok", mode: "read-only", message: "Add ?phone=YOUR_NUMBER to URL to test send" });
  }
  try {
    const phone = req.body?.phone || req.query.phone;
    const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const fromVal = (process.env.TWILIO_PHONE_NUMBER || "").trim();
    console.log("Test send hit. Phone:", phone);
    if (!sid || !token || !fromVal) {
      return res.status(500).json({ error: "Missing env vars", debug: { sid: !!sid, token: !!token } });
    }
    const debugInfo = {
      sidPrefix: sid.substring(0, 6) + "...",
      sidLength: sid.length,
      tokenPrefix: token.substring(0, 4) + "...",
      tokenLength: token.length
    };
    const client = twilio3(sid, token);
    let target = (phone || "").replace(/\D/g, "");
    if (!target.startsWith("55") && target.length <= 11) target = "55" + target;
    const toVal = `whatsapp:+${target}`;
    console.log(`Attempting send from ${fromVal} to ${toVal}`);
    const message = await client.messages.create({
      from: fromVal,
      to: toVal,
      body: "Teste Simples do Sistema - Debug"
    });
    return res.status(200).json({ success: true, sid: message.sid, debugInfo });
  } catch (error) {
    console.error("Simple Test Error:", error);
    const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const debugInfo = {
      sidPrefix: sid.substring(0, 6) + "...",
      sidLength: sid.length,
      tokenPrefix: token.substring(0, 4) + "...",
      tokenLength: token.length
    };
    return res.status(200).json({ success: false, error: error.message, stack: error.stack, debugInfo });
  }
}

// src/api-handlers/system/test-whatsapp.ts
init_notifications();
async function handler42(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Telefone obrigat\xF3rio" });
  }
  try {
    console.log("Testing WhatsApp for:", phone);
    await sendBookingNotification({
      name: "Teste de Sistema",
      email: "ignore@test.com",
      // Email won't be sent if SMTP unimplemented or we ignore
      phone,
      date: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
      time: "14:00",
      therapistName: "Sistema de Teste"
    });
    return res.status(200).json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch (error) {
    console.error("Test WhatsApp Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// api/index.ts
async function handler43(req, res) {
  const url = req.url || "";
  const cleanUrl = url.split("?")[0].replace(/^\/api\//, "").replace(/\/$/, "");
  console.log(`[API Router] Clean URL: ${cleanUrl}`);
  switch (cleanUrl) {
    case "appointments":
      return handler(req, res);
    case "availability":
      return handler2(req, res);
    case "blocked-slots":
      return handler3(req, res);
    case "booking":
      return handler4(req, res);
    case "client-portal":
      return handler5(req, res);
    case "dashboard":
      return handler6(req, res);
    case "feedback":
      return handler7(req, res);
    case "financials":
      return handler8(req, res);
    case "fix-booking":
      return handler9(req, res);
    case "manual-confirm":
      return handler10(req, res);
    case "notifications":
      return handler11(req, res);
    case "patient-details":
      return handler12(req, res);
    case "patients":
      return handler13(req, res);
    case "payments":
      return handler14(req, res);
    case "recordings":
      return handler15(req, res);
    case "reports":
      return handler16(req, res);
    case "setup_sud":
      return handler17(req, res);
    case "sud":
      return handler18(req, res);
    case "test-whatsapp":
      return handler19(req, res);
    case "webhook":
      return handler20(req, res);
    case "ai/chat":
      return handler21(req, res);
    case "ai/optimize":
      return handler22(req, res);
    case "ai/report":
      return handler23(req, res);
    case "auth/login":
      return handler24(req, res);
    case "auth/register-complete":
      return handler25(req, res);
    case "auth/request-password-reset":
      return handler26(req, res);
    case "client-auth/register":
      return handler27(req, res);
    case "cron/keep-alive":
      return handler28(req, res);
    case "cron/reminders":
      return handler29(req, res);
    case "debug/check-meta":
      return handler30(req, res);
    case "emails/templates":
      return templates_default2(req, res);
    case "emails/welcome":
      return handler31(req, res);
    case "network/match":
      return handler32(req, res);
    case "network/referral":
      return handler33(req, res);
    case "notifications/manual":
      return handler34(req, res);
    case "notifications/register-welcome":
      return handler35(req, res);
    case "notifications/subscribe":
      return handler36(req, res);
    case "notifications/templates":
      return templates_default(req, res);
    case "notifications/test-push":
      return handler37(req, res);
    case "public/therapists":
      return handler38(req, res);
    case "system/add_session_data_column":
      return handler39(req, res);
    case "system/migrate-reminders":
      return handler40(req, res);
    case "system/simple-test":
      return handler41(req, res);
    case "system/test-whatsapp":
      return handler42(req, res);
    default:
      res.status(404).json({ error: `Route not found: /api/${cleanUrl}` });
  }
}
export {
  handler43 as default
};
