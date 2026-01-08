import React from 'react';
import { User, Mail, Phone, ShieldCheck, FileText } from 'lucide-react';
import LegalModal from '../../Legal/LegalModal';

interface RegisterStepProps {
    data: any;
    onUpdate: (data: any) => void;
    onNext: () => void;
}

const RegisterStep: React.FC<RegisterStepProps> = ({ data, onUpdate, onNext }) => {
    const [legalModal, setLegalModal] = React.useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
        isOpen: false,
        type: 'terms'
    });

    const openLegal = (type: 'terms' | 'privacy') => {
        setLegalModal({ isOpen: true, type });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    return (
        <div className="max-w-md mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Seus Dados</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Preencha suas informações para iniciarmos.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            value={data.name || ''}
                            onChange={e => onUpdate({ ...data, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="Ex: João Silva"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            required
                            value={data.email || ''}
                            onChange={e => onUpdate({ ...data, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="tel"
                            required
                            value={data.phone || ''}
                            onChange={e => onUpdate({ ...data, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                        Ao prosseguir, você concorda com os{' '}
                        <button
                            type="button"
                            onClick={() => openLegal('terms')}
                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                        >
                            Termos de Uso
                        </button>
                        {' '}e{' '}
                        <button
                            type="button"
                            onClick={() => openLegal('privacy')}
                            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                        >
                            Política de Privacidade
                        </button>
                        . Seus dados estão protegidos pela LGPD.
                    </p>
                </div>

                <button
                    type="submit"
                    className="w-full mt-6 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                >
                    Continuar
                </button>
            </form>

            <LegalModal
                isOpen={legalModal.isOpen}
                onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
                type={legalModal.type}
            />
        </div>
    );
};

export default RegisterStep;
