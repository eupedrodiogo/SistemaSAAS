import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password + (process.env.STRIPE_SECRET_KEY || 'default_secret')).digest('hex');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
            error: 'Erro de configuração do banco de dados.',
            debug: { supabaseUrl: supabaseUrl ? 'SET' : 'MISSING', supabaseKey: supabaseKey ? 'SET' : 'MISSING' }
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    try {
        const { email, password, name, patientId, appointmentId } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const hashedPassword = hashPassword(password);

        // ==========================================================
        // FLUXO ANJO: appointmentId + e-mail novo → cria paciente
        // ==========================================================
        if (appointmentId) {
            // 1. Busca o agendamento para pegar therapist_id
            const { data: appt, error: apptError } = await supabaseAdmin
                .from('appointments')
                .select('id, therapist_id, patient_id, patient_name')
                .eq('id', appointmentId)
                .single();

            if (apptError || !appt) {
                return res.status(404).json({ error: 'Agendamento não encontrado.' });
            }

            // 2. Verifica se já existe um paciente com esse e-mail
            const { data: existingPatients } = await supabaseAdmin
                .from('patients')
                .select('id, email')
                .ilike('email', `%${cleanEmail}%`);

            const matchedPatient = existingPatients?.find(p => p.email?.trim().toLowerCase() === cleanEmail);

            let finalPatientId: string;
            let finalPatientName: string;

            if (matchedPatient) {
                // Atualiza senha do paciente existente
                await supabaseAdmin
                    .from('patients')
                    .update({ password_hash: hashedPassword, email: cleanEmail })
                    .eq('id', matchedPatient.id);
                finalPatientId = matchedPatient.id;
                finalPatientName = name || cleanEmail.split('@')[0];
                
                // Se o agendamento já tinha um patient_id (criado temporariamente) e é diferente do matched, excluímos o dummy
                if (appt.patient_id && appt.patient_id !== matchedPatient.id) {
                    await supabaseAdmin.from('patients').delete().eq('id', appt.patient_id);
                }
            } else {
                if (appt.patient_id) {
                    // Atualiza o paciente dummy criado temporariamente pelo sistema
                    await supabaseAdmin
                        .from('patients')
                        .update({
                            name: name || cleanEmail.split('@')[0],
                            email: cleanEmail,
                            password_hash: hashedPassword,
                            status: 'active'
                        })
                        .eq('id', appt.patient_id);
                    finalPatientId = appt.patient_id;
                    finalPatientName = name || cleanEmail.split('@')[0];
                } else {
                    // 3. Cria novo paciente vinculado ao terapeuta do agendamento
                    const { data: newPatient, error: createError } = await supabaseAdmin
                        .from('patients')
                        .insert([{
                            name: name || cleanEmail.split('@')[0],
                            email: cleanEmail,
                            therapist_id: appt.therapist_id,
                            status: 'active',
                            password_hash: hashedPassword,
                            created_at: new Date().toISOString()
                        }])
                        .select('id, name')
                        .single();

                    if (createError || !newPatient) {
                        throw new Error(createError?.message || 'Erro ao criar paciente.');
                    }
                    finalPatientId = newPatient.id;
                    finalPatientName = newPatient.name;
                }
            }

            // 4. Atualiza o agendamento com o patient_id e nome real
            await supabaseAdmin
                .from('appointments')
                .update({
                    patient_id: finalPatientId,
                    patient_name: finalPatientName,
                    status: 'scheduled'
                })
                .eq('id', appointmentId);

            return res.status(200).json({
                success: true,
                patientId: finalPatientId,
                message: 'Conta Anjo criada com sucesso!'
            });
        }

        // ==========================================================
        // FLUXO NORMAL: busca pelo e-mail existente
        // ==========================================================

        // Busca paciente pelo e-mail (ilike para case-insensitivity + espaços)
        const { data: existingPatients, error: searchError } = await supabaseAdmin
            .from('patients')
            .select('id, email')
            .ilike('email', `%${cleanEmail}%`);

        if (searchError) throw searchError;

        const matchedPatient = existingPatients?.find(p => p.email?.trim().toLowerCase() === cleanEmail);

        if (matchedPatient) {
            // Atualiza paciente existente com senha
            const { error: updateError } = await supabaseAdmin
                .from('patients')
                .update({ password_hash: hashedPassword, email: cleanEmail })
                .eq('id', matchedPatient.id);

            if (updateError) throw updateError;

            return res.status(200).json({
                success: true,
                patientId: matchedPatient.id,
                message: 'Senha configurada com sucesso.'
            });
        }

        // Se patientId fornecido (fluxo legado de booking)
        if (patientId) {
            const { error: updateByIdError } = await supabaseAdmin
                .from('patients')
                .update({ password_hash: hashedPassword, email: cleanEmail })
                .eq('id', patientId);

            if (updateByIdError) throw updateByIdError;

            return res.status(200).json({
                success: true,
                patientId,
                message: 'Conta criada com sucesso.'
            });
        }

        // Nenhum paciente encontrado
        return res.status(404).json({
            error: 'Paciente não encontrado. Complete o agendamento primeiro.',
            debug: {
                cleanEmailSent: cleanEmail,
                existingPatientsCount: existingPatients ? existingPatients.length : 0,
            }
        });

    } catch (error: any) {
        console.error('Client registration error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.', details: error.message || error.toString() });
    }
}
