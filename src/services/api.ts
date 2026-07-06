import { Patient, Appointment, NotificationItem } from '../../types';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_STATS } from '../constants';
import { supabase } from '../lib/supabase';

/**
 * TeraNexus API SERVICE
 * 
 * Estratégia Híbrida:
 * 1. Tenta buscar do Supabase com autenticação.
 * 2. Fallback para localStorage/Mock se offline ou sem auth.
 */

const getBaseUrl = () => {
  const stored = localStorage.getItem('TRG_SERVER_URL');
  return stored || '';
};
const getToken = () => localStorage.getItem('TRG_AUTH_TOKEN');
const getTherapistId = async (): Promise<string | null> => {
  const stored = localStorage.getItem('therapist');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id) return parsed.id;
    } catch {}
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

// Helper para fetch autenticado (endpoints legados)
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  
  let token = getToken();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) token = session.access_token;
  } catch {}

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
    if (!response.ok) return null;
    return response.json();
  } catch (e) {
    return null;
  }
};

// --- SIMULATION HELPERS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  therapist_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  category: string;
  description: string | null;
  date: string; // ISO date string
  created_at: string;
  updated_at: string;
  // Join data
  patients?: { name: string } | null;
}

export interface TransactionInput {
  patient_id?: string | null;
  appointment_id?: string | null;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  category?: string;
  description?: string;
  date: string;
}

export interface FinancialSummary {
  period_month: number;
  period_year: number;
  total_revenue: number;
  total_expenses: number;
  balance: number;
  pending_amount: number;
}

export interface PatientFinancialSummary {
  patient_id: string;
  patient_name: string;
  therapist_id: string;
  total_invested: number;
  pending_amount: number;
  transaction_count: number;
  last_payment_date: string | null;
}

// ─────────────────────────────────────────────────────────────────
// API MODULES
// ─────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.setItem('TRG_AUTH', 'true');

      if (data.user) {
        const { data: therapist } = await supabase
          .from('therapists')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (therapist) {
          localStorage.setItem('therapist', JSON.stringify(therapist));
        }
      }
      return true;
    },
    logout: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('TRG_AUTH_TOKEN');
      localStorage.removeItem('TRG_AUTH');
      localStorage.removeItem('therapist');
    }
  },

  patients: {
    list: async (): Promise<Patient[]> => {
      const therapistId = await getTherapistId();
      if (!therapistId) return MOCK_PATIENTS;

      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('therapist_id', therapistId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data as Patient[]) ?? MOCK_PATIENTS;
      } catch (err: any) {
        return MOCK_PATIENTS;
      }
    },

    /**
     * Lista pacientes enriquecidos com totais financeiros dinâmicos
     * via a View patient_financial_summary (SSoT).
     */
    listWithFinancials: async (): Promise<(Patient & { total_invested: number; pending_amount: number })[]> => {
      const therapistId = await getTherapistId();
      if (!therapistId) return MOCK_PATIENTS.map(p => ({ ...p, total_invested: 0, pending_amount: 0 }));

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [patientsRes, summaryRes, appointmentsRes] = await Promise.all([
          supabase
            .from('patients')
            .select('*')
            .eq('therapist_id', therapistId)
            .order('created_at', { ascending: false }),
          supabase
            .from('patient_financial_summary')
            .select('patient_id, total_invested, pending_amount')
            .eq('therapist_id', therapistId),
          supabase
            .from('appointments')
            .select('patient_id, date, time')
            .eq('therapist_id', therapistId)
            .gte('date', todayStr)
            .in('status', ['scheduled', 'Agendado'])
            .order('date', { ascending: true })
            .order('time', { ascending: true })
        ]);

        if (patientsRes.error) throw patientsRes.error;

        const financialMap = new Map<string, { total_invested: number; pending_amount: number }>(
          (summaryRes.data ?? []).map((s: PatientFinancialSummary) => [
            s.patient_id,
            { total_invested: Number(s.total_invested), pending_amount: Number(s.pending_amount) }
          ])
        );

        const nextSessionMap = new Map<string, string>();
        (appointmentsRes.data ?? []).forEach((apt: any) => {
           if (!nextSessionMap.has(apt.patient_id)) {
              // Ensure time format is correct. Postgres time might be '14:00' or '14:00:00'
              const timeStr = apt.time && apt.time.split(':').length === 2 ? `${apt.time}:00` : apt.time;
              nextSessionMap.set(apt.patient_id, `${apt.date}T${timeStr}`);
           }
        });

        return (patientsRes.data ?? []).map((p: Patient) => ({
          ...p,
          total_invested: financialMap.get(p.id)?.total_invested ?? 0,
          pending_amount: financialMap.get(p.id)?.pending_amount ?? 0,
          nextSession: nextSessionMap.get(p.id) || p.nextSession || undefined,
        }));
      } catch (err: any) {
        console.error('listWithFinancials error:', err);
        return MOCK_PATIENTS.map(p => ({ ...p, total_invested: 0, pending_amount: 0 }));
      }
    },

    create: async (patient: Partial<Patient>) => {
      const therapistId = await getTherapistId();
      if (!therapistId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('patients')
        .insert({ ...patient, therapist_id: therapistId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    update: async (id: string, data: Partial<Patient>) => {
      const { data: updated, error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },

    delete: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    details: async (id: string) => {
      // Busca histórico de sessões + transações reais do paciente
      try {
        const [appointmentsRes, transactionsRes, summaryRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', id)
            .order('date', { ascending: false })
            .limit(20),
          supabase
            .from('transactions')
            .select('*')
            .eq('patient_id', id)
            .order('date', { ascending: false }),
          supabase
            .from('patient_financial_summary')
            .select('total_invested, pending_amount, transaction_count, last_payment_date')
            .eq('patient_id', id)
            .single(),
        ]);

        const appointments = appointmentsRes.data ?? [];
        const transactions = transactionsRes.data ?? [];
        const summary = summaryRes.data;

        // Monta timeline (Apenas sessões)
        const timeline = appointments.map((a: any) => {
          let desc = a.notes || a.session_data?.notes || 'Sem anotações';
          // Tenta parsear caso seja um JSON salvo diretamente
          if (typeof desc === 'string' && desc.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(desc);
              // Caso o JSON não tenha um campo `notes`, usamos uma descrição padrão
              desc = parsed.notes || 'Sessão registrada (Estrutura de dados salva)';
            } catch (e) {
              // Se não for JSON válido, mantém a string original
            }
          } else if (typeof desc === 'object') {
            desc = desc.notes || 'Sessão registrada (Estrutura de dados salva)';
          }

          return {
            id: a.id,
            type: 'session',
            date: a.date,
            title: `Sessão — ${a.type || 'TRG'}`,
            desc,
            sessionData: a.session_data || {},
          };
        }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          timeline,
          financial: {
            totalInvested: Number(summary?.total_invested ?? 0),
            pending: Number(summary?.pending_amount ?? 0),
            transactionCount: summary?.transaction_count ?? 0,
            lastPaymentDate: summary?.last_payment_date ?? null,
            history: transactions.map((t: Transaction) => ({
              id: t.id,
              desc: t.description || t.category,
              date: t.date,
              value: Number(t.amount),
              status: t.status === 'paid' ? 'Pago' : 'Pendente',
              type: t.type,
            })),
          },
          documents: [],
        };
      } catch (err) {
        // Fallback para endpoint legado
        const legacyData = await apiFetch(`/api/patient-details?patientId=${id}`);
        return legacyData ?? { timeline: [], financial: { totalInvested: 0, pending: 0, history: [] }, documents: [] };
      }
    },

    sud: {
      list: async (patientId: string) => {
        return await apiFetch(`/api/sud?patientId=${patientId}`);
      },
      create: async (data: any) => {
        return await apiFetch('/api/sud', { method: 'POST', body: JSON.stringify(data) });
      }
    }
  },

  appointments: {
    list: async () => {
      const therapistId = await getTherapistId();
      if (!therapistId) return MOCK_APPOINTMENTS;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, patients(name, email, phone)')
          .eq('therapist_id', therapistId)
          .order('date', { ascending: true });
        
        if (error) throw error;
        
        return (data || []).map((row: any) => ({
          ...row,
          patientName: row.patients?.name || row.session_data?.patientName || row.patient_name || 'Desconhecido',
          patientEmail: row.patients?.email || row.session_data?.patientEmail,
          patientPhone: row.patients?.phone || row.session_data?.patientPhone,
          patientId: row.patient_id || 'unregistered',
          sessionData: row.session_data || {}
        })) ?? MOCK_APPOINTMENTS;
      } catch (err: any) {
        return MOCK_APPOINTMENTS;
      }
    },
    get: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, patients(*)')
          .eq('id', id)
          .single();
        if (error) throw error;
        return {
          ...data,
          patientName: data.patients?.name || data.session_data?.patientName || data.patient_name || 'Desconhecido',
          patientId: data.patient_id || 'unregistered',
          patient: data.patients,
          sessionData: data.session_data || {}
        };
      } catch (err) {
        return null;
      }
    },
    create: async (apt: Partial<Appointment>) => {
      const therapistId = await getTherapistId();
      if (!therapistId) throw new Error('Not authenticated');
      
      const payload: any = { ...apt, therapist_id: therapistId };
      
      // Se não tiver um patientId definido ou for 'unregistered', o Supabase rejeitaria por violar a restrição NOT NULL em patient_id (uuid).
      // Então, criamos um paciente temporário na tabela patients.
      if (!payload.patientId || payload.patientId === 'unregistered') {
         const { data: newPatient, error: pError } = await supabase
           .from('patients')
           .insert({
              therapist_id: therapistId,
              name: payload.patientName || apt.patientName || 'Cliente Anjo (Pendente)',
              email: payload.patientEmail || apt.patientEmail || null,
              phone: payload.patientPhone || apt.patientPhone || null,
              status: 'active'
           })
           .select()
           .single();
           
         if (pError) throw new Error('Falha ao criar paciente temporário: ' + pError.message);
         payload.patient_id = newPatient.id;
      } else {
         payload.patient_id = payload.patientId;
      }
      
      delete payload.patientId;
      
      if (payload.patientName) { delete payload.patientName; }
      if (payload.patientEmail) { delete payload.patientEmail; }
      if (payload.patientPhone) { delete payload.patientPhone; }
      
      if (payload.sessionData) { 
          if (!payload.session_data) payload.session_data = payload.sessionData;
          delete payload.sessionData; 
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select('*, patients(name, email, phone)')
        .single();
      if (error) throw error;

      if (payload.status === 'Concluído' || data.status === 'Concluído') {
        try {
          await supabase.from('transactions').insert({
            therapist_id: data.therapist_id,
            patient_id: data.patient_id,
            appointment_id: data.id,
            amount: Number(data.session_data?.price || 0),
            type: 'income',
            status: 'paid',
            category: 'Sessão TRG',
            description: 'Sessão registrada via agenda',
            date: data.date
          });
        } catch (e) { }
      }
      
      // ─── Disparar email de confirmação (cliente + terapeuta) ──────────
      // Fire-and-forget: não bloqueia nem quebra o agendamento em caso de falha.
      try {
        const { data: therapistRow } = await supabase
          .from('therapists')
          .select('name, email, phone')
          .eq('id', therapistId)
          .single();

        const notifPatientName  = data.patients?.name  || apt.patientName  || 'Paciente';
        const notifPatientEmail = data.patients?.email || apt.patientEmail  || null;
        const notifPatientPhone = data.patients?.phone || apt.patientPhone  || null;

        // Formata a data para DD/MM/AAAA (formato esperado pelo template)
        const rawDate = (data.date as string) || ''; // "YYYY-MM-DD"
        const [yyyy, mm, dd] = rawDate.split('-');
        const formattedDate = dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : rawDate;

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (accessToken && (notifPatientEmail || therapistRow?.email)) {
          const baseUrl = typeof window !== 'undefined'
            ? window.location.origin
            : (process.env.VITE_APP_URL || '');

          fetch(`${baseUrl}/api/emails/confirmacao-agendamento`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              patientName:    notifPatientName,
              patientEmail:   notifPatientEmail,
              patientPhone:   notifPatientPhone,
              therapistName:  therapistRow?.name  || 'Terapeuta TeraNexus',
              therapistEmail: therapistRow?.email || null,
              date:           formattedDate,
              time:           data.time,
              type:           (apt as any).type || 'Regular',
            }),
          }).catch(() => {/* silencioso — email é melhor-esforço */});
        }
      } catch (_emailErr) {
        // Não propaga: email é melhor-esforço
        console.warn('[api.appointments.create] Falha ao disparar email de confirmação:', _emailErr);
      }
      // ──────────────────────────────────────────────────────────────────

      return {
        ...data,
        patientName: data.patients?.name || data.session_data?.patientName || apt.patientName || 'Desconhecido',
        patientEmail: data.patients?.email || data.session_data?.patientEmail,
        patientPhone: data.patients?.phone || data.session_data?.patientPhone,
        patientId: data.patient_id || 'unregistered'
      };
    },

    update: async (id: string, aptData: Partial<Appointment>) => {
      const payload: any = { ...aptData };
      
      if (payload.patientId) { 
          // Similar handling could be added here if needed, but normally updates already have a patientId
          payload.patient_id = payload.patientId === 'unregistered' ? null : payload.patientId; 
          delete payload.patientId; 
      }
      
      if (payload.patientName) { delete payload.patientName; }
      if (payload.patientEmail) { delete payload.patientEmail; }
      if (payload.patientPhone) { delete payload.patientPhone; }
      
      if (payload.sessionData) { 
          payload.session_data = payload.sessionData; 
          delete payload.sessionData; 
      }

      const { data: updated, error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id)
        .select('*, patients(name, email, phone)')
        .single();
      if (error) throw error;
      
      // Auto-sync para contornar falha de trigger no BD com status 'Concluído'
      if (payload.status === 'Concluído' || updated.status === 'Concluído') {
        try {
          await supabase.from('transactions').insert({
            therapist_id: updated.therapist_id,
            patient_id: updated.patient_id,
            appointment_id: updated.id,
            amount: Number(updated.session_data?.price || 0),
            type: 'income',
            status: 'paid',
            category: 'Sessão TRG',
            description: 'Sessão registrada via agenda',
            date: updated.date
          });
        } catch (e) {
          // Ignora se já existir
        }
      }
      
      return {
        ...updated,
        patientName: updated.patients?.name || updated.session_data?.patientName || aptData.patientName || 'Desconhecido',
        patientEmail: updated.patients?.email || updated.session_data?.patientEmail,
        patientPhone: updated.patients?.phone || updated.session_data?.patientPhone,
        patientId: updated.patient_id || 'unregistered'
      };
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // TRANSACTIONS — Single Source of Truth financeiro
  // ─────────────────────────────────────────────────────────────
  transactions: {
    /**
     * Lista transações do terapeuta autenticado.
     * Filtros opcionais: year, month, patient_id, type, status
     */
    list: async (filters?: {
      year?: number;
      month?: number;
      patient_id?: string;
      type?: 'income' | 'expense';
      status?: 'paid' | 'pending';
    }): Promise<Transaction[]> => {
      const therapistId = await getTherapistId();
      if (!therapistId) return [];

      try {
        let query = supabase
          .from('transactions')
          .select('*, patients(name)')
          .eq('therapist_id', therapistId)
          .order('date', { ascending: false });

        if (filters?.patient_id) query = query.eq('patient_id', filters.patient_id);
        if (filters?.type)       query = query.eq('type', filters.type);
        if (filters?.status)     query = query.eq('status', filters.status);
        if (filters?.year) {
          const start = `${filters.year}-01-01`;
          const end   = `${filters.year}-12-31`;
          query = query.gte('date', start).lte('date', end);
        }
        if (filters?.month && filters?.year) {
          const m = String(filters.month).padStart(2, '0');
          const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
          query = query
            .gte('date', `${filters.year}-${m}-01`)
            .lte('date', `${filters.year}-${m}-${daysInMonth}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as Transaction[]) ?? [];
      } catch (err) {
        console.error('transactions.list error:', err);
        return [];
      }
    },

    /**
     * Cria uma nova transação financeira.
     * Retorna a transação criada para atualização imediata do estado local.
     */
    create: async (input: TransactionInput): Promise<Transaction | null> => {
      const therapistId = await getTherapistId();
      if (!therapistId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...input,
          therapist_id: therapistId,
          category: input.category ?? 'Outros',
        })
        .select('*, patients(name)')
        .single();

      if (error) throw error;
      return data as Transaction;
    },

    /**
     * Remove uma transação pelo ID.
     */
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    /**
     * Busca o resumo financeiro via RPC get_financial_summary.
     * Retorna um array de registros mensais (um por mês com dados).
     * Se month for passado, retorna apenas o mês específico.
     */
    summary: async (
      year?: number,
      month?: number
    ): Promise<FinancialSummary[]> => {
      const therapistId = await getTherapistId();
      if (!therapistId) return [];

      try {
        const { data, error } = await supabase.rpc('get_financial_summary', {
          p_therapist_id: therapistId,
          p_year:  year  ?? null,
          p_month: month ?? null,
        });

        if (error) throw error;
        return (data as FinancialSummary[]) ?? [];
      } catch (err) {
        console.error('transactions.summary error:', err);
        return [];
      }
    },

    /**
     * Busca o resumo financeiro de um paciente específico via View.
     */
    patientSummary: async (patientId: string): Promise<PatientFinancialSummary | null> => {
      try {
        const { data, error } = await supabase
          .from('patient_financial_summary')
          .select('*')
          .eq('patient_id', patientId)
          .single();

        if (error) throw error;
        return data as PatientFinancialSummary;
      } catch (err) {
        console.error('transactions.patientSummary error:', err);
        return null;
      }
    },

    /**
     * Sincroniza sessões pagas/concluídas que não geraram transação (Fallback para falha na trigger do DB)
     */
    syncMissing: async (): Promise<void> => {
      const therapistId = await getTherapistId();
      if (!therapistId) return;

      try {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('therapist_id', therapistId)
          .in('status', ['Concluído', 'Concluída', 'completed', 'Realizada']);

        if (!appointments || appointments.length === 0) return;

        const { data: existingTx } = await supabase
          .from('transactions')
          .select('appointment_id')
          .eq('therapist_id', therapistId)
          .not('appointment_id', 'is', null);

        const existingIds = new Set(existingTx?.map((t: any) => t.appointment_id) || []);
        const missing = appointments.filter((a: any) => !existingIds.has(a.id) && a.patient_id);

        if (missing.length > 0) {
          const inserts = missing.map((a: any) => ({
            therapist_id: a.therapist_id,
            patient_id: a.patient_id,
            appointment_id: a.id,
            amount: Number(a.session_data?.price || 0),
            type: 'income',
            status: 'paid',
            category: 'Sessão TRG',
            description: 'Sessão registrada via agenda (sincronizada)',
            date: a.date
          }));
          await supabase.from('transactions').insert(inserts);
        }
      } catch (err) {
        console.error('Error syncing missing transactions:', err);
      }
    },
  },

  blockedTimes: {
    list: async () => {
      try {
        return await apiFetch('/api/blocked-slots');
      } catch (e) { console.warn('Fetch blocked times failed, using local'); }

      const saved = localStorage.getItem('TRG_BLOCKED_TIMES');
      return saved ? JSON.parse(saved) : [];
    },
    create: async (data: any) => {
      let created = await apiFetch('/api/blocked-slots', { method: 'POST', body: JSON.stringify(data) });
      if (!created) {
         const newBlock = { id: crypto.randomUUID(), ...data };
         const saved = localStorage.getItem('TRG_BLOCKED_TIMES');
         const list = saved ? JSON.parse(saved) : [];
         list.push(newBlock);
         localStorage.setItem('TRG_BLOCKED_TIMES', JSON.stringify(list));
         created = newBlock;
      }
      return created;
    },
    delete: async (id: string) => {
      let result = await apiFetch(`/api/blocked-slots?id=${id}`, { method: 'DELETE' });
      if (!result) {
         const saved = localStorage.getItem('TRG_BLOCKED_TIMES');
         if (saved) {
             let list = JSON.parse(saved);
             list = list.filter((b: any) => b.id !== id);
             localStorage.setItem('TRG_BLOCKED_TIMES', JSON.stringify(list));
         }
         result = true;
      }
      return result;
    }
  },

  dashboard: {
    stats: async () => {
      try { return await apiFetch('/api/dashboard/stats'); }
      catch (e) { /* fallback */ }

      await delay(800);
      return {
        activePatients: 24,
        revenue: 12400,
        productivity: 94
      };
    },
    data: async (therapistId: string) => {
      return await apiFetch(`/api/dashboard?therapistId=${therapistId}`);
    }
  },

  config: {
    setServerUrl: (url: string) => localStorage.setItem('TRG_SERVER_URL', url),
    getServerUrl: () => localStorage.getItem('TRG_SERVER_URL') || '',
    isOnline: () => true
  }
};
