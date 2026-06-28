import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinancialOverviewProps {
  loading: boolean;
  financials: {
    balance: number;
    totalRevenue: number;
    totalExpenses: number;
    pendingAmount: number;
  };
  monthlyData: any[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ loading, financials, monthlyData, selectedYear, setSelectedYear }) => {
  return (
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
};
