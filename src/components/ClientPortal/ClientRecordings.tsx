import React from 'react';
import ClientLayout from './ClientLayout';
import { useClientData } from './ClientContext';
import RecordingGallery from '../Shared/RecordingGallery';

const ClientRecordings: React.FC = () => {
    const { patient } = useClientData();

    return (
        <ClientLayout activePage="recordings">
            <div className="p-6 md:p-8 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Minhas Gravações</h1>
                    <p className="text-slate-400">Acesse o histórico das suas sessões gravadas.</p>
                </div>

                {patient ? (
                    <RecordingGallery patientId={patient.id} userType="client" />
                ) : (
                    <div className="text-center text-slate-500 py-12">
                        Carregando informações do cliente...
                    </div>
                )}
            </div>
        </ClientLayout>
    );
};

export default ClientRecordings;
