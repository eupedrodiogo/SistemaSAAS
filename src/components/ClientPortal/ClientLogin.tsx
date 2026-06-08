import React, { useState, useEffect } from 'react';
import { ArrowRight, Mail, FileText, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import LegalModal from '../Legal/LegalModal';

const ClientLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
        isOpen: false,
        type: 'terms'
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        let emailParam = queryParams.get('email');
        const tokenParam = queryParams.get('t');
        if (tokenParam) {
            try { emailParam = atob(tokenParam); } catch(e) {}
        }
        
        if (emailParam) {
            setEmail(emailParam);
            // Attempt auto-login after state updates
            setTimeout(() => {
                const btn = document.getElementById('auto-login-btn');
                if (btn) btn.click();
            }, 100);
        }
    }, []);

    const openLegal = (type: 'terms' | 'privacy') => {
        setLegalModal({ isOpen: true, type });
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Prevent empty email submission
        const urlParams = new URLSearchParams(window.location.search);
        let fallbackEmail = urlParams.get('email');
        if (!fallbackEmail && urlParams.get('t')) {
            try { fallbackEmail = atob(urlParams.get('t')!); } catch(e) {}
        }
        const currentEmail = email || fallbackEmail;
        if (!currentEmail) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/client-portal?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, password })
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
                if (data.requiresPassword) {
                    setRequiresPassword(true);
                }
                setError(data.error || 'Erro ao entrar. Verifique seu e-mail.');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError(`Erro de conexão: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30 overflow-hidden">
                        <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tera<span className="text-primary-500">Nexus</span></h1>
                    <h2 className="text-lg font-medium text-slate-600 dark:text-slate-300 mt-1">Portal do Cliente</h2>
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

                    {(requiresPassword || password) && (
                        <div className="animate-slide-down">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Shield size={20} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Digite sua senha"
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <button
                        id="auto-login-btn"
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
                                {requiresPassword ? 'Entrar com Senha' : 'Entrar no Portal'} <ArrowRight size={20} />
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
