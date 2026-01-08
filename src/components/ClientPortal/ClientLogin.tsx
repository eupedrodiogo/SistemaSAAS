import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Mail, FileText, Shield } from 'lucide-react';
import LegalModal from '../Legal/LegalModal';

const ClientLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
        isOpen: false,
        type: 'terms'
    });

    const openLegal = (type: 'terms' | 'privacy') => {
        setLegalModal({ isOpen: true, type });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/client-portal?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} ${text}`);
            }

            if (response.ok) {
                localStorage.setItem('client_portal_id', data.patientId);
                localStorage.setItem('client_portal_email', data.email);
                window.location.href = '/portal-paciente/dashboard';
            } else {
                alert(data.error || 'Erro ao entrar. Verifique seu e-mail.');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            alert(`Erro de conexão: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portal do Cliente</h1>
                    <p className="text-slate-500 text-center mt-2">
                        Acesse sua área exclusiva para gerenciar suas sessões e materiais.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Seu E-mail
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemplo@email.com"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Acessando...
                            </>
                        ) : (
                            <>
                                Entrar no Portal <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
                    <p className="text-xs text-slate-400">
                        Ainda não tem cadastro? <a href="/" className="text-primary-600 hover:underline">Agende sua primeira sessão</a>
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => openLegal('terms')}
                            className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-primary-600 transition-colors"
                        >
                            Termos de Uso
                        </button>
                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                        <button
                            onClick={() => openLegal('privacy')}
                            className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-primary-600 transition-colors"
                        >
                            Privacidade
                        </button>
                    </div>
                </div>
            </div>

            <LegalModal
                isOpen={legalModal.isOpen}
                onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
                type={legalModal.type}
            />
        </div>
    );
};

export default ClientLogin;
