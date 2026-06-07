
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Filter,
  CheckCircle2,
  X,
  Bell,
  ArrowRight,
  PieChart as PieIcon,
  List,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Printer,
  Share2,
  Search,
  Link,
  Globe,
  ShieldCheck,
  Zap,
  Copy,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

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

// --- Mock Data ---


// Helper Component for User Avatar
const UserIcon = ({ name }: { name: string }) => {
  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U';
  return <span className="font-bold text-sm">{initial}</span>
};

const FinancialView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'receipts' | 'integrations' | 'settings'>('overview');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Transaction State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [financials, setFinancials] = useState({
    balance: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    pendingAmount: 0
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();

        // Sync de possíveis sessões pagas que não geraram transações no BD (fallback)
        await api.transactions.syncMissing();

        // SSoT: busca transações reais + resumo anual em paralelo
        const [txList, annualSummary] = await Promise.all([
          api.transactions.list({ year: selectedYear }),
          api.transactions.summary(selectedYear),
        ]);

        setTransactions(txList);

        // Monta dados do gráfico: 12 meses do ano selecionado
        const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const chartMap = new Map(annualSummary.map((s: any) => [s.period_month, s]));
        const chartData = monthNames.map((name, i) => {
          const row = chartMap.get(i + 1);
          return {
            name,
            receita: Number(row?.total_revenue ?? 0),
            despesas: Number(row?.total_expenses ?? 0),
          };
        });
        setMonthlyData(chartData);

        // KPIs: soma de todos os meses do ano
        const totalRevenue  = annualSummary.reduce((s: number, r: any) => s + Number(r.total_revenue),  0);
        const totalExpenses = annualSummary.reduce((s: number, r: any) => s + Number(r.total_expenses), 0);
        const pendingAmount = annualSummary.reduce((s: number, r: any) => s + Number(r.pending_amount), 0);
        setFinancials({
          balance:       totalRevenue - totalExpenses,
          totalRevenue,
          totalExpenses,
          pendingAmount,
        });
      } catch (error) {
        console.error('Error fetching financials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, [selectedYear]);

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
      const created = await api.transactions.create({
        type:        newTransaction.type as 'income' | 'expense',
        description: newTransaction.description,
        category:    newTransaction.category,
        amount:      parseFloat(newTransaction.amount),
        status:      newTransaction.status === 'Pago' ? 'paid' : 'pending',
        date:        newTransaction.date,
      });

      if (created) {
        // Atualização imediata do estado local com dado real do banco
        setTransactions(prev => [created, ...prev]);

        // Recalcula KPIs localmente sem precisar de nova fetch
        const amount = created.amount;
        setFinancials(prev => {
          if (created.type === 'income') {
            const addRevenue  = created.status === 'paid'    ? amount : 0;
            const addPending  = created.status === 'pending' ? amount : 0;
            return {
              ...prev,
              totalRevenue:  prev.totalRevenue  + addRevenue,
              pendingAmount: prev.pendingAmount  + addPending,
              balance:       prev.balance        + addRevenue,
            };
          } else {
            const addExpense = created.status === 'paid' ? amount : 0;
            return {
              ...prev,
              totalExpenses: prev.totalExpenses + addExpense,
              balance:       prev.balance       - addExpense,
            };
          }
        });
      }

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
      await api.transactions.delete(id);
      const removed = transactions.find(t => t.id === id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      // Recalcula KPIs localmente
      if (removed) {
        const amount = Number(removed.amount);
        setFinancials(prev => {
          if (removed.type === 'income') {
            const subRevenue  = removed.status === 'paid'    ? amount : 0;
            const subPending  = removed.status === 'pending' ? amount : 0;
            return {
              ...prev,
              totalRevenue:  prev.totalRevenue  - subRevenue,
              pendingAmount: prev.pendingAmount  - subPending,
              balance:       prev.balance        - subRevenue,
            };
          } else {
            const subExpense = removed.status === 'paid' ? amount : 0;
            return {
              ...prev,
              totalExpenses: prev.totalExpenses - subExpense,
              balance:       prev.balance       + subExpense,
            };
          }
        });
      }
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

  // --- Render Functions ---

  const renderOverview = () => (
    <div className="space-y-6 animate-slide-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Atual</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.balance)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Disponível em caixa</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receitas (Total)</span>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.totalRevenue)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Total acumulado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas (Total)</span>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
          </div>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.totalExpenses)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Total acumulado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">A Receber</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg"><AlertTriangle size={20} /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.pendingAmount)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Lançamentos pendentes</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-500" />
              Fluxo de Caixa Anual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Comparativo Receitas vs Despesas</p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg p-2 cursor-pointer focus:ring-0"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
              />
              <Area type="monotone" dataKey="receita" name="Receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4 animate-slide-up">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar lançamentos..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
            <Filter size={16} /> Filtros
          </button>
          <button
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-primary-600 dark:bg-secondary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 dark:hover:bg-secondary-700 transition-colors shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Descrição / Categoria</th>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Valor</th>
                <th className="px-6 py-4 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                        {t.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'Pago'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'expense' ? '-' : ''} R$ {t.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Gerador de Recibos e Notas</h3>
            <p className="text-slate-300 text-sm max-w-md">Emita documentos profissionais para seus pacientes automaticamente. Histórico completo de emissões disponível abaixo.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex items-center gap-4">
            <div className="p-3 bg-primary-500 rounded-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-white/60">Recibos Emitidos (Mês)</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        <FileText className="absolute -right-6 -bottom-6 text-white/5 w-48 h-48" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white">Pagamentos Recebidos (Disponível para Recibo)</h3>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline">Configurar Modelo</button>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.filter(t => t.type === 'income' && t.status === 'Pago').map(t => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <UserIcon name={t.description} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{t.description}</p>
                  <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <span className="font-bold text-slate-800 dark:text-white">R$ {t.amount.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReceipt(t.description)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Imprimir"
                  >
                    <Printer size={16} />
                  </button>
                  <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Compartilhar">
                    <Share2 size={16} />
                  </button>
                  <button className="px-3 py-2 bg-primary-600 dark:bg-secondary-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-700 dark:hover:bg-secondary-700 transition-colors">
                    Emitir Recibo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6 animate-slide-up">
      {/* Status Card */}
      <div className={`rounded-2xl p-6 border transition-colors ${isStripeConnected
        ? 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-900/30'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              {/* Simplistic Stripe Logo Representation */}
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
              <Link size={18} className="text-primary-500" /> Links de Pagamento
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'receipts' && renderReceipts()}
        {activeTab === 'integrations' && renderIntegrations()}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Políticas de Cancelamento e Cobrança</h3>
              <p className="text-sm text-slate-500 mb-6">Defina as regras automáticas para cobrança de taxas.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Prazo para Cancelamento Gratuito</label>
                  <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-700 dark:text-white">
                    <option>24 horas de antecedência</option>
                    <option>48 horas de antecedência</option>
                  </select>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Taxa de No-Show</label>
                  <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-700 dark:text-white">
                    <option>50% do valor da sessão</option>
                    <option>100% do valor da sessão</option>
                  </select>
                </div>
              </div>
              <button onClick={() => showNotification("Políticas salvas!", "success")} className="mt-4 px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold">Salvar Preferências</button>
            </div>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTransactionModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-800 dark:text-white">Novo Lançamento</h3>
              <button onClick={() => setIsTransactionModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'income' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <ArrowUpCircle size={16} /> Receita
                </button>
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'expense' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <ArrowDownCircle size={16} /> Despesa
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Descrição</label>
                <input
                  type="text"
                  placeholder={newTransaction.type === 'income' ? 'Ex: Sessão Paciente X' : 'Ex: Aluguel Sala'}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Data</label>
                  <input
                    type="date"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Categoria</label>
                <select
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                >
                  {newTransaction.type === 'income' ? (
                    <>
                      <option>Sessão TRG</option>
                      <option>Pacote de Sessões</option>
                      <option>Taxa de Cancelamento</option>
                      <option>Outros</option>
                    </>
                  ) : (
                    <>
                      <option>Aluguel / Condomínio</option>
                      <option>Marketing</option>
                      <option>Software / Sistemas</option>
                      <option>Impostos</option>
                      <option>Utilidades</option>
                      <option>Outros</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, status: 'Pago' })}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${newTransaction.status === 'Pago' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200' : 'bg-transparent border-slate-200 text-slate-400'}`}
                  >
                    {newTransaction.type === 'income' ? 'Recebido' : 'Pago'}
                  </button>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, status: 'Pendente' })}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${newTransaction.status === 'Pendente' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200' : 'bg-transparent border-slate-200 text-slate-400'}`}
                  >
                    Pendente
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveTransaction}
                className="w-full py-3 bg-primary-600 dark:bg-secondary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 dark:shadow-secondary-600/30 transition-all active:scale-95 mt-2"
              >
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Payment Link Modal */}
      {isPaymentLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaymentLinkModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-[#635BFF] flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Globe size={20} />
                <h3 className="font-bold">Gerar Link de Checkout</h3>
              </div>
              <button onClick={() => setIsPaymentLinkModalOpen(false)}><X size={20} className="text-white/70 hover:text-white" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Título do Serviço</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  value={paymentLinkData.title}
                  onChange={(e) => setPaymentLinkData({ ...paymentLinkData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor (BRL)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white font-bold"
                    value={paymentLinkData.price}
                    onChange={(e) => setPaymentLinkData({ ...paymentLinkData, price: e.target.value })}
                  />
                </div>
              </div>

              {paymentLinkData.generatedLink ? (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-fade-in">
                  <p className="text-xs text-green-700 dark:text-green-400 font-bold mb-2 uppercase flex items-center gap-1">
                    <CheckCircle2 size={12} /> Link Gerado com Sucesso
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={paymentLinkData.generatedLink}
                      className="flex-1 text-xs bg-white dark:bg-slate-800 p-2 rounded border border-green-200 dark:border-green-800 text-slate-600 dark:text-slate-300"
                    />
                    <button onClick={copyToClipboard} className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateLink}
                  className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 mt-2 flex justify-center gap-2"
                >
                  <Link size={18} /> Criar Link
                </button>
              )}
            </div>

            {paymentLinkData.clientSecret && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4">Pagamento Seguro</h4>
                <Elements stripe={stripePromise} options={{ clientSecret: paymentLinkData.clientSecret, locale: 'pt-BR' }}>
                  <CheckoutForm onSuccess={() => {
                    setIsPaymentLinkModalOpen(false);
                    showNotification("Pagamento realizado com sucesso!", "success");
                  }} />
                </Elements>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialView;
