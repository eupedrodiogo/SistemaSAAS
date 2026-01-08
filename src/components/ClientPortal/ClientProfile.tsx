import React from 'react';
import ClientLayout from './ClientLayout';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { useClientData } from './ClientContext';

const ClientProfile: React.FC = () => {
    const { patient } = useClientData();

    return (
        <ClientLayout activePage="profile">
            <div className="max-w-2xl">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Meu Perfil</h1>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                            <User size={40} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{patient?.name}</h2>
                            <p className="text-slate-500">Cadastrado em {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Mail size={18} className="text-slate-400" />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{patient?.email}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Phone size={18} className="text-slate-400" />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{patient?.phone}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endereço</label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <MapPin size={18} className="text-slate-400" />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Não informado</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors">
                            Editar Dados
                        </button>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};

export default ClientProfile;
