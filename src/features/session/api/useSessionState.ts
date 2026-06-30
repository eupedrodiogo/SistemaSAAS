import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { ClientIntakeData } from 'types';
import { useAuth } from '../../../contexts/AuthContext';

export function useSessionState(paramAppId: string | undefined) {
  const { session } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [sessionData, setSessionData] = useState<any>({});
  const [appointmentObj, setAppointmentObj] = useState<any>(null);
  const [intakeData, setIntakeData] = useState<ClientIntakeData | null>(null);
  const [sessionNumber, setSessionNumber] = useState(1);
  const sessionDataRef = useRef<any>({});

  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await api.patients.list();
        setPatients(data);

        const tryParseAnamneseJSON = (raw: any): ClientIntakeData | null => {
          if (!raw) return null;
          if (typeof raw === 'object') return { ...raw, transtornos: raw.transtornos || [], doresFisicas: raw.doresFisicas || [], temasFuturo: raw.temasFuturo || [] } as ClientIntakeData;
          if (typeof raw !== 'string') return null;
          const trimmed = raw.trim();
          if (!trimmed.startsWith('{')) return null;
          try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'object' && parsed !== null) return { ...parsed, transtornos: parsed.transtornos || [], doresFisicas: parsed.doresFisicas || [], temasFuturo: parsed.temasFuturo || [] } as ClientIntakeData;
          } catch (_) {}
          return null;
        };

        const localAppId = localStorage.getItem('TRG_CURRENT_APPOINTMENT_ID');
        const targetAppointmentId = paramAppId || localAppId;

        const loadFallbackPatient = (pId: string) => {
          setSelectedPatientId(pId);
          const p = data.find((pat: any) => pat.id === pId);
          if (p) {
            const parsed = tryParseAnamneseJSON(p.notes);
            if (parsed) {
              setIntakeData({ nome: parsed.nome || p.name, email: parsed.email || p.email, celular: parsed.celular || p.phone || '', ...parsed });
            } else {
              setIntakeData({ nome: p.name, email: p.email, complaint: p.notes || 'Anamnese não preenchida.', transtornos: [], doresFisicas: [], temasFuturo: [] } as any);
            }
          }
        };

        if (targetAppointmentId) {
          const appointment = await api.appointments.get(targetAppointmentId);
          if (appointment) {
            setAppointmentObj(appointment);
            const patientId = appointment.patientId;
            if (patientId) setSelectedPatientId(patientId);

            const lsKey = `TRG_SESSION_DATA_${targetAppointmentId}`;
            if (appointment.sessionData && Object.keys(appointment.sessionData).length > 0) {
              setSessionData(appointment.sessionData);
              localStorage.setItem(lsKey, JSON.stringify(appointment.sessionData));
            } else {
              const cached = localStorage.getItem(lsKey);
              if (cached) { try { setSessionData(JSON.parse(cached)); } catch (_) {} }
            }

            let loaded = false;
            if (patientId) {
              const patientRecord = data.find((p: any) => p.id === patientId);
              const fromPatientNotes = tryParseAnamneseJSON(patientRecord?.notes);
              if (fromPatientNotes) {
                setIntakeData({ nome: fromPatientNotes.nome || patientRecord?.name || appointment.patientName, email: fromPatientNotes.email || patientRecord?.email || '', celular: fromPatientNotes.celular || patientRecord?.phone || '', ...fromPatientNotes });
                loaded = true;
              }
            }

            if (!loaded && appointment.notes) {
              const fromApptNotes = tryParseAnamneseJSON(typeof appointment.notes === 'string' ? appointment.notes : JSON.stringify(appointment.notes));
              if (fromApptNotes) {
                setIntakeData({ nome: fromApptNotes.nome || appointment.patientName, email: fromApptNotes.email || '', ...fromApptNotes });
                loaded = true;
              }
            }

            if (!loaded) {
              const rawNotes = appointment.notes || (data.find((p: any) => p.id === patientId)?.notes) || '';
              setIntakeData({ nome: appointment.patientName, email: appointment.patient?.email || '', complaint: typeof rawNotes === 'string' ? rawNotes : 'Anamnese não preenchida.', transtornos: [], doresFisicas: [], temasFuturo: [] } as ClientIntakeData);
            }
          } else {
            const savedPatientId = localStorage.getItem('TRG_CURRENT_PATIENT_ID');
            if (savedPatientId) loadFallbackPatient(savedPatientId);
          }
        } else {
          const savedPatientId = localStorage.getItem('TRG_CURRENT_PATIENT_ID');
          if (savedPatientId) loadFallbackPatient(savedPatientId);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };
    fetchPatients();
  }, [paramAppId, session]);

  useEffect(() => {
    if (selectedPatientId) {
      api.appointments.list().then(apps => {
        const activeAppId = appointmentObj?.id;
        const completed = apps.filter(a => a.patientId === selectedPatientId && (a.status === 'Concluído' || a.status === 'completed') && a.sessionData?.clinicalRecord && a.id !== activeAppId);
        setSessionNumber(completed.length + 1);
      }).catch(() => setSessionNumber(1));
    }
  }, [selectedPatientId, appointmentObj?.id]);

  const saveSessionData = async (newData: any, isEndingSession: boolean = false, sendSyncData?: any) => {
    setSessionData(newData);
    if (sendSyncData) {
      if (isEndingSession) sendSyncData({ type: 'SESSION_ENDED' });
      else sendSyncData({ type: 'SESSION_DATA_UPDATE', payload: newData });
    }

    const activeAppId = appointmentObj?.id;
    if (activeAppId) localStorage.setItem(`TRG_SESSION_DATA_${activeAppId}`, JSON.stringify(newData));

    try {
      if (!activeAppId || !selectedPatientId) return;
      const token = session?.access_token;
      if (!token) return;

      const payload = { ...appointmentObj, sessionData: newData };
      if (isEndingSession) payload.status = 'Concluído';

      await fetch(`/api/appointments?id=${activeAppId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to save session data", e);
    }
  };

  const handleManualPatientSelect = (pId: string) => {
    setSelectedPatientId(pId);
    localStorage.setItem('TRG_CURRENT_PATIENT_ID', pId);
    setAppointmentObj(null);
    localStorage.removeItem('TRG_CURRENT_APPOINTMENT_ID');

    const p = patients.find(pat => pat.id === pId);
    if (p) {
      setIntakeData({ nome: p.name, email: p.email || '', celular: p.phone || '', complaint: typeof p.notes === 'string' ? p.notes : 'Anamnese não preenchida.', transtornos: [], doresFisicas: [], temasFuturo: [] } as ClientIntakeData);
    }
  };

  return {
    patients,
    selectedPatientId,
    appointmentObj,
    sessionData,
    intakeData,
    sessionNumber,
    sessionDataRef,
    setSessionData,
    setSessionNumber,
    handleManualPatientSelect,
    saveSessionData,
    setIntakeData
  };
}
