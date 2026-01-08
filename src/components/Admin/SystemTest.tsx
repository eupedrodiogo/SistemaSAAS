import React, { useState } from 'react';
import { Mail, CheckCircle, AlertTriangle, Loader2, ArrowRight, MessageCircle } from 'lucide-react';

const SystemTest: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [whatsappMessage, setWhatsappMessage] = useState('');

    const handleTestEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/emails/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    name: 'Teste de Sistema',
                    plan: 'trial'
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(`E-mail enviado com sucesso para ${email}! Verifique a caixa de entrada (e spam).`);
            } else {
                throw new Error(data.error || JSON.stringify(data) || 'Falha ao enviar');
            }
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(`Erro: ${err.message}. Verifique se as variáveis SMTP estão configuradas no Vercel.`);
        }
    };

    const handleTestWhatsapp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!whatsappPhone) return;

        setWhatsappStatus('loading');
        setWhatsappMessage('');

        try {
            const response = await fetch('/api/system/test-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: whatsappPhone
                })
            });

            const data = await response.json();

            if (response.ok) {
                setWhatsappStatus('success');
                setWhatsappMessage('Mensagem enviada com sucesso! Verifique o WhatsApp.');
            } else {
                throw new Error(data.error || 'Falha ao enviar mensagem');
            }
        } catch (err: any) {
            console.error(err);
            setWhatsappStatus('error');
            setWhatsappMessage(`Erro: ${err.message}. Verifique credenciais do Twilio.`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 pb-0">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Teste de Sistema
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Ferramenta para validar o envio de e-mails em produção sem necessidade de cadastro completo.
                    </p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleTestEmail} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                E-mail de Destino
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    Enviar Teste
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {status === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-start gap-3 animate-fade-in">
                            <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                {message}
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3 animate-fade-in">
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                {message}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 text-center border-t border-slate-100 dark:border-slate-800">
                    <a href="/" className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        Voltar ao Início
                    </a>
                </div>
            </div>
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden mt-6">
                <div className="p-8 pb-0">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <MessageCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Teste de WhatsApp (Twilio)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Valide o envio de mensagens. Certifique-se de que o número é válido e, para Sandbox, você já tenha ingressado.
                    </p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleTestWhatsapp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                WhatsApp de Destino (Ex: 5511999999999)
                            </label>
                            <input
                                type="text"
                                required
                                value={whatsappPhone}
                                onChange={(e) => setWhatsappPhone(e.target.value)}
                                placeholder="5511999999999"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={whatsappStatus === 'loading'}
                            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {whatsappStatus === 'loading' ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    Enviar WhatsApp
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {whatsappStatus === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-start gap-3 animate-fade-in">
                            <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                {whatsappMessage}
                            </p>
                        </div>
                    )}

                    {whatsappStatus === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3 animate-fade-in">
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                {whatsappMessage}
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {/* STRIPE TEST CARD */}
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden mt-6">
                <div className="p-8 pb-0">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <span className="font-bold text-xl">$</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Teste de Stripe
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Verifique se a chave de API do Stripe está configurada corretamente no servidor.
                    </p>
                </div>

                <div className="p-8">
                    <StripeTestBlock />
                </div>
            </div>
        </div>
    );
};

const StripeTestBlock = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const runTest = async () => {
        setStatus('loading');
        setMessage('');
        try {
            const res = await fetch('/api/payments?action=check', { method: 'POST' });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || res.statusText);
            }
            const data = await res.json();
            setStatus('success');
            setMessage(data.message || 'Conexão Stripe OK!');
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message || 'Erro de conexão');
        }
    };

    return (
        <div>
            <button
                onClick={runTest}
                disabled={status === 'loading'}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Verificando...
                    </>
                ) : (
                    <>
                        Testar Conexão
                        <ArrowRight size={20} />
                    </>
                )}
            </button>

            {status === 'success' && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-start gap-3 animate-fade-in">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">{message}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3 animate-fade-in">
                    <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium break-all">{message}</p>
                </div>
            )}
        </div>
    );
};

export default SystemTest;
