import React, { useState } from 'react';
import { X, User, Mail, Phone, Link as LinkIcon, Copy, MessageCircle, Check, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Schema Zod ────────────────────────────────────────────────────────────────
const patientSchema = z.object({
    name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    email: z
        .string()
        .email('E-mail inválido')
        .optional()
        .or(z.literal('')),
    phone: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    therapistId: string;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onSuccess, therapistId }) => {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: { name: '', email: '', phone: '' },
    });

    if (!isOpen) return null;

    const bookingLink = `${window.location.origin}/agendar/${therapistId}`;

    // Submit agora recebe dados já validados pelo zod
    const onSubmit = async (data: PatientFormData) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('patients')
                .insert([{
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    therapist_id: therapistId,
                    status: 'active', // Default status
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
            reset();
            toast.success('Paciente cadastrado com sucesso!');

        } catch (error) {
            console.error('Error adding patient:', error);
            toast.error('Erro ao cadastrar paciente.');
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-0 overflow-hidden sm:max-w-5xl bg-white dark:bg-slate-900 border-0 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 gap-0">
                <DialogTitle className="sr-only">Cadastrar Paciente</DialogTitle>
                <DialogDescription className="sr-only">Adicionar paciente via link ou manualmente.</DialogDescription>

                {/* Modal Container: Much larger max-width */}
                <div className="relative w-full flex flex-col md:flex-row h-auto md:h-[600px] border-none">


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
                                <Button
                                    onClick={handleCopyLink}
                                    variant="secondary"
                                    className="h-12 flex items-center justify-center gap-2 bg-white text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10 active:scale-95 text-base"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </Button>
                                <Button
                                    onClick={handleShareWhatsApp}
                                    className="h-12 flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-lg font-bold hover:bg-[#20bd5a] transition-colors shadow-lg shadow-green-900/20 active:scale-95 border border-white/10 text-base hover:text-white"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp
                                </Button>
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
                        {/* Custom Close Button Removed - using DialogContent default */}
                    </div>

                    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Nome */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        type="text"
                                        {...register('name')}
                                        className="h-12 w-full pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-indigo-500/20 outline-none transition-all dark:text-white text-base"
                                        placeholder="Nome do Paciente"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            {/* WhatsApp */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Whatsapp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        type="tel"
                                        {...register('phone')}
                                        className="h-12 w-full pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-indigo-500/20 outline-none transition-all dark:text-white text-base"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Email <span className="font-normal lowercase opacity-70">(opcional)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        type="email"
                                        {...register('email')}
                                        className="h-12 w-full pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-indigo-500/20 outline-none transition-all dark:text-white text-base"
                                        placeholder="ana@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-14 w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg shadow-slate-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                                    {loading ? 'Cadastrando...' : 'Cadastrar Manualmente'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddPatientModal;
