import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe outside component to avoid reloading
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentStepProps {
    data: any;
    appointmentId: string | null;
    onBack: () => void;
    onComplete: () => void;
}

const CheckoutForm = ({ onBack, onComplete, amount }: { onBack: () => void, onComplete: () => void, amount: string }) => {
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
            // Payment successful
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

            <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                <Lock size={12} /> Pagamento processado via Stripe com criptografia SSL.
            </div>
        </form>
    );
};

const PaymentStep: React.FC<PaymentStepProps> = ({ data, appointmentId, onBack, onComplete }) => {
    const [clientSecret, setClientSecret] = useState('');
    const [isLoadingSecret, setIsLoadingSecret] = useState(true);
    // Use dynamic price or default fallback
    const actualPrice = data.price || 100;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const DISPLAY_PRICE = formatCurrency(actualPrice);

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
            .then((res) => res.json())
            .then((data) => {
                setClientSecret(data.clientSecret);
                setIsLoadingSecret(false);
            })
            .catch((err) => {
                console.error('Error creating payment intent:', err);
                setIsLoadingSecret(false);
            });
    }, [appointmentId, actualPrice, data.therapistName]);

    return (
        <div className="max-w-md mx-auto animate-fade-in">
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

            {isLoadingSecret ? (
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
                            theme: 'stripe',
                        },
                    }}
                >
                    <CheckoutForm onBack={onBack} onComplete={onComplete} amount={DISPLAY_PRICE} />
                </Elements>
            ) : (
                <div className="text-center text-red-500 p-4 border border-red-200 rounded-xl bg-red-50">
                    Erro ao carregar sistema de pagamento. Tente recarregar a página.
                </div>
            )}
        </div>
    );
};

export default PaymentStep;
