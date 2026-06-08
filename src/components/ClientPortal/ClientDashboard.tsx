import React, { useState, useEffect } from 'react';
import ClientLayout from './ClientLayout';
import { Link } from 'react-router-dom';
import { Clock, Video, Calendar, ArrowRight, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { useClientData } from './ClientContext';
import NotificationBell from '../NotificationBell';
import AnamnesisPopup from './AnamnesisPopup';

const ClientDashboard: React.FC = () => {
    const { patient, appointments, error, loading } = useClientData();
    const [showAnamnesisPopup, setShowAnamnesisPopup] = useState(false);

    useEffect(() => {
        if (!patient || loading) return;
        
        // Verifica se a anamnese já foi preenchida
        // Lógica: se o paciente tem notas de anamnese preenchidas E o usuário não dispensou o aviso nesta sessão
        const isCompleted = localStorage.getItem('anamnese_completed') === 'true' || (patient.notes && patient.notes.includes('Transtornos:'));
        const isDismissedSession = sessionStorage.getItem('anamnese_dismissed_session') === 'true';

        if (!isCompleted && !isDismissedSession) {
            setShowAnamnesisPopup(true);
        }
    }, [patient, loading]);

    const nextAppointment = appointments.find(appt => ['agendado', 'scheduled', 'pending_payment', 'active', 'ativo'].includes(appt.status?.toLowerCase() || ''));
    const completedCount = appointments.filter(appt => ['concluído', 'completed'].includes(appt.status?.toLowerCase() || '')).length;

    return (
        <ClientLayout activePage="dashboard">
            <AnamnesisPopup 
                isOpen={showAnamnesisPopup} 
                onClose={() => {
                    sessionStorage.setItem('anamnese_dismissed_session', 'true');
                    setShowAnamnesisPopup(false);
                }} 
            />
            <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Header & Quick Actions */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex items-start justify-between w-full lg:w-auto">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Painel do Cliente</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1">
                                Olá, {patient?.name?.split(' ')[0] || 'Cliente'}. Bem-vindo ao seu espaço.
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="flex items-center gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
                        <Link to="/agendar" className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-primary-600/20 hover:bg-primary-700 dark:hover:bg-primary-700 transition-all active:scale-95 whitespace-nowrap">
                            <Calendar size={18} />
                            <span className="font-bold text-sm">Novo Agendamento</span>
                        </Link>

                        <NotificationBell
                            role="client"
                            className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative group flex items-center justify-center"
                        />
                    </div>
                </div>

                {/* KPI Cards / Quick Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Next Session Card (Takes 2 slots on large screens if needed, or just 1) */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group sm:col-span-2 relative overflow-hidden">
                        {nextAppointment ? (
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl text-white shadow-lg shadow-opacity-20 bg-primary-500 group-hover:scale-110 transition-transform">
                                        <Clock size={22} />
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider">
                                        Confirmado
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{nextAppointment.time}</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                    {new Date(nextAppointment.date + (nextAppointment.date.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>

                                <div className="flex items-center justify-between mt-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {patient?.therapist_name?.charAt(0) || 'T'}
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{patient?.therapist_name || 'Seu Terapeuta'}</span>
                                    </div>
                                    <Link
                                        to={`/sessao-cliente/${nextAppointment.id}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/10"
                                    >
                                        <Video size={16} />
                                        Entrar
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl text-white shadow-lg shadow-opacity-20 bg-slate-400 group-hover:scale-110 transition-transform">
                                        <Calendar size={22} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Sem agendamentos</h3>
                                    <p className="text-xs text-slate-400">Marque sua próxima sessão para continuar.</p>
                                </div>
                                <div className="mt-4">
                                    <Link to="/agendar" className="text-sm font-bold text-primary-600 hover:underline">Agendar agora &rarr;</Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Completed Sessions */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl text-white shadow-lg shadow-opacity-20 bg-emerald-500 group-hover:scale-110 transition-transform">
                                <CheckCircle size={22} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{completedCount}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sessões Realizadas</p>
                        <p className="text-xs text-slate-400 mt-1">Total acumulado</p>
                    </div>

                    {/* Resources Link */}
                    <a href="/portal-paciente/recursos" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl text-white shadow-lg shadow-opacity-20 bg-amber-500 group-hover:scale-110 transition-transform">
                                <AlertCircle size={22} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Mecanismo</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">De Segurança</p>
                        <p className="text-xs text-slate-400 mt-1">Acesse recursos de apoio</p>
                    </a>
                </div>

                {/* Recent Activity / Placeholder for future content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col max-h-[500px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Sua Jornada (Histórico de Sessões)</h3>
                            <span className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2.5 py-1 rounded-full font-bold">
                                {appointments.filter(a => ['concluído', 'completed'].includes(a.status?.toLowerCase() || '') && a.sessionData?.clinicalRecord).length} registros
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {appointments.filter(a => ['concluído', 'completed'].includes(a.status?.toLowerCase() || '') && a.sessionData?.clinicalRecord).length === 0 ? (
                                <div className="h-[200px] w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <PlayCircle size={48} className="mb-2 opacity-20" />
                                    <p className="text-sm">Seu histórico de evolução aparecerá aqui após as sessões.</p>
                                </div>
                            ) : (
                                appointments
                                    .filter(a => ['concluído', 'completed'].includes(a.status?.toLowerCase() || '') && a.sessionData?.clinicalRecord)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(appt => {
                                        const record = appt.sessionData.clinicalRecord;
                                        const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
                                        const sudEntries = Object.entries(record.sudLevels || {}).filter(([,v]) => (v as number) > 0);
                                        
                                        return (
                                            <div key={appt.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-700 dark:text-slate-200">Sessão #{record.sessionNumber || 'N/A'}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {new Date(appt.date + (appt.date.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 justify-end">
                                                            <Clock size={12} /> {fmt(record.durationSeconds || 0)}
                                                        </span>
                                                        {record.ageRange && (
                                                            <span className="text-xs text-primary-500 font-medium block mt-1">{record.ageRange}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {sudEntries.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Seus Indicadores SUD</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {sudEntries.map(([fase, val]) => (
                                                                <div key={fase} className="flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                                                    <span className="text-xs text-slate-500 capitalize">{fase.replace('Cronologico', ' Cronológico').replace('fisico', 'Físico').replace('mental', 'Mental')}</span>
                                                                    <span className={`text-sm font-bold ${(val as number) >= 7 ? 'text-red-500' : (val as number) >= 4 ? 'text-amber-500' : 'text-emerald-500'}`}>{val as number}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-2xl shadow-lg text-white">
                        <h3 className="font-bold text-lg mb-2">Precisa de ajuda?</h3>
                        <p className="text-primary-100 text-sm mb-6">
                            Entre em contato com o suporte ou fale diretamente com seu terapeuta se tiver dúvidas urgentes.
                        </p>
                        <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-colors backdrop-blur-sm">
                            Falar com Suporte
                        </button>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};

export default ClientDashboard;
