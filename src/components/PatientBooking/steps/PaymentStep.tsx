import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        // Confirm the payment
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // We handle completion manually, so we don't strictly need a return_url if using redirect: 'if_required'
                // But Stripe recommends it.
                return_url: window.location.origin + '/portal-paciente/cadastro',
            },
            redirect: 'if_required'
        });

        if (error) {
            setErrorMessage(error.message ?? 'Erro ao processar pagamento.');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Success! 
            // Trigger manual confirmation to guarantee backend update & WhatsApp
            try {
                // Don't await this to keep UI snappy, or await if we want to show loading?
                // Better to await to ensure we don't redirect too fast
                await fetch('/api/manual-confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                        appointmentId: appointmentId
                    })
                });
            } catch (err) {
                console.error('Manual confirm failed, relying on webhook:', err);
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
                    <PaymentElement options={{
                        layout: 'tabs',
                        defaultValues: {
                            billingDetails: {
                                address: { country: 'BR' }
                            }
                        },
                        paymentMethodOrder: [
                            'google_pay',
                            'apple_pay',
                            'pix',
                            'cpmt_1Sm4ZCKPo7EypB7VbBXdaPT6', // PicPay
                            'cpmt_1Sm4aKKPo7EypB7VlUIB55XO', // PayPal
                            'card'
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
                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>Processando...</>
                    ) : (
                        <><CheckCircle2 size={20} /> Pagar {amount}</>
                    )}
                </button>
            </div>

            {/* Fallback Check Button */}
            <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={async () => {
                        if (!stripe || !elements) return;
                        setIsProcessing(true);

                        // Check status via Stripe
                        try {
                            const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret); // clientSecret from props

                            if (paymentIntent && paymentIntent.status === 'succeeded') {
                                // Trigger manual confirm
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
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix' | 'whatsapp' | 'email'>('stripe');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [selectedBilling, setSelectedBilling] = useState<'pix' | 'card'>('pix');
    // Use dynamic price or default fallback
    const actualPrice = data.price || 100;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const DISPLAY_PRICE = formatCurrency(actualPrice);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!appointmentId) return;

        // Create PaymentIntent as soon as the component loads
        fetch('/api/payments?action=intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.round(actualPrice * 100), // Convert to cents for Stripe
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



            {/* Opções de Pagamento */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex-wrap">
                <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex-1 min-w-[140px] py-2.5 px-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'stripe' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                >
                    <CreditCard size={16} /> Cartão / Outros
                </button>
                <button
                    onClick={() => setPaymentMethod('email')}
                    className={`flex-1 min-w-[140px] py-2.5 px-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'email' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                >
                    <Mail size={16} /> Receber por E-mail
                </button>
            </div>

            {paymentMethod === 'email' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">Um link já foi enviado para seu E-mail!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Se você preferir pagar depois, não se preocupe: o sistema acabou de mandar o link seguro de pagamento para a sua caixa de entrada ({data.email}).
                    </p>

                    {emailError && (
                        <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                            {emailError}
                        </div>
                    )}

                    {emailSent ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                <CheckCircle2 className="inline-block mr-2" size={20} />
                                Tudo certo! O e-mail foi reenviado com sucesso.
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={() => onComplete()}
                                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={20} /> Entendido, vou fechar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('stripe')}
                                className="w-1/3 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                            >
                                Pagar Agora
                            </button>
                            <button
                                onClick={async () => {
                                    setEmailLoading(true);
                                    setEmailError(null);
                                    try {
                                        const res = await fetch('/api/payments?action=checkout', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                amount: Math.round(actualPrice * 100),
                                                productName: `Sessão com ${data.therapistName || 'Terapeuta TRG'}`,
                                                successUrl: window.location.origin + `/portal-paciente/cadastro?email=${encodeURIComponent(data.email || '')}&name=${encodeURIComponent(data.name || '')}&appointmentId=${appointmentId || ''}`,
                                                cancelUrl: window.location.href,
                                            })
                                        });
                                        const checkoutData = await res.json();
                                        if (!res.ok) throw new Error(checkoutData.message || 'Erro ao gerar link de pagamento.');
                                        
                                        const emailRes = await fetch('/api/system/send-email-link', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                email: data.email,
                                                name: data.name,
                                                checkoutUrl: checkoutData.url,
                                                price: DISPLAY_PRICE,
                                                therapistName: data.therapistName
                                            })
                                        });
                                        const emailData = await emailRes.json();
                                        if (!emailRes.ok) throw new Error(emailData.error || 'Erro ao enviar e-mail.');

                                        setEmailSent(true);
                                    } catch (err: any) {
                                        setEmailError(err.message);
                                    } finally {
                                        setEmailLoading(false);
                                    }
                                }}
                                disabled={emailLoading}
                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {emailLoading ? 'Reenviando...' : 'Reenviar E-mail'}
                            </button>
                        </div>
                    )}
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
