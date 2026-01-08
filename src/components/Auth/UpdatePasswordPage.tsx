import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BrainCircuit, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const UpdatePasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check for error in hash (redirected from App.tsx)
        const hash = location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1)); // remove #
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                if (errorDescription.includes('expired')) {
                    setError('O link de recuperação expirou. Por favor, solicite um novo.');
                } else {
                    setError(decodeURIComponent(errorDescription).replace(/\+/g, ' '));
                }
            }
        }

        // Listen for auth state changes to confirm we have a valid session for recovery
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("UpdatePasswordPage Auth Event:", event);
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                // We have a session, safe to update password
                setError('');
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };

    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Verify session existence before attempting update
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // If no session, try parsing hash again or warn user
                throw new Error('Sessão expirada ou inválida. Por favor, clique no link do email novamente.');
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setIsSuccess(true);

            // Redirect after a few seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao atualizar senha");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 font-sans text-center">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Senha Atualizada!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Sua senha foi redefinida com sucesso. Você será redirecionado para o painel em instantes.</p>
                    <Link to="/dashboard" className="text-primary-600 font-bold hover:underline">
                        Ir para o Dashboard agora
                    </Link>
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
                    Definir Nova Senha
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Escolha uma senha forte para sua conta.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nova Senha</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="block w-full pl-10 appearance-none rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
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

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-primary-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Atualizar Senha <ArrowRight size={20} /></>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
