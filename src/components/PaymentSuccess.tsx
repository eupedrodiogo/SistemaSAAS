import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
    const priceId = new URLSearchParams(window.location.search).get('price_id');
    const registerUrl = priceId ? `/register?plan=${priceId}` : '/register?plan=paid';

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/10">
                    <CheckCircle2 size={40} className="text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Pagamento Confirmado!</h1>
                <p className="text-slate-400 mb-8">
                    Sua transação foi processada com sucesso. Agora, vamos configurar sua conta para você começar a usar o TeraNexus.
                </p>

                <button
                    onClick={() => window.location.href = registerUrl}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2"
                >
                    Criar Minha Conta <ArrowRight size={20} />
                </button>

                <p className="text-slate-500 text-xs mt-6">
                    Se você já tem uma conta, <a href="/login" className="text-primary-400 hover:text-primary-300 underline">faça login aqui</a>.
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
