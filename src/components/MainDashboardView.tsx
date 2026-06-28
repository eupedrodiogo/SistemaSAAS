import React, { useState, useEffect } from 'react';
import { AppView } from '../enums';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  Loader2,
  Link,
  Heart
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import NotificationBell from './NotificationBell';
import PushNotificationManager from './PushNotificationManager';

interface MainDashboardViewProps {
  onChangeView: (view: AppView, params?: any) => void;
  therapist?: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-3 rounded-xl shadow-xl flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {payload[0].value} {payload[0].value === 1 ? 'sessão' : 'sessões'}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const MainDashboardView: React.FC<MainDashboardViewProps> = ({ onChangeView, therapist }) => {

  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartPeriod, setChartPeriod] = useState<number>(6);
  const [chartMetric, setChartMetric] = useState<'sessions' | 'revenue'>('sessions');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    patientsCount: 0,
    sessionsThisMonth: 0,
    revenue: 0,
    revenueDelta: '+0%',
    sessionsDelta: '+0%'
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  // Filtering Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        const selMonth = selectedDate.getMonth();
        const selYear = selectedDate.getFullYear();
        const prevDate = new Date(selYear, selMonth - 1, 1);
        const prevMonth = prevDate.getMonth();
        const prevYear = prevDate.getFullYear();

        // ── SSoT: busca dados reais em paralelo ──────────────────────
        const [patients, appointments, currentSummary, prevSummary, transactions] = await Promise.all([
          api.patients.list(),
          api.appointments.list(),
          // Receita real do mês selecionado (via tabela transactions)
          api.transactions.summary(selYear, selMonth + 1),
          // Receita real do mês anterior (para calcular delta)
          api.transactions.summary(prevYear, prevMonth + 1),
          api.transactions.list(), // Lista completa para o histórico do gráfico
        ]);
 
         // 1. Filtra agendamentos para contagem de sessões (não para receita!)
         const currentMonthAppointments = appointments.filter(app => {
           const appDate = new Date(app.date);
           return appDate.getMonth() === selMonth &&
             appDate.getFullYear() === selYear &&
             app.status !== 'cancelled' && app.status !== 'Cancelado';
         });
 
         const prevMonthAppointments = appointments.filter(app => {
           const appDate = new Date(app.date);
           return appDate.getMonth() === prevMonth &&
             appDate.getFullYear() === prevYear &&
             app.status !== 'cancelled' && app.status !== 'Cancelado';
         });
 
         const sessionsThisMonth = currentMonthAppointments.length;
         const sessionsLastMonth = prevMonthAppointments.length;
 
         // ── Receita vem da tabela transactions (SSoT) ─────────────────
         const revenue = Number(currentSummary[0]?.total_revenue ?? 0);
         const revenueLastMonth = Number(prevSummary[0]?.total_revenue ?? 0);
         const patientsCount = patients.length;
 
         const calcDelta = (curr: number, prev: number) => {
           if (prev === 0) return curr > 0 ? '+100%' : '0%';
           const delta = ((curr - prev) / prev) * 100;
           return (delta > 0 ? '+' : '') + delta.toFixed(0) + '%';
         };
 
         setDashboardStats({
           patientsCount,
           sessionsThisMonth,
           revenue,
           revenueDelta: calcDelta(revenue, revenueLastMonth),
           sessionsDelta: calcDelta(sessionsThisMonth, sessionsLastMonth)
         });
 
        // 2. Gráfico histórico: sessões ou faturamento (calculado com base nas escolhas)
        const historyData = [];
        for (let i = chartPeriod - 1; i >= 0; i--) {
          const d = new Date(selYear, selMonth - i, 1);
          const monthName = d.toLocaleString('pt-BR', { month: 'short' });
          const y = d.getFullYear();
          const m = d.getMonth();

          if (chartMetric === 'sessions') {
            const count = appointments.filter(app => {
              const [aYear, aMonth] = app.date.split('-').map(Number);
              return (aMonth - 1) === m && aYear === y &&
                app.status !== 'cancelled' && app.status !== 'Cancelado';
            }).length;

            historyData.push({
              name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
              value: count
            });
          } else {
            const totalRevenue = transactions
              .filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === m && 
                       tDate.getFullYear() === y && 
                       t.type === 'income' && 
                       t.status === 'paid';
              })
              .reduce((sum, t) => sum + Number(t.amount), 0);

            historyData.push({
              name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
              value: totalRevenue
            });
          }
        }
        setChartData(historyData);

        // 3. Próximos agendamentos (filtra apenas futuros e não concluídos)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isAppCompleted = (app: any) => {
          // Apenas consideramos finalizado se o status for explicitamente setado pelo botão "Finalizar Sessão"
          return app.status === 'Concluído' || app.status === 'Realizado' || app.status === 'completed';
        };

        const upcomingApps = appointments.filter(app => {
          const [year, month, day] = app.date.split('-').map(Number);
          const appDate = new Date(year, month - 1, day);
          return appDate >= today && 
                 app.status !== 'cancelled' && 
                 app.status !== 'Cancelado' && 
                 !isAppCompleted(app);
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
        
        setUpcomingAppointments(upcomingApps);

        // 4. Últimas sessões realizadas
        const completedApps = appointments.filter(app => isAppCompleted(app))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

        setRecentSessions(completedApps);

      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, chartPeriod, chartMetric]);

  const stats = [
    {
      label: 'Pacientes Ativos',
      value: loading ? '...' : dashboardStats.patientsCount.toString(),
      change: '+0', // Static for total
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => onChangeView(AppView.PATIENTS)
    },
    {
      label: 'Sessões',
      value: loading ? '...' : dashboardStats.sessionsThisMonth.toString(),
      change: (dashboardStats as any).sessionsDelta || '0%',
      icon: Calendar,
      color: 'bg-purple-500',
      onClick: () => onChangeView(AppView.AGENDA)
    },
    {
      label: 'Faturamento',
      value: loading ? '...' : `R$ ${dashboardStats.revenue.toLocaleString('pt-BR')}`,
      change: (dashboardStats as any).revenueDelta || '0%',
      icon: DollarSign,
      color: 'bg-green-500',
      onClick: () => onChangeView(AppView.FINANCIAL)
    },
  ];

  // Date Controls
  const months = [
    { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // 2 years back, 2 years forward

  const nextAppointmentCard = (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-white">
          A Próxima Sessão
        </h3>
        <Clock size={18} className="text-slate-400" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {upcomingAppointments.length > 0 ? (
          [upcomingAppointments[0]].map((apt, i) => {
            const [year, month, day] = apt.date.split('-').map(Number);
            const appDate = new Date(year, month - 1, day);
            const timeString = apt.time ? apt.time.substring(0, 5) : '00:00';
            const dateString = appDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const today = new Date();
            const isToday = appDate.getDate() === today.getDate() &&
              appDate.getMonth() === today.getMonth() &&
              appDate.getFullYear() === today.getFullYear();

            return (
              <div key={i} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-2 rounded text-sm flex flex-col items-center min-w-[60px]">
                    <span>{timeString}</span>
                    <span className="text-[10px] font-normal opacity-80">{isToday ? 'Hoje' : dateString}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate" title={apt.patients?.name || apt.patientName || 'Cliente sem nome'}>
                      {apt.patients?.name || apt.patientName || 'Cliente sem nome'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{apt.type}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const patientIdToUse = apt.patientId || apt.patient_id || '';
                    localStorage.setItem('TRG_CURRENT_PATIENT_ID', patientIdToUse);
                    localStorage.setItem('TRG_CURRENT_APPOINTMENT_ID', apt.id);
                    onChangeView(AppView.THERAPY, { appointmentId: apt.id, patientId: patientIdToUse });
                  }}
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center"
                >
                  Entrar na Sessão
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-slate-500 dark:text-slate-400">
            <Calendar size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">Sem agendamentos futuros.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Painel Geral
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Visão geral do consultório em <strong className="text-primary-600">{months[selectedDate.getMonth()].label}/{selectedDate.getFullYear()}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selectors */}
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
            <select
              value={selectedDate.getMonth()}
              onChange={(e) => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(parseInt(e.target.value));
                setSelectedDate(newDate);
              }}
              className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none px-2 py-1 cursor-pointer"
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <select
              value={selectedDate.getFullYear()}
              onChange={(e) => {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(parseInt(e.target.value));
                setSelectedDate(newDate);
              }}
              className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none px-2 py-1 cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <PushNotificationManager />
          <NotificationBell role="therapist" />
          
          <button
            onClick={() => {
              const url = `${window.location.origin}/agendar/u/${therapist?.id}`;
              if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url)
                  .then(() => toast.success('Link de agendamento copiado!'))
                  .catch(() => toast.error('Não foi possível copiar. URL: ' + url));
              } else {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                  document.execCommand('copy');
                  toast.success('Link de agendamento copiado!');
                } catch (err) {
                  toast.error('Copie manualmente: ' + url);
                }
                textArea.remove();
              }
            }}
            className="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-indigo-200 dark:border-indigo-700"
            title="Link direto para pacientes pagantes agendarem com você"
          >
            <Link size={16} />
            <span className="hidden sm:inline">Copiar Link Pagantes</span>
            <span className="sm:hidden">Pagantes</span>
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/convite-anjo/${therapist?.id}`;
              if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url)
                  .then(() => toast.success('Link Anjo copiado!'))
                  .catch(() => toast.error('Não foi possível copiar. URL: ' + url));
              } else {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                  document.execCommand('copy');
                  toast.success('Link Anjo copiado!');
                } catch (err) {
                  toast.error('Copie manualmente: ' + url);
                }
                textArea.remove();
              }
            }}
            className="bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-rose-200 dark:border-rose-700"
            title="Link para Atendimento Gratuito (Anjo)"
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Copiar Link Anjo</span>
            <span className="sm:hidden">Anjo</span>
          </button>

          <button
            onClick={() => onChangeView(AppView.AGENDA)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Calendar size={16} />
            Nova Sessão
          </button>
        </div>
      </div>


      {/* KPI Cards & Próxima Sessão */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {nextAppointmentCard}
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-full`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                  {stat.value}
                  {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 text-${stat.color.replace('bg-', '')}`}>
                <stat.icon size={20} className={stat.color.replace('bg-', 'text-')} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium flex items-center gap-1">
                <TrendingUp size={14} />
                {stat.change}
              </span>
              <span className="text-slate-400 ml-2">vs. mês passado</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sessions Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm order-2 lg:order-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-indigo-500 dark:text-indigo-400" />
              {chartMetric === 'sessions' ? 'Evolução de Sessões' : 'Evolução de Faturamento'}
            </h3>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Segmented Control de Métrica */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setChartMetric('sessions')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartMetric === 'sessions'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Sessões
                </button>
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartMetric === 'revenue'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Faturamento
                </button>
              </div>

              {/* Seletor de Período */}
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              >
                <option value={3}>3M</option>
                <option value={6}>6M</option>
                <option value={12}>12M</option>
              </select>
            </div>
          </div>

          <div className="h-[240px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Gradiente de Preenchimento da Área */}
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Gradiente do Contorno da Linha */}
                  <linearGradient id="colorStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>

                  {/* Efeito Glow / Sombra da Linha */}
                  <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.22" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-5}
                />
                <Tooltip
                  content={<CustomTooltip metric={chartMetric} />}
                  cursor={{ stroke: 'rgba(99, 102, 241, 0.12)', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="url(#colorStroke)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                  filter="url(#shadow)"
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#06b6d4' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Right Column Content */}
        <div className="flex flex-col h-full order-1 lg:order-1">
          {/* Agenda do Dia */}
          <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Sua Agenda do Dia
            </h3>
            <Calendar size={18} className="text-slate-400" />
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, i) => {
                const [year, month, day] = apt.date.split('-').map(Number);
                const appDate = new Date(year, month - 1, day);
                const timeString = apt.time ? apt.time.substring(0, 5) : '00:00';
                const dateString = appDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const today = new Date();
                const isToday = appDate.getDate() === today.getDate() &&
                  appDate.getMonth() === today.getMonth() &&
                  appDate.getFullYear() === today.getFullYear();

                return (
                  <div key={`agenda-${i}`} className="flex items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mb-3 last:mb-0">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-3 py-1.5 rounded text-sm flex flex-col items-center">
                      <span>{timeString}</span>
                      <span className="text-[10px] font-normal text-slate-400">{isToday ? 'Hoje' : dateString}</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-slate-800 dark:text-white">
                        {apt.patients?.name || apt.patientName || 'Cliente sem nome'}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{apt.type}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <Calendar size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum agendamento futuro.</p>
              </div>
            )}
            
            </div>
            
            <button
              onClick={() => onChangeView(AppView.AGENDA)}
              className="w-full mt-2 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium text-center border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default MainDashboardView;