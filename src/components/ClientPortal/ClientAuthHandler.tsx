import React, { useEffect } from 'react';

const ClientAuthHandler: React.FC = () => {
    useEffect(() => {
        // Extract ID from URL: /portal-paciente/autenticar/:id
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        // Validate if it's a UUID (not "autenticar" or other route names)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart);
        const patientId = isValidUUID ? lastPart : null;

        if (patientId) {
            // Save session
            localStorage.setItem('client_portal_id', patientId);

            // Redirect to dashboard (clean URL)
            window.location.href = '/portal-paciente/dashboard';
        } else {
            // Check if there's already a stored ID in localStorage
            const storedId = localStorage.getItem('client_portal_id');
            if (storedId) {
                window.location.href = '/portal-paciente/dashboard';
            } else {
                // Error or invalid link - redirect to login
                window.location.href = '/portal-paciente/login';
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">Autenticando...</p>
            </div>
        </div>
    );
};

export default ClientAuthHandler;
