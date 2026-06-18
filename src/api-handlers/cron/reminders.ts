import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendSessionReminder } from '../utils/notifications.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cron: POST /api/cron/reminders
 * Roda todo dia às 09:00 (horário do servidor) via vercel.json
 * e pode também ser chamado a cada hora para lembretes de "1h antes"
 *
 * Lógica:
 * 1) Busca agendamentos com status 'scheduled' que ocorrem nas próximas ~1 hora
 *    (janela: now+50min até now+70min para cobrir o tick do cron)
 * 2) Envia lembrete via Z-API para o paciente
 * 3) Marca reminder_sent = true para não enviar duplicado
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Autenticação do Cron
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Missing Supabase Config' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const now = new Date();

        // Janela de 1h: busca sessões entre 50min e 70min a partir de agora
        const windowStart = new Date(now.getTime() + 50 * 60 * 1000);
        const windowEnd   = new Date(now.getTime() + 70 * 60 * 1000);

        // Formata data no padrão do banco (DD/MM/YYYY)
        const todayStr = now.toLocaleDateString('pt-BR'); // DD/MM/YYYY

        // Faixa de horários HH:MM (comparação string é suficiente para HH:MM)
        const timeStart = windowStart.toTimeString().slice(0, 5); // "HH:MM"
        const timeEnd   = windowEnd.toTimeString().slice(0, 5);

        console.log(`[Cron Reminders] Janela: ${todayStr} ${timeStart} → ${timeEnd}`);

        // Query: agendamentos de hoje no horário da janela, ainda não lembrados
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id, date, time, reminder_sent,
                patients!inner (name, email, phone),
                therapists!inner (name)
            `)
            .eq('status', 'scheduled')
            .eq('date', todayStr)
            .is('reminder_sent', false)
            .gte('time', timeStart)
            .lte('time', timeEnd);

        if (error) throw error;

        console.log(`[Cron Reminders] ${appointments?.length || 0} agendamento(s) encontrado(s).`);

        if (!appointments || appointments.length === 0) {
            return res.status(200).json({ message: 'Nenhum agendamento para lembrar nesta janela.' });
        }

        const successIds: string[] = [];
        const failedIds: string[] = [];

        for (const appt of appointments) {
            const patient   = Array.isArray(appt.patients)   ? appt.patients[0]   : appt.patients;
            const therapist = Array.isArray(appt.therapists) ? appt.therapists[0] : appt.therapists;

            const pName    = patient?.name  || 'Paciente';
            const pPhone   = patient?.phone;
            const tName    = therapist?.name || 'TeraNexus';

            console.log(`[Cron] Lembrando: ${pName} (${pPhone}) para sessão às ${appt.time}`);

            if (!pPhone) {
                console.warn(`[Cron] Sem telefone para o paciente ${pName} (id: ${appt.id})`);
                continue;
            }

            try {
                await sendSessionReminder({
                    name: pName,
                    phone: pPhone,
                    date: appt.date,
                    time: appt.time,
                });
                successIds.push(appt.id);
            } catch (err) {
                console.error(`[Cron] Falha ao lembrar agendamento ${appt.id}:`, err);
                failedIds.push(appt.id);
            }
        }

        // Marca como lembrado em lote
        if (successIds.length > 0) {
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ reminder_sent: true })
                .in('id', successIds);

            if (updateError) throw updateError;
            console.log(`[Cron] ${successIds.length} agendamento(s) marcado(s) como lembrado(s).`);
        }

        return res.status(200).json({
            success: true,
            window: `${todayStr} ${timeStart}–${timeEnd}`,
            total: appointments.length,
            sent: successIds.length,
            failed: failedIds.length,
        });

    } catch (error: any) {
        console.error('[Cron Reminders] Erro:', error);
        return res.status(500).json({ error: error.message });
    }
}
