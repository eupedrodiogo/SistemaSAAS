
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface LoginViewProps {
  onLogin: () => void;
  onBack?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('admin@teranexus.com');
  const [password, setPassword] = useState('123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const ok = await api.auth.login(email, password);
      if (ok) {
        setStep('success');
        setTimeout(() => { onLogin(); }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Falha no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-secondary-900/10 rounded-full blur-[100px]"></div>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20 p-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      )}

      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in">

        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4 overflow-hidden">
            <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tera<span className="text-primary-400">Nexus</span></h1>
          <p className="text-slate-400 mt-2 text-sm">Sistema de Gestão para Terapia de Reprocessamento</p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email Profissional</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">Esqueceu a senha?</button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm text-center animate-slide-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 group"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Acessar Painel <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Login realizado!</h3>
            <p className="text-slate-400">Preparando seu ambiente seguro...</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <p className="text-slate-500 text-xs">
            Protegido com criptografia de ponta a ponta. <br />
            © 2023 TeraNexus Technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
