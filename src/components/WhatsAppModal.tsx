
import React, { useState } from 'react';
import { X, MessageCircle, Send, CheckCircle2, User, Calendar, Clock } from 'lucide-react';
import { Patient } from 'types';

interface WhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    therapistName: string;
}

type TemplateType = 'WELCOME' | 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLATION' | 'SESSION_REMINDER_15MIN' | 'HELLO_WORLD';

export default function WhatsAppModal({ isOpen, onClose, patient, therapistName }: WhatsAppModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('BOOKING_CONFIRMATION');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Form State for Template Params
    const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

    if (!isOpen) return null;

    const handleSend = async () => {
        setLoading(true);
        setError('');

        try {
            const payload = {
                phone: patient.phone,
                templateType: selectedTemplate,
                templateParams: {
                    name: patient.name,
                    patientName: patient.name,
                    therapistName: therapistName,
                    recipientName: patient.name, // For cancellation
                    date,
                    time
                }
            };

            const res = await fetch('/api/notifications/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to send');

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#25D366]/10">
                    <h3 className="font-bold text-[#075E54] dark:text-[#25D366] flex items-center gap-2">
                        <MessageCircle size={20} /> Enviar WhatsApp
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Target Info */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{patient.name}</p>
                            <p className="text-xs text-slate-500">{patient.phone}</p>
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Modelo de Mensagem</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#25D366] outline-none text-sm font-medium"
                        >
                            <option value="BOOKING_CONFIRMATION">📅 Confirmação de Agendamento</option>
                            <option value="BOOKING_CANCELLATION">❌ Cancelamento</option>
                            <option value="SESSION_REMINDER_15MIN">⏰ Lembrete (15 min)</option>
                            <option value="WELCOME">👋 Boas Vindas</option>
                            <option value="HELLO_WORLD">🌍 Hello World (Teste)</option>
                        </select>
                    </div>

                    {/* Dynamic Params Inputs */}
                    {['BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION'].includes(selectedTemplate) && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Data</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Horário</label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                    {success && <p className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-lg flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Enviado com sucesso!</p>}

                    {/* Action Button */}
                    <button
                        onClick={handleSend}
                        disabled={loading || success}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${success ? 'bg-green-500' : 'bg-[#25D366] hover:bg-[#128C7E]'
                            } ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? 'Enviando...' : success ? 'Enviado!' : <><Send size={18} /> Enviar Mensagem</>}
                    </button>

                </div>
            </div>
        </div>
    );
}
