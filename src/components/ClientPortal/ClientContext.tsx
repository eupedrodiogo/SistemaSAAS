import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ClientContextType {
    patient: any | null;
    appointments: any[];
    loading: boolean;
    error: string | null;
    refreshData: () => void;
}

const ClientContext = createContext<ClientContextType>({
    patient: null,
    appointments: [],
    loading: true,
    error: null,
    refreshData: () => { }
});

export const useClientData = () => useContext(ClientContext);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [patient, setPatient] = useState<any | null>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        const patientId = localStorage.getItem('client_portal_id');

        if (!patientId) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/client-portal?action=data&patientId=${patientId}`);
            const data = await response.json();

            if (response.ok) {
                setPatient(data.patient);
                setAppointments(data.appointments);
            } else {
                setPatient(null);
                setAppointments([]);
                setError(data.error || 'Erro ao carregar dados.');
                localStorage.removeItem('client_portal_id'); // Clear invalid session
            }
        } catch (err: any) {
            console.error(err);
            setError('Erro de conexão.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Polling silencioso de 10s apenas na tela de sessão
    // Garante que os dados do banco apareçam mesmo após reload ou quando P2P cair
    useEffect(() => {
        const isSessionPage = window.location.pathname.includes('/session');
        if (!isSessionPage) return;

        pollingRef.current = setInterval(() => {
            fetchData(true); // silent = true: não mostra loading spinner
        }, 10_000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchData]);

    return (
        <ClientContext.Provider value={{ patient, appointments, loading, error, refreshData: () => fetchData() }}>
            {children}
        </ClientContext.Provider>
    );
};
