
import { Patient, Appointment, NotificationItem } from 'types';

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
  // if (!baseUrl) throw new Error('No Server URL'); // REMOVED: Allow relative paths

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error('API Error');
  return response.json();
};

// --- SIMULATION HELPERS (Latency) ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API MODULES ---

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      // Always try Real Backend first
      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('TRG_AUTH_TOKEN', data.token);
        localStorage.setItem('TRG_AUTH', 'true');
        if (data.therapist) {
          localStorage.setItem('therapist', JSON.stringify(data.therapist));
        }
        return true;
      } catch (e) {
        console.warn('Backend login failed, falling back to local check', e);
      }

      // Local / Supabase Fallback
      console.warn('Backend login failed, attempting direct Supabase Auth...');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!authError && authData.user) {
        localStorage.setItem('TRG_AUTH_TOKEN', 'supabase-session'); // Marker
        localStorage.setItem('TRG_AUTH', 'true');

        // Fetch therapist profile
        const { data: therapist } = await supabase
          .from('therapists')
          .select('*')
          .eq('email', email)
          .single();

        if (therapist) {
          localStorage.setItem('therapist', JSON.stringify(therapist));
        }
        return true;
      }

      // Final Mock Fallback (if offline or wrong credentials)
      await delay(1000);
      if (email === 'admin@teranexus.com' && password.length > 0) {
        localStorage.setItem('TRG_AUTH', 'true');
        return true;
      }
      throw new Error('Credenciais inválidas e falha na conexão');
    },
    logout: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('TRG_AUTH_TOKEN');
      localStorage.removeItem('TRG_AUTH');
    }
  },

  patients: {
    list: async (): Promise<Patient[]> => {
      try {
        return await apiFetch('/api/patients');
      } catch (e) { console.warn('Fetch patients failed, using Supabase direct'); }

      // Supabase Direct Fallback
      try {
        const therapistId = getTherapistId();
        if (therapistId) {
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('therapist_id', therapistId)
            .order('created_at', { ascending: false });

          if (data && !error) return data as Patient[];
        }
      } catch (err) { console.warn('Supabase fetch failed', err); }

      await delay(600);
      const local = localStorage.getItem('TRG_LOCAL_PATIENTS');
      return local ? JSON.parse(local) : MOCK_PATIENTS;
    },

    create: async (patient: Partial<Patient>) => {
      try {
        return await apiFetch('/api/patients', { method: 'POST', body: JSON.stringify(patient) });
      } catch (e) { console.warn('Create patient failed, using local'); }

      const newPatient = { ...patient, id: Date.now().toString() } as Patient;
      const current = await api.patients.list();
      const updated = [newPatient, ...current];
      localStorage.setItem('TRG_LOCAL_PATIENTS', JSON.stringify(updated));
      return newPatient;
    },

    update: async (id: string, data: Partial<Patient>) => {
      try {
        return await apiFetch(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      } catch (e) { console.warn('Update patient failed, using local'); }

      const current = await api.patients.list();
      const updated = current.map(p => p.id === id ? { ...p, ...data } : p);
      localStorage.setItem('TRG_LOCAL_PATIENTS', JSON.stringify(updated));
      return updated.find(p => p.id === id);
    },

    delete: async (id: string) => {
      try {
        return await apiFetch(`/api/patients/${id}`, { method: 'DELETE' });
      } catch (e) { console.warn('Delete patient failed, using local'); }

      const current = await api.patients.list();
      const updated = current.filter(p => p.id !== id);
      localStorage.setItem('TRG_LOCAL_PATIENTS', JSON.stringify(updated));
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
      try {
        await delay(200);
        const therapistId = getTherapistId();
        const query = therapistId ? `?therapistId=${therapistId}` : '';
        return await apiFetch(`/api/appointments${query}`);
      } catch (e) { console.warn('Fetch appointments failed, using Supabase direct'); }

      // Supabase Direct Fallback
      try {
        const therapistId = getTherapistId();
        if (therapistId) {
          const { data, error } = await supabase
            .from('appointments')
            .select('*, patients(name)')
            .eq('therapist_id', therapistId);

          if (data && !error) {
            return data.map((apt: any) => ({
              id: apt.id,
              patientId: apt.patient_id,
              patientName: apt.patients?.name || 'Desconhecido',
              date: apt.date,
              time: apt.time,
              status: apt.status,
              type: apt.type,
              sessionData: apt.session_data
            })) as Appointment[];
          }
        }
      } catch (err) { console.warn('Supabase appointment fetch failed', err); }

      await delay(500);
      return MOCK_APPOINTMENTS;
    },
    create: async (apt: Partial<Appointment>) => {
      try {
        return await apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(apt) });
      } catch (e) { console.warn('Create appointment failed, using local'); }

      const newApt = { id: Date.now().toString(), status: 'Agendado', type: 'Anamnese', ...apt } as Appointment;
      const local = (await api.appointments.list()) as Appointment[];
      const updated = [newApt, ...local];
      localStorage.setItem('TRG_LOCAL_APPOINTMENTS', JSON.stringify(updated));
      return newApt;
    },
    update: async (id: string, data: Partial<Appointment>) => {
      try {
        return await apiFetch(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      } catch (e) { console.warn('Update appointment failed, using local'); }

      const local = (await api.appointments.list()) as Appointment[];
      const updated = local.map(a => a.id === id ? { ...a, ...data } : a);
      localStorage.setItem('TRG_LOCAL_APPOINTMENTS', JSON.stringify(updated));
      return updated.find(a => a.id === id);
    },
    delete: async (id: string) => {
      try {
        return await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
      } catch (e) { console.warn('Delete appointment failed, using local'); }

      const local = (await api.appointments.list()) as Appointment[];
      const updated = local.filter(a => a.id !== id);
      localStorage.setItem('TRG_LOCAL_APPOINTMENTS', JSON.stringify(updated));
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
      try {
        return await apiFetch('/api/blocked-slots', { method: 'POST', body: JSON.stringify(data) });
      } catch (e) {
        console.warn('Create blocked time failed, using local');
        // Fallback to local
        throw new Error('Fallback not implemented for create (use online)');
      }
    },
    delete: async (id: string) => {
      try {
        return await apiFetch(`/api/blocked-slots?id=${id}`, { method: 'DELETE' });
      } catch (e) { console.warn('Delete blocked time failed'); }
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
