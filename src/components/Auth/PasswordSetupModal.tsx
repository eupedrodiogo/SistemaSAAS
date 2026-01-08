import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PasswordSetupModalProps {
    isOpen: boolean;
    onSuccess: () => void;
}

const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({ isOpen, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Update the user's password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
                data: { has_set_password: true } // Mark as set in metadata
            });

            if (updateError) throw updateError;

            // 2. Success
            onSuccess();

        } catch (err: any) {
            console.error('Password setup error:', err);
            setError(err.message || 'Erro ao definir senha.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-primary-600">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <Lock className="text-white w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center">Defina sua Senha</h2>
                    <p className="text-primary-100 text-center mt-2 text-sm">
                        Para garantir sua segurança e facilitar o próximo acesso, crie uma senha agora.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Confirmar Senha
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    placeholder="Repita a senha"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm p-3 rounded-lg flex items-start gap-2 mt-4">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary-500/20 transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Salvar Senha e Continuar
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordSetupModal;
