import React, { useState, useEffect } from 'react';
import { BrainCircuit, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const ClientRegister: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);

    useEffect(() => {
        // Try to get patient ID from localStorage (set during booking)
        const storedId = localStorage.getItem('client_portal_id');
        if (storedId) {
            setPatientId(storedId);
        }

        // Pre-fill email if available from booking draft
        const bookingDraft = localStorage.getItem('booking_draft');
        if (bookingDraft) {
            try {
                const data = JSON.parse(bookingDraft);
                if (data.email) {
                    setEmail(data.email);
                }
            } catch (e) {
                console.error('Error parsing booking draft', e);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/client-auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    patientId
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Save login info
                localStorage.setItem('client_portal_id', data.patientId);
                localStorage.setItem('client_portal_email', email);

                // Redirect to agendamentos after 2 seconds
                setTimeout(() => {
                    window.location.href = '/portal-paciente/agendamentos';
                }, 2000);
            } else {
                setError(data.error || 'Erro ao criar conta. Tente novamente.');
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <CheckCircle2 size={40} strokeWidth={2} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Conta Criada com Sucesso!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Você será redirecionado para o portal em instantes...
                    </p>
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <BrainCircuit size={28} className="text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">
                        TRG<span className="text-primary-500">Nexus</span>
                    </span>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                        Crie sua Senha
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                        Configure o acesso ao seu Portal do Cliente
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a senha"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Criar Minha Conta
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Já tem uma conta?{' '}
                        <a href="/portal-paciente/login" className="text-primary-600 hover:underline font-semibold">
                            Fazer Login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientRegister;
