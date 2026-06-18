import { createClient } from '@supabase/supabase-js';
import { sendSessionReminderEmail, sendBillingReminderEmail } from '../utils/notifications.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Handler principal ───────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // Autenticação via CRON_SECRET (mesmo esquema do cron de 15min)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase Config' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Data de amanhã no formato pt-BR (dd/MM/yyyy) — igual ao usado no banco
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString('pt-BR');

    console.log(`[Cron 24h] Buscando sessões de amanhã: ${tomorrowStr}`);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id, date, time, status, reminder_24h_sent,
        patients!inner(name, phone, email),
        therapists!inner(name, reminder_24h_enabled)
      `)
      .in('status', ['scheduled', 'pending_payment'])
      .eq('date', tomorrowStr)
      .is('reminder_24h_sent', false);

    if (error) throw error;

    console.log(`[Cron 24h] ${appointments?.length || 0} agendamento(s) encontrado(s).`);

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        message: 'Nenhum agendamento para amanhã sem lembrete pendente.',
        targetDate: tomorrowStr,
      });
    }

    const successIds: string[] = [];
    const skippedIds: string[] = [];
    const failedIds: string[] = [];

    for (const appt of appointments) {
      const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
      const therapist = Array.isArray(appt.therapists) ? appt.therapists[0] : appt.therapists;

      const pName = (patient as any)?.name || 'Paciente';
      const pPhone = (patient as any)?.phone;
      const pEmail = (patient as any)?.email;
      const tName = (therapist as any)?.name || 'TeraNexus';

      // Terapeuta desativou lembrete 24h → pular (opt-out: null/undefined = ativo)
      if ((therapist as any)?.reminder_24h_enabled === false) {
        console.log(`[Cron 24h] Terapeuta "${tName}" com lembrete 24h desativado — pulando "${pName}".`);
        skippedIds.push(appt.id);
        continue;
      }

      // Sem email cadastrado → pular
      if (!pEmail) {
        console.warn(`[Cron 24h] Sem e-mail para "${pName}" (id: ${appt.id}) — pulando.`);
        skippedIds.push(appt.id);
        continue;
      }

      console.log(`[Cron 24h] Lembrando (${appt.status}): ${pName} (${pEmail}) → sessão em ${appt.date} às ${appt.time}`);

      try {
        const dataPayload = { name: pName, email: pEmail, date: appt.date, time: appt.time, therapistName: tName };
        const result = appt.status === 'pending_payment'
            ? await sendBillingReminderEmail(dataPayload)
            : await sendSessionReminderEmail(dataPayload);

        if (result.success) {
          successIds.push(appt.id);
        } else {
          console.error(`[Cron 24h] Falha de e-mail para "${pName}":`, result.error);
          failedIds.push(appt.id);
        }
      } catch (err) {
        console.error(`[Cron 24h] Erro no agendamento ${appt.id}:`, err);
        failedIds.push(appt.id);
      }
    }

    // Marcar enviados no banco para não reenviar
    if (successIds.length > 0) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ reminder_24h_sent: true })
        .in('id', successIds);

      if (updateError) throw updateError;
      console.log(`[Cron 24h] ${successIds.length} lembrete(s) marcado(s) no banco.`);
    }

    return res.status(200).json({
      success: true,
      targetDate: tomorrowStr,
      total: appointments.length,
      sent: successIds.length,
      skipped: skippedIds.length,
      failed: failedIds.length,
    });

  } catch (error: any) {
    console.error('[Cron 24h] Erro crítico:', error);
    return res.status(500).json({ error: error.message });
  }
}
