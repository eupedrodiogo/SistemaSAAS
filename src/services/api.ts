import { Patient, Appointment, NotificationItem } from '../../types';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_STATS } from '../constants';
import { supabase } from '../lib/supabase';

/**
 * TeraNexus API SERVICE
 * 
 * This service handles data fetching. It uses a "Hybrid Strategy":
 * 1. Checks if a SERVER_URL is configured in settings.
 * 2. If yes, it tries to fetch from the real backend.
 * 3. If no (or if offline), it falls back to localStorage/Mock data.
 */

const getBaseUrl = () => {
  // In production (Vercel), relative paths work automatically with rewrites.
  // In local development, we need a proxy or use 'vercel dev'.
  const stored = localStorage.getItem('TRG_SERVER_URL');
  return stored || '';
};
const getToken = () => localStorage.getItem('TRG_AUTH_TOKEN');
const getTherapistId = () => {
  const stored = localStorage.getItem('therapist');
  if (stored) return JSON.parse(stored).id;
  return null;
};

// Helper for standard fetch with Auth
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const token = getToken();

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

// --- SIMULATION HELPERS (Latency) ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API MODULES ---

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.setItem('TRG_AUTH', 'true');

      // Busca perfil do terapeuta no Supabase
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
      const therapistId = getTherapistId();
      if (!therapistId) return MOCK_PATIENTS;

      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('therapist_id', therapistId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data as Patient[]) ?? MOCK_PATIENTS;
      } catch (err) {
        console.warn('Supabase patients fetch failed', err);
        return MOCK_PATIENTS;
      }
    },

    create: async (patient: Partial<Patient>) => {
      const therapistId = getTherapistId();
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
      return await apiFetch(`/api/patient-details?patientId=${id}`);
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
      const therapistId = getTherapistId();
      if (!therapistId) return MOCK_APPOINTMENTS;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('therapist_id', therapistId)
          .order('date', { ascending: true });
        if (error) throw error;
        return data ?? MOCK_APPOINTMENTS;
      } catch (err) {
        console.warn('Supabase appointments fetch failed', err);
        return MOCK_APPOINTMENTS;
      }
    },
    create: async (apt: Partial<Appointment>) => {
      const therapistId = getTherapistId();
      if (!therapistId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...apt, therapist_id: therapistId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, data: Partial<Appointment>) => {
      const { data: updated, error } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
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
    isOnline: () => true // Always assume online capability to try fetch
  }
};
