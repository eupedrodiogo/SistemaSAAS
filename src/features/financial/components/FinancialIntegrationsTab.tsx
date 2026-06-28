import React from 'react';
import { ShieldCheck, Globe, Zap, Link as LinkIcon, CreditCard, ArrowRight } from 'lucide-react';

interface FinancialIntegrationsTabProps {
  isStripeConnected: boolean;
  handleConnectStripe: () => void;
  handleCreatePaymentLink: () => void;
}

export const FinancialIntegrationsTab: React.FC<FinancialIntegrationsTabProps> = ({ isStripeConnected, handleConnectStripe, handleCreatePaymentLink }) => {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Status Card */}
      <div className={`rounded-2xl p-6 border transition-colors ${isStripeConnected
        ? 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-900/30'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <svg viewBox="0 0 32 32" className="w-8 h-8 text-[#635BFF]" fill="currentColor"><path d="M11.7 13.5c0-.8.7-1.3 1.9-1.3 2.8 0 5.4 1.1 5.4 1.1v-4s-2.3-1-5.3-1c-4.4 0-7.3 2.3-7.3 6.3 0 6.1 8.4 5.1 8.4 7.7 0 .9-1 1.3-2.3 1.3-3.1 0-6.1-1.3-6.1-1.3v4.2s2.6 1 5.9 1c4.7 0 7.6-2.3 7.6-6.4 0-6.7-8.2-5.4-8.2-8 0-.6.4-1.2 1.9-1.2z"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Stripe Payments
                {isStripeConnected && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase border border-green-200 dark:border-green-800">Conectado</span>
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isStripeConnected
                  ? 'Sua conta está ativa e processando pagamentos.'
                  : 'Receba pagamentos via Cartão, PIX e Boleto integrando sua conta.'}
              </p>
            </div>
          </div>

          {isStripeConnected ? (
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">
              Gerenciar no Dashboard Stripe
            </button>
          ) : (
            <button
              onClick={handleConnectStripe}
              className="px-6 py-2.5 bg-[#635BFF] hover:bg-[#534be0] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              Conectar Conta Stripe <ArrowRight size={18} />
            </button>
          )}
        </div>

        {isStripeConnected && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-green-500" size={20} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pagamentos Seguros (SSL)</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="text-blue-500" size={20} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aceita Cartões Internacionais</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-amber-500" size={20} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Recebimento em D+2</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {isStripeConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <LinkIcon size={18} className="text-primary-500" /> Links de Pagamento
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Crie links de checkout para enviar pelo WhatsApp. O paciente paga e o sistema dá baixa automaticamente.
            </p>
            <button
              onClick={handleCreatePaymentLink}
              className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
            >
              Gerar Novo Link
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <CreditCard size={18} className="text-primary-500" /> Cobrança Recorrente
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Configure planos mensais para pacientes com tratamento contínuo (Assinaturas).
            </p>
            <button className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Configurar Planos
            </button>
          </div>
        </div>
      )}

      {/* Webhooks Config (Simulated) */}
      {isStripeConnected && (
        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status da Integração</h4>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Webhook Ativo
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Endereço de recebimento: https://api.teranexus.com/webhooks/stripe</p>
        </div>
      )}
    </div>
  );
};
