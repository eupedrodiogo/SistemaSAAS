import React, { useState } from 'react';
import { X, User, Mail, Phone, Link as LinkIcon, Copy, MessageCircle, Check, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    therapistId: string;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onSuccess, therapistId }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const bookingLink = `${window.location.origin}/agendar/${therapistId}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('patients')
                .insert([{
                    name,
                    email,
                    phone,
                    therapist_id: therapistId,
                    status: 'Ativo', // Default status
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
            setName('');
            setEmail('');
            setPhone('');
            alert('Paciente cadastrado com sucesso!');

        } catch (error) {
            console.error('Error adding patient:', error);
            alert('Erro ao cadastrar paciente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(bookingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const text = `Olá! Clique no link abaixo para agendar sua sessão: ${bookingLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            {/* Modal Container: Much larger max-width */}
            <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col md:flex-row h-auto md:h-[600px]">

                {/* Close Button (Mobile Only / Top Right Absolute) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors md:hidden"
                >
                    <X size={20} className="text-slate-500 dark:text-slate-300" />
                </button>

                {/* LEFT COLUMN: Strategic Link (Hero Section) */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex flex-col relative overflow-hidden text-white">
                    {/* Background patterns */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-6 border border-white/20">
                            <Sparkles size={14} className="text-yellow-300" />
                            <span className="text-xs font-bold uppercase tracking-wider">Recomendado</span>
                        </div>

                        <h2 className="text-3xl font-bold mb-4 leading-tight">
                            Agilize seu <br /> Atendimento
                        </h2>
                        <p className="text-indigo-100 mb-8 text-sm leading-relaxed opacity-90">
                            Envie o link de agendamento para o paciente. Ele preenche os dados cadastro e escolhe o horário sozinho.
                        </p>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                            <p className="text-xs font-bold text-indigo-200 uppercase mb-2">Seu Link Pessoal</p>
                            <div className="bg-black/20 rounded-lg p-3 text-sm font-mono truncate text-indigo-100 select-all mb-4 border border-indigo-500/30">
                                {bookingLink}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center justify-center gap-2 py-3 bg-white text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10 active:scale-95"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-lg font-bold hover:bg-[#20bd5a] transition-colors shadow-lg shadow-green-900/20 active:scale-95 border border-white/10"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-center">
                        <p className="text-xs text-indigo-200/60">
                            O paciente receberá uma confirmação automática após o agendamento.
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN: Manual Form */}
                <div className="w-full md:w-7/12 bg-white dark:bg-slate-900 flex flex-col">
                    <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <User className="text-slate-400" size={24} />
                            Cadastro Manual
                        </h3>
                        <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                        placeholder="Nome do Paciente"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Whatsapp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Email <span className="font-normal lowercase opacity-70">(opcional)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                        placeholder="ana@email.com"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg shadow-slate-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                                    {loading ? 'Cadastrando...' : 'Cadastrar Manualmente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPatientModal;
