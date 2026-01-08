import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BrainCircuit, Mail, User, ArrowRight, Loader2, ShieldCheck, FileText } from 'lucide-react';
import LegalModal from '../Legal/LegalModal';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
        isOpen: false,
        type: 'terms'
    });

    const openLegal = (type: 'terms' | 'privacy') => {
        setLegalModal({ isOpen: true, type });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const plan = new URLSearchParams(window.location.search).get('plan') || 'trial';

            // Basic validation
            if (!formData.phone || formData.phone.length < 10) {
                throw new Error('Por favor, insira um número de WhatsApp válido.');
            }
            if (!formData.password || formData.password.length < 6) {
                throw new Error('Sua senha deve ter pelo menos 6 caracteres.');
            }

            console.log('Initiating Registration for:', formData.email);

            // Call unified backend API
            const response = await fetch('/api/auth/register-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password,
                    plan: plan
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao realizar cadastro.');
            }

            // Auto-login attempt
            try {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (!loginError) {
                    // Redirect will be handled by AuthContext/App state or we can force it
                    window.location.href = '/dashboard';
                    return;
                }
                console.warn('Auto-login failed after registration:', loginError);
                // Fallback to success screen if auto-login fails
            } catch (autoLoginErr) {
                console.warn('Auto-login exception:', autoLoginErr);
            }

            setSuccess(true);

        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Conta criada com sucesso!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
                        Sua conta foi ativada.<br />
                        Tente fazer login com suas credenciais.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-8 border border-blue-100 dark:border-blue-800">
                        <a href="/login?registered=true" className="bg-primary-600 text-white p-3 rounded-lg font-bold block hover:bg-primary-700 transition">
                            Ir para Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">
                        TRG<span className="text-primary-500">Nexus</span>
                    </span>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Crie sua conta de Terapeuta
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Acesso completo e seguro para sua gestão.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 text-xs font-bold">BR</span>
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Para receber confirmação e notificações.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Profissional</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="voce@exemplo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Crie sua Senha</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className="h-5 w-5 text-slate-400 flex items-center justify-center text-xs">🔒</div>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Erro
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                                Ao criar sua conta, você concorda com nossos{' '}
                                <button
                                    type="button"
                                    onClick={() => openLegal('terms')}
                                    className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                                >
                                    Termos de Uso
                                </button>
                                {' '}e nossa{' '}
                                <button
                                    type="button"
                                    onClick={() => openLegal('privacy')}
                                    className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                                >
                                    Política de Privacidade
                                </button>
                                .
                            </p>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Criar Conta e Acessar
                                        <ArrowRight size={18} className="text-primary-100 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
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

export default RegisterPage;
