import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Network, ArrowDownRight, ArrowUpRight, CheckCircle2, XCircle, Clock, MessageCircle, ExternalLink, Loader2 } from 'lucide-react';

interface Referral {
    id: string;
    created_at: string;
    source_therapist_id: string;
    target_therapist_id: string;
    patient_name: string;
    patient_contact: string;
    patient_needs?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'booked';
    session_price?: number;
    commission_amount?: number;
    source_therapist?: { name: string; email: string };
    target_therapist?: { name: string; email: string };
}

const NetworkView: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReferrals = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // First attempt with joins (if foreign keys are properly set up)
            const { data, error } = await supabase
                .from('referrals')
                .select(`
                    *,
                    source_therapist:therapist_profiles!source_therapist_id(name, email),
                    target_therapist:therapist_profiles!target_therapist_id(name, email)
                `)
                .or(`source_therapist_id.eq.${user.id},target_therapist_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                // Try simpler query if join fails
                console.warn("Join failed, trying simple query", error);
                const { data: simpleData, error: simpleError } = await supabase
                    .from('referrals')
                    .select('*')
                    .or(`source_therapist_id.eq.${user.id},target_therapist_id.eq.${user.id}`)
                    .order('created_at', { ascending: false });
                
                if (!simpleError && simpleData) {
                    setReferrals(simpleData as unknown as Referral[]);
                } else {
                     console.error("Simple query also failed", simpleError);
                }
            } else if (data) {
                setReferrals(data as unknown as Referral[]);
            }
        } catch (err) {
            console.error('Error fetching referrals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('referrals')
                .update({ status: newStatus })
                .eq('id', id);

            if (!error) {
                loadReferrals();
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleWhatsApp = (contact: string, name: string) => {
        const phone = contact.replace(/\D/g, '');
        if (phone.length < 10) return alert('Número inválido');
        const message = `Olá ${name}, recebi sua indicação através da rede de transbordo TeraNexus. Como posso ajudar?`;
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
        
        // Auto accept if pending
        const ref = referrals.find(r => r.patient_contact === contact);
        if (ref && ref.status === 'pending') {
            handleUpdateStatus(ref.id, 'accepted');
        }
    };

    const receivedReferrals = referrals.filter(r => r.target_therapist_id === user?.id);
    const sentReferrals = referrals.filter(r => r.source_therapist_id === user?.id);

    const displayedReferrals = activeTab === 'received' ? receivedReferrals : sentReferrals;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Network size={32} />
                        Painel de Transbordo
                    </h2>
                    <p className="text-indigo-100 max-w-xl">
                        Gerencie as indicações recebidas e enviadas. Pacientes transbordados por agenda lotada aparecem aqui.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center flex-1 md:flex-none">
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Recebidas</p>
                        <p className="text-2xl font-bold">{receivedReferrals.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center flex-1 md:flex-none">
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Enviadas</p>
                        <p className="text-2xl font-bold">{sentReferrals.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                            activeTab === 'received' 
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <ArrowDownRight size={18} />
                        Indicações Recebidas
                        {receivedReferrals.filter(r => r.status === 'pending').length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                {receivedReferrals.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                            activeTab === 'sent' 
                            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/10' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <ArrowUpRight size={18} />
                        Indicações Enviadas
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : displayedReferrals.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Network size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Nenhuma indicação</h3>
                            <p className="text-slate-500">
                                {activeTab === 'received' 
                                    ? 'Você ainda não recebeu indicações pela rede de transbordo.' 
                                    : 'Você ainda não enviou pacientes para outros terapeutas.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {displayedReferrals.map(ref => (
                                <div key={ref.id} className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                                    ref.status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                }`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-white">
                                                {ref.patient_name}
                                            </h4>
                                            {ref.status === 'pending' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded"><Clock size={12}/> Pendente</span>}
                                            {ref.status === 'accepted' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded"><CheckCircle2 size={12}/> Em Contato</span>}
                                            {ref.status === 'rejected' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded"><XCircle size={12}/> Recusado</span>}
                                            {ref.status === 'booked' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded"><CheckCircle2 size={12}/> Fechado</span>}
                                        </div>
                                        
                                        <p className="text-sm text-slate-500 mb-2">
                                            {activeTab === 'received' 
                                                ? `Enviado por: ${ref.source_therapist?.name || 'Terapeuta Parceiro'}`
                                                : `Enviado para: ${ref.target_therapist?.name || 'Terapeuta Parceiro'}`
                                            }
                                        </p>

                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                            <span>{new Date(ref.created_at).toLocaleDateString('pt-BR')}</span>
                                            {ref.patient_needs && <span>• {ref.patient_needs}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        {activeTab === 'received' ? (
                                            <>
                                                {ref.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(ref.id, 'rejected')}
                                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        Recusar
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleWhatsApp(ref.patient_contact, ref.patient_name)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                                                >
                                                    <MessageCircle size={16} />
                                                    Chamar Paciente
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm text-slate-500 mr-2">Status:</span>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                                    ref.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    ref.status === 'accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    ref.status === 'booked' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {ref.status === 'pending' ? 'Aguardando Parceiro' :
                                                     ref.status === 'accepted' ? 'Em Negociação' :
                                                     ref.status === 'booked' ? 'Fechado' : 'Recusado'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkView;
