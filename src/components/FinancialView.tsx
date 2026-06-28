import React, { useState } from 'react';
import { useFinancialsData, useCreateTransaction, useDeleteTransaction } from '../features/financial/api/useFinancials';
import {
  PieChart as PieIcon,
  List,
  FileText,
  Zap,
  AlertTriangle,
  CheckCircle2,
  X,
  Bell
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { FinancialOverview } from '../features/financial/components/FinancialOverview';
import { TransactionsList } from '../features/financial/components/TransactionsList';
import { ReceiptsManager } from '../features/financial/components/ReceiptsManager';
import { FinancialIntegrationsTab } from '../features/financial/components/FinancialIntegrationsTab';
import { FinancialSettingsTab } from '../features/financial/components/FinancialSettingsTab';
import { TransactionModal } from '../features/financial/components/TransactionModal';
import { PaymentLinkModal } from '../features/financial/components/PaymentLinkModal';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message ?? 'Ocorreu um erro desconhecido.');
      setIsProcessing(false);
    } else {
      onSuccess();
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
      <button
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50"
      >
        {isProcessing ? 'Processando...' : 'Pagar Agora'}
      </button>
    </form>
  );
};

const FinancialView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'receipts' | 'integrations' | 'settings'>('overview');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading: loading } = useFinancialsData(selectedYear);
  const transactions = data?.transactions || [];
  const monthlyData = data?.monthlyData || [];
  const financials = data?.financials || {
    balance: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    pendingAmount: 0
  };

  const createTransactionMutation = useCreateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    description: '',
    category: 'Sessão TRG',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pago'
  });

  // Stripe Integration State
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [isPaymentLinkModalOpen, setIsPaymentLinkModalOpen] = useState(false);
  const [paymentLinkData, setPaymentLinkData] = useState({
    title: 'Sessão de Terapia TRG',
    price: '250.00',
    generatedLink: '',
    clientSecret: ''
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Handlers ---

  const handleSaveTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      showNotification('Preencha a descrição e o valor.', 'error');
      return;
    }

    try {
      await createTransactionMutation.mutateAsync({
        type:        newTransaction.type as 'income' | 'expense',
        description: newTransaction.description,
        category:    newTransaction.category,
        amount:      parseFloat(newTransaction.amount),
        status:      newTransaction.status === 'Pago' ? 'paid' : 'pending',
        date:        newTransaction.date,
      });

      setIsTransactionModalOpen(false);
      showNotification('Lançamento salvo com sucesso!', 'success');
      setNewTransaction({
        type: 'income', description: '', category: 'Sessão TRG',
        amount: '', date: new Date().toISOString().split('T')[0], status: 'Pago'
      });
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      showNotification('Erro ao salvar lançamento: ' + (err.message ?? 'Tente novamente.'), 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Excluir este lançamento?')) return;
    try {
      await deleteTransactionMutation.mutateAsync(id);
      showNotification('Lançamento removido.', 'info');
    } catch (err: any) {
      showNotification('Erro ao remover: ' + (err.message ?? ''), 'error');
    }
  };

  const handleGenerateReceipt = (patientName: string) => {
    showNotification(`Recibo para ${patientName} gerado e pronto para impressão.`, "success");
  };

  // --- Stripe Handlers ---

  const handleConnectStripe = () => {
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const w = window.open('', '_blank', `width=${width},height=${height},top=${top},left=${left}`);
    if (w) {
      w.document.write('<html><body style="background:#f3f4f6;display:flex;justify-content:center;align-items:center;height:100%;font-family:sans-serif;"><h2>Conectando ao Stripe...</h2><p>Aguarde, simulando autenticação segura.</p></body></html>');
      setTimeout(() => {
        w.close();
        setIsStripeConnected(true);
        showNotification("Conta Stripe conectada com sucesso!", "success");
      }, 2000);
    }
  };

  const handleCreatePaymentLink = () => {
    setIsPaymentLinkModalOpen(true);
    setPaymentLinkData(prev => ({ ...prev, generatedLink: '', clientSecret: '' }));

    // Create Payment Intent
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 25000 }) // R$ 250,00 in cents
    })
      .then(res => res.json())
      .then(data => setPaymentLinkData(prev => ({ ...prev, clientSecret: data.clientSecret })));
  };

  const generateLink = () => {
    setTimeout(() => {
      const mockId = Math.random().toString(36).substring(7);
      setPaymentLinkData(prev => ({
        ...prev,
        generatedLink: `https://buy.stripe.com/test_${mockId}`
      }));
    }, 1000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLinkData.generatedLink);
    showNotification("Link copiado para a área de transferência!", "success");
    setIsPaymentLinkModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 relative">

      {/* Toast Notification Portal */}
      {toast && toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md animate-slide-up">
          <div className="bg-slate-800 dark:bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-start gap-4 border border-slate-700 backdrop-blur-md bg-opacity-95">
            <div className={`mt-0.5 p-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : toast.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <Bell size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm mb-0.5">{toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Informação'}</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-white transition-colors -mr-1 -mt-1 p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financeiro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestão completa de fluxo de caixa, recibos e políticas.</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Visão Geral', icon: PieIcon },
            { id: 'transactions', label: 'Lançamentos', icon: List },
            { id: 'receipts', label: 'Recibos', icon: FileText },
            { id: 'integrations', label: 'Integrações', icon: Zap },
            { id: 'settings', label: 'Configurações', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                 ${activeTab === tab.id
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
               `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <FinancialOverview
            loading={loading}
            financials={financials}
            monthlyData={monthlyData}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsList
            transactions={transactions}
            setIsTransactionModalOpen={setIsTransactionModalOpen}
            handleDeleteTransaction={handleDeleteTransaction}
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptsManager
            transactions={transactions}
            handleGenerateReceipt={handleGenerateReceipt}
          />
        )}
        {activeTab === 'integrations' && (
          <FinancialIntegrationsTab
            isStripeConnected={isStripeConnected}
            handleConnectStripe={handleConnectStripe}
            handleCreatePaymentLink={handleCreatePaymentLink}
          />
        )}
        {activeTab === 'settings' && (
          <FinancialSettingsTab showNotification={showNotification} />
        )}
      </div>

      {/* New Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal
          newTransaction={newTransaction}
          setNewTransaction={setNewTransaction}
          setIsTransactionModalOpen={setIsTransactionModalOpen}
          handleSaveTransaction={handleSaveTransaction}
        />
      )}

      {/* Create Payment Link Modal */}
      {isPaymentLinkModalOpen && (
        <PaymentLinkModal
          setIsPaymentLinkModalOpen={setIsPaymentLinkModalOpen}
          paymentLinkData={paymentLinkData}
          setPaymentLinkData={setPaymentLinkData}
          generateLink={generateLink}
          copyToClipboard={copyToClipboard}
          stripePromise={stripePromise}
        >
          <CheckoutForm onSuccess={() => {
            setIsPaymentLinkModalOpen(false);
            showNotification("Pagamento realizado com sucesso!", "success");
          }} />
        </PaymentLinkModal>
      )}

    </div>
  );
};

export default FinancialView;
