import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreditCard, Lock, CheckCircle2, AlertCircle, Mail, QrCode, Copy } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTheme } from '../../../contexts/ThemeContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentStepProps {
    data: any;
    appointmentId: string | null;
    onBack: () => void;
    onComplete: () => void;
}

const CheckoutForm = ({ onBack, onComplete, amount, clientSecret, appointmentId }: { onBack: () => void, onComplete: () => void, amount: string, clientSecret: string, appointmentId: string | null }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stripePaymentType, setStripePaymentType] = useState<string>('card');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/portal-paciente/cadastro',
            },
            redirect: 'if_required'
        });

        if (error) {
            setErrorMessage(error.message ?? 'Erro ao processar pagamento.');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            try {
                await fetch('/api/manual-confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                        appointmentId: appointmentId
                    })
                });
            } catch (err) {
                console.error('Manual confirm failed:', err);
            }

            onComplete();
        } else {
            setErrorMessage('O status do pagamento é incerto. Verifique seu extrato.');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">
                    Escolha sua forma de pagamento preferida:
                </p>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    {stripePaymentType === 'card' && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                            <CreditCard size={18} className="mt-0.5 flex-shrink-0" />
                            <p><strong>Crédito ou Débito:</strong> Aceitamos as principais bandeiras. A aprovação é imediata.</p>
                        </div>
                    )}
                    {(stripePaymentType === 'google_pay' || stripePaymentType === 'apple_pay') && (
                        <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg text-sm border border-slate-200 dark:border-slate-600">
                            <p><strong>Atenção:</strong> Clique no botão azul <strong>"Continuar para {stripePaymentType === 'google_pay' ? 'Google Pay' : 'Apple Pay'}"</strong> no fim da tela. A janela segura do seu dispositivo será aberta para você confirmar o pagamento em 1 clique.</p>
                        </div>
                    )}

                    <PaymentElement 
                        onChange={(e) => setStripePaymentType(e.value.type)}
                        options={{
                        layout: 'tabs',
                        defaultValues: {
                            billingDetails: {
                                address: { country: 'BR' }
                            }
                        },
                        paymentMethodOrder: [
                            'card',
                            'google_pay',
                            'apple_pay'
                        ]
                    }} />
                </div>
            </div>

            {errorMessage && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                    <AlertCircle size={16} />
                    {errorMessage}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isProcessing}
                    className="w-1/3 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>Processando...</>
                    ) : stripePaymentType === 'google_pay' ? (
                        <>Continuar para Google Pay</>
                    ) : stripePaymentType === 'apple_pay' ? (
                        <>Continuar para Apple Pay</>
                    ) : (
                        <><CheckCircle2 size={20} /> Pagar {amount}</>
                    )}
                </button>
            </div>

            <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={async () => {
                        if (!stripe || !elements) return;
                        setIsProcessing(true);
                        try {
                            const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
                            if (paymentIntent && paymentIntent.status === 'succeeded') {
                                await fetch('/api/manual-confirm', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        paymentIntentId: paymentIntent.id,
                                        appointmentId: appointmentId
                                    })
                                });
                                onComplete();
                            } else {
                                setErrorMessage(`Status atual: ${paymentIntent?.status}. Se pagou, aguarde.`);
                            }
                        } catch (err: any) {
                            setErrorMessage(err.message);
                        }
                        setIsProcessing(false);
                    }}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                >
                    Já fiz o pagamento, mas a tela não mudou? Clique aqui.
                </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                <Lock size={12} /> Pagamento processado via Stripe com criptografia SSL.
            </div>
        </form>
    );
};

const PaymentStep: React.FC<PaymentStepProps> = ({ data, appointmentId, onBack, onComplete }) => {
    const { isDarkMode } = useTheme();
    const [clientSecret, setClientSecret] = useState('');
    const [isLoadingSecret, setIsLoadingSecret] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix'>('stripe');

    // PIX State
    const [pixData, setPixData] = useState<{ txid: string; qrcode: string; copiaecola: string; expiresAt: string } | null>(null);
    const [pixLoading, setPixLoading] = useState(false);
    const [pixError, setPixError] = useState<string | null>(null);
    const [pixPaid, setPixPaid] = useState(false);
    const [pixSecondsLeft, setPixSecondsLeft] = useState(1800);
    const pixPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pixCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const actualPrice = data.price || 100;
    const [error, setError] = useState<string | null>(null);

    const stopPixPolling = useCallback(() => {
        if (pixPollingRef.current) clearInterval(pixPollingRef.current);
        if (pixCountdownRef.current) clearInterval(pixCountdownRef.current);
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const DISPLAY_PRICE = formatCurrency(actualPrice);

    // Initialize Stripe PaymentIntent
    useEffect(() => {
        if (!appointmentId) return;

        fetch('/api/payments?action=intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.round(actualPrice * 100),
                productName: `Sessão com ${data.therapistName || 'Terapeuta TRG'}`,
                currency: 'brl',
                metadata: { appointmentId }
            })
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Erro ao criar pagamento');
                setClientSecret(data.clientSecret);
                setIsLoadingSecret(false);
            })
            .catch((err) => {
                console.error('Error creating payment intent:', err);
                setError(err.message || 'Erro desconhecido ao iniciar pagamento.');
                setIsLoadingSecret(false);
            });
    }, [appointmentId, actualPrice, data.therapistName]);

    // Criar cobrança PIX (MercadoPago) quando o usuário seleciona a aba PIX
    useEffect(() => {
        if (paymentMethod !== 'pix' || pixData || pixLoading || pixPaid) return;

        setPixLoading(true);
        setPixError(null);

        fetch('/api/pix/create-charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: actualPrice.toFixed(2),
                appointmentId,
                patientName: data.name,
                patientEmail: data.email,
            })
        })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Erro ao gerar cobrança PIX.');
                setPixData(json);
                setPixSecondsLeft(1800);

                pixCountdownRef.current = setInterval(() => {
                    setPixSecondsLeft(prev => {
                        if (prev <= 1) {
                            stopPixPolling();
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                pixPollingRef.current = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/pix/check-status?txid=${json.txid}`);
                        const statusData = await statusRes.json();
                        if (statusData.status === 'CONCLUIDA') {
                            stopPixPolling();
                            setPixPaid(true);
                        } else if (statusData.status === 'EXPIRADA' || statusData.status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR') {
                            stopPixPolling();
                            setPixError('QR Code expirado. Clique em "Tentar Novamente" para gerar um novo.');
                            setPixData(null);
                        }
                    } catch (e) {
                        console.error('[PIX] Erro no polling:', e);
                    }
                }, 5000);
            })
            .catch((err) => {
                setPixError(err.message || 'Erro desconhecido ao gerar PIX.');
            })
            .finally(() => {
                setPixLoading(false);
            });

        return () => stopPixPolling();
    }, [paymentMethod]);

    useEffect(() => () => stopPixPolling(), [stopPixPolling]);

    return (
        <div className="max-w-md mx-auto animate-fade-in">
            {!appointmentId && (
                <div className="mb-4 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 text-sm">
                    <p className="font-bold">Atenção: Identificador do agendamento não encontrado.</p>
                    <p>Por favor, retorne e tente novamente ou contate o suporte.</p>
                </div>
            )}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Pagamento Seguro</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Finalize seu agendamento com segurança.</p>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <span className="block text-slate-600 dark:text-slate-400">Sessão de Terapia</span>
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                            {data.therapistName}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="font-bold text-slate-800 dark:text-white text-xl">{DISPLAY_PRICE}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Data</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(data.date).toLocaleDateString('pt-BR')} às {data.time}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex-wrap">
                <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex-1 min-w-[140px] py-2.5 px-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'stripe' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                >
                    <CreditCard size={16} /> Cartão / Outros
                </button>
                <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex-1 min-w-[140px] py-2.5 px-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                >
                    <QrCode size={16} /> PIX
                </button>
            </div>

            {paymentMethod === 'pix' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-xl">Pague com PIX</h3>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-6 inline-block">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            QR Code válido por <span className="font-mono font-bold text-green-600 dark:text-green-400 text-lg ml-1">{String(Math.floor(pixSecondsLeft / 60)).padStart(2, '0')}:{String(pixSecondsLeft % 60).padStart(2, '0')}</span>
                        </p>
                    </div>

                    {pixPaid ? (
                        <div className="p-6 bg-green-50 text-green-700 rounded-xl border border-green-200 space-y-4">
                            <CheckCircle2 size={40} className="mx-auto" />
                            <p className="font-bold text-lg">Pagamento PIX confirmado! 🎉</p>
                            <button onClick={() => onComplete()} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all">
                                Acessar meu Portal
                            </button>
                        </div>
                    ) : pixLoading ? (
                        <div className="flex flex-col items-center py-10">
                            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 text-sm">Gerando QR Code PIX...</p>
                        </div>
                    ) : pixError ? (
                        <div className="space-y-4">
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{pixError}</div>
                            <button onClick={() => {
                                setPixError(null); setPixData(null); setPixLoading(true);
                                setPaymentMethod('stripe'); setTimeout(() => setPaymentMethod('pix'), 100);
                            }} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl">
                                Tentar Novamente
                            </button>
                        </div>
                    ) : pixData ? (
                        <>
                            <div className="bg-white p-3 inline-block rounded-xl border-2 border-green-200 mb-4 shadow">
                                <img src={pixData.qrcode} alt="QR Code PIX" className="w-52 h-52" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">PIX Copia e Cola</label>
                                <div className="flex items-center gap-2 max-w-sm mx-auto">
                                    <input
                                        type="text"
                                        readOnly
                                        value={pixData.copiaecola}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-xs text-center font-mono outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-medium"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(pixData.copiaecola); alert('Código PIX copiado!'); }}
                                        className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-lg flex-shrink-0"
                                    >
                                        <Copy size={20} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Aguardando confirmação automática...</p>
                        </>
                    ) : null}
                </div>
            ) : isLoadingSecret ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 text-sm">Iniciando pagamento seguro...</p>
                </div>
            ) : clientSecret ? (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        locale: 'pt-BR',
                        appearance: {
                            theme: isDarkMode ? 'night' : 'stripe',
                            labels: 'floating',
                            variables: {
                                colorPrimary: '#34d399',
                                colorBackground: isDarkMode ? '#1e293b' : '#ffffff',
                                colorText: isDarkMode ? '#f8fafc' : '#334155',
                                colorDanger: '#ef4444',
                                fontFamily: 'Inter, system-ui, sans-serif',
                                spacingUnit: '4px',
                                borderRadius: '8px',
                            },
                        },
                    }}
                >
                    <CheckoutForm
                        onBack={onBack}
                        onComplete={onComplete}
                        amount={DISPLAY_PRICE}
                        clientSecret={clientSecret}
                        appointmentId={appointmentId}
                    />
                </Elements>
            ) : (
                <div className="text-center text-red-500 p-4 border border-red-200 rounded-xl bg-red-50">
                    <p className="font-bold mb-1">Erro no Pagamento</p>
                    <p className="text-sm">{error || 'Erro ao carregar sistema de pagamento. Tente recarregar a página.'}</p>
                </div>
            )}
        </div>
    );
};

export default PaymentStep;
