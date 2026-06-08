import React, { useState } from 'react';
import ClientLayout from './ClientLayout';
import { useNavigate } from 'react-router-dom';
import { useClientData } from './ClientContext';
import AnamnesisStep from '../PatientBooking/steps/AnamnesisStep';
import { ClientIntakeData } from '../../../../types';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

const ClientAnamnesis: React.FC = () => {
    const navigate = useNavigate();
    const { patient, refreshData } = useClientData();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Initialize data with existing patient details if available
    const [data, setData] = useState<ClientIntakeData>({
        nome: patient?.name || '',
        email: patient?.email || '',
        celular: patient?.phone || '',
        complaint: '',
        transtornos: [],
        doresFisicas: [],
        temasFuturo: []
    });

    const handleUpdate = (newData: ClientIntakeData) => {
        setData(newData);
    };

    const handleBack = () => {
        navigate('/portal-paciente/dashboard');
    };

    const handleNext = async () => {
        setIsLoading(true);
        try {
            const patientId = localStorage.getItem('client_portal_id');
            const response = await fetch(`/api/client-portal?action=save_anamnesis&patientId=${patientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                localStorage.setItem('anamnese_completed', 'true');
                setIsSuccess(true);
                refreshData(); // atualiza o contexto para não pedir mais a anamnese
            } else {
                alert('Ocorreu um erro ao salvar a anamnese. Tente novamente.');
            }
        } catch (e) {
            console.error(e);
            alert('Erro de conexão ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <ClientLayout activePage="anamnese">
                <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Anamnese Concluída!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Sua ficha foi enviada com sucesso para o seu terapeuta. Agradecemos o preenchimento, isso ajudará muito na sua próxima sessão.
                    </p>
                    <button 
                        onClick={() => navigate('/portal-paciente/dashboard')}
                        className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all"
                    >
                        Voltar para o Painel
                    </button>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout activePage="anamnese">
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0">
                <div className="flex items-center gap-4 mb-2">
                    <button 
                        onClick={handleBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ficha de Anamnese</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Preencha seus dados para que possamos entender melhor sua necessidade.</p>
                    </div>
                </div>

                {/* Container que usa a mesma estrutura do AnamnesisStep */}
                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-primary-600">Salvando ficha...</p>
                        </div>
                    )}
                    <AnamnesisStep 
                        data={data} 
                        onUpdate={handleUpdate} 
                        onNext={handleNext} 
                        onBack={handleBack} 
                    />
                </div>
            </div>
        </ClientLayout>
    );
};

export default ClientAnamnesis;
