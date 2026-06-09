import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Heart, Lock, Video, CheckCircle2, AlertCircle, ArrowRight, Calendar, Clock, User } from 'lucide-react';

const AnjoInvitationPage: React.FC = () => {
    // O parâmetro pode ser um appointmentId (novo fluxo) ou therapistId (legado)
    const { therapistId: paramId } = useParams();
    const navigate = useNavigate();

    const [therapistName, setTherapistName] = useState('Seu Terapeuta');
    const [appointmentDate, setAppointmentDate] = useState<string | null>(null);
    const [appointmentTime, setAppointmentTime] = useState<string | null>(null);
    const [appointmentId, setAppointmentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnjoAppointment, setIsAnjoAppointment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        const detectAndLoad = async () => {
            if (!paramId) { setIsLoading(false); return; }

            // Tenta primeiro como appointmentId (GUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(paramId)) {
                // Verifica se é um agendamento Anjo
                const { data: appt } = await supabase
                    .from('appointments')
                    .select('id, date, time, therapist_id, type, therapists(name)')
                    .eq('id', paramId)
                    .single();

                if (appt && (appt.type === 'Anjo' || appt.session_data?.price === 0)) {
                    setIsAnjoAppointment(true);
                    setAppointmentId(appt.id);
                    setAppointmentDate(appt.date);
                    setAppointmentTime(appt.time);
                    setTherapistName((appt.therapists as any)?.name || 'Seu Terapeuta');
                    setIsLoading(false);
                    return;
                }

                // Pode ser therapistId GUID (fluxo legado)
                const { data: therapist } = await supabase
                    .from('therapists')
                    .select('name')
                    .eq('id', paramId)
                    .single();
                if (therapist) {
                    setTherapistName(therapist.name);
                }
            }
            setIsLoading(false);
        };

        detectAndLoad();
    }, [paramId]);

    const handleAction = async (type: 'register' | 'session') => {
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        try {
            if (type === 'register') {
                setSuccessMsg('Redirecionando para a criação de conta...');
                const destination = appointmentId
                    ? `/portal-paciente/cadastro?appointmentId=${appointmentId}`
                    : '/portal-paciente/cadastro';
                setTimeout(() => navigate(destination), 1200);
            } else {
                setSuccessMsg('Encontrando sua sala... Redirecionando...');
                const destination = appointmentId
                    ? `/sessao-cliente/${appointmentId}`
                    : `/sessao-cliente/${therapistId}`;
                setTimeout(() => { window.location.href = destination; }, 1200);
            }
        } catch (err: any) {
            console.error(err);
            setError('Erro ao processar a solicitação. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20">
                        <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">
                        Tera<span className="text-primary-500">Nexus</span>
                    </span>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-rose-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <Heart size={32} fill="currentColor" className="animate-pulse" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                        Atendimento Anjo
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 leading-relaxed">
                        Você recebeu um convite para atendimento gratuito com o terapeuta{' '}
                        <strong className="text-slate-700 dark:text-slate-200">{therapistName}</strong>.
                    </p>

                    {/* Detalhes da sessão */}
                    {isAnjoAppointment && appointmentDate && appointmentTime && (
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 mb-6 space-y-2">
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Sua Sessão</p>
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <Calendar size={15} className="text-rose-400" />
                                <span className="capitalize">{formatDate(appointmentDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <Clock size={15} className="text-rose-400" />
                                <span>{appointmentTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <User size={15} className="text-rose-400" />
                                <span>{therapistName}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-5">
                        {error && (
                            <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-3.5 rounded-xl border border-red-100 dark:border-red-900/20">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div className="flex items-start gap-2 text-green-600 text-xs bg-green-50 dark:bg-green-900/10 p-3.5 rounded-xl border border-green-100 dark:border-green-900/20">
                                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {!successMsg && (
                            <div className="pt-2 space-y-3">
                                {/* Opção 1: Criar conta - acesso completo */}
                                <button
                                    onClick={() => handleAction('register')}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    <Lock size={16} />
                                    Criar Conta e Acessar Tudo
                                    <ArrowRight size={16} className="ml-1" />
                                </button>

                                {/* Opção 2: Entrar diretamente na sessão */}
                                <button
                                    onClick={() => handleAction('session')}
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    <Video size={16} />
                                    Entrar Direto na Sessão
                                </button>

                                {/* Opção 3: banner sutil - cadastrar depois */}
                                <div className="pt-2 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Entrou na sessão sem conta?</p>
                                    <Link
                                        to={appointmentId
                                            ? `/portal-paciente/cadastro?appointmentId=${appointmentId}`
                                            : '/portal-paciente/cadastro'}
                                        className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline"
                                    >
                                        Cadastre-se depois para acessar o portal completo →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnjoInvitationPage;
