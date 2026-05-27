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
        const [patientsRes, summaryRes] = await Promise.all([
          supabase
            .from('patients')
            .select('*')
            .eq('therapist_id', therapistId)
            .order('created_at', { ascending: false }),
          supabase
            .from('patient_financial_summary')
            .select('patient_id, total_invested, pending_amount')
            .eq('therapist_id', therapistId),
        ]);

        if (patientsRes.error) throw patientsRes.error;

        const financialMap = new Map<string, { total_invested: number; pending_amount: number }>(
          (summaryRes.data ?? []).map((s: PatientFinancialSummary) => [
            s.patient_id,
            { total_invested: Number(s.total_invested), pending_amount: Number(s.pending_amount) }
          ])
        );

        return (patientsRes.data ?? []).map((p: Patient) => ({
          ...p,
          total_invested: financialMap.get(p.id)?.total_invested ?? 0,
          pending_amount: financialMap.get(p.id)?.pending_amount ?? 0,
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

        // Monta timeline combinada (sessões + financeiro)
        const timeline = [
          ...appointments.map((a: any) => ({
            id: a.id,
            type: 'session',
            date: a.date,
            title: `Sessão — ${a.type || 'TRG'}`,
            desc: a.notes || a.session_data?.notes || 'Sem anotações',
            sessionData: a,
          })),
          ...transactions
            .filter((t: Transaction) => t.type === 'income')
            .map((t: Transaction) => ({
              id: t.id,
              type: 'financial',
              date: t.date,
              title: `Pagamento — ${t.category}`,
              desc: `R$ ${Number(t.amount).toFixed(2)} · ${t.status === 'paid' ? 'Pago' : 'Pendente'}`,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          .select('*, patients(name)')
          .eq('therapist_id', therapistId)
          .order('date', { ascending: true });
        
        if (error) throw error;
        
        return (data || []).map((row: any) => ({
          ...row,
          patientName: row.patients?.name || row.patient_name || 'Desconhecido',
          patientId: row.patient_id
        })) ?? MOCK_APPOINTMENTS;
      } catch (err: any) {
        return MOCK_APPOINTMENTS;
      }
    },
    create: async (apt: Partial<Appointment>) => {
      const therapistId = await getTherapistId();
      if (!therapistId) throw new Error('Not authenticated');
      
      const payload: any = { ...apt, therapist_id: therapistId };
      if (payload.patientId) { payload.patient_id = payload.patientId; delete payload.patientId; }
      if (payload.patientName) { delete payload.patientName; }
      if (payload.sessionData) { payload.session_data = payload.sessionData; delete payload.sessionData; }

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select('*, patients(name)')
        .single();
      if (error) throw error;
      
      return {
        ...data,
        patientName: data.patients?.name || apt.patientName || 'Desconhecido',
        patientId: data.patient_id
      };
    },
    update: async (id: string, aptData: Partial<Appointment>) => {
      const payload: any = { ...aptData };
      if (payload.patientId) { payload.patient_id = payload.patientId; delete payload.patientId; }
      if (payload.patientName) { delete payload.patientName; }
      if (payload.sessionData) { payload.session_data = payload.sessionData; delete payload.sessionData; }

      const { data: updated, error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id)
        .select('*, patients(name)')
        .single();
      if (error) throw error;
      
      return {
        ...updated,
        patientName: updated.patients?.name || aptData.patientName || 'Desconhecido',
        patientId: updated.patient_id
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
      return await apiFetch('/api/blocked-slots', { method: 'POST', body: JSON.stringify(data) });
    },
    delete: async (id: string) => {
      return await apiFetch(`/api/blocked-slots?id=${id}`, { method: 'DELETE' });
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
