import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BrainCircuit, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user) {
            console.log('LoginPage: User already authenticated, redirecting to dashboard...');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loginMode, setLoginMode] = useState<'password' | 'magic_link'>('password');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Check for registration success param
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            setSuccessMessage('Conta criada com sucesso! Faça login para continuar.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (loginMode === 'password') {
                const { error: authError, data } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (authError) throw authError;
                console.log('Login successful:', data);

                // Generate custom JWT for API authentication
                try {
                    const apiResponse = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email, password: formData.password })
                    });
                    if (apiResponse.ok) {
                        const apiData = await apiResponse.json();
                        localStorage.setItem('TRG_AUTH_TOKEN', apiData.token);
                        if (apiData.therapist) {
                            localStorage.setItem('therapist', JSON.stringify(apiData.therapist));
                        }
                    }
                } catch (e) {
                    console.warn('Custom API token generation failed, continuing with Supabase session', e);
                }

                // Force session refresh assurance
                await supabase.auth.getSession();

                // Wait a brief moment for AuthContext to update logic
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);

            } else {
                // Magic Link Login
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: formData.email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                });

                if (otpError) throw otpError;

                setSuccessMessage('Link de acesso enviado! Verifique seu email.');
                setIsLoading(false);
                return; // Stop execution, don't navigate yet
            }

        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : err.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                    Acesse sua conta
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Bem-vindo de volta, terapeuta.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800">

                    {/* Tab Switcher Removed for Strict Password Flow */}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-10 appearance-none rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full pl-10 appearance-none rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex items-center justify-end mt-2">
                                <a href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                    Esqueceu a senha?
                                </a>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-primary-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={20} /></>}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Não tem uma conta?</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                                Criar conta gratuitamente
                            </a>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default LoginPage;
