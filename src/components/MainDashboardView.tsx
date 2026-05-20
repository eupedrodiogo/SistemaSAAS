import React, { useState, useEffect } from 'react';
import { AppView } from '../enums';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  Loader2,
  Link
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

const MainDashboardView: React.FC<MainDashboardViewProps> = ({ onChangeView, therapist }) => {

  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  // Filtering Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patients, appointments] = await Promise.all([
          api.patients.list(),
          api.appointments.list()
        ]);

        // 1. Filter Appointments for Selected Month
        const selMonth = selectedDate.getMonth();
        const selYear = selectedDate.getFullYear();

        const currentMonthAppointments = appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate.getMonth() === selMonth &&
            appDate.getFullYear() === selYear &&
            (app.status !== 'cancelled' && app.status !== 'Cancelado');
        });

        // 2. Filter Appointments for Previous Month (for comparison)
        const prevDate = new Date(selYear, selMonth - 1, 1);
        const prevMonth = prevDate.getMonth();
        const prevYear = prevDate.getFullYear();

        const prevMonthAppointments = appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate.getMonth() === prevMonth &&
            appDate.getFullYear() === prevYear &&
            (app.status !== 'cancelled' && app.status !== 'Cancelado');
        });

        // 3. Stats Calculation
        const sessionsThisMonth = currentMonthAppointments.length;
        const sessionsLastMonth = prevMonthAppointments.length;

        // Revenue
        const revenue = currentMonthAppointments.reduce((sum, app) => sum + (app.sessionData?.price ?? therapist?.price ?? 0), 0);
        const revenueLastMonth = prevMonthAppointments.reduce((sum, app) => sum + (app.sessionData?.price ?? therapist?.price ?? 0), 0);

        // Patients (New patients in month vs total?) 
        // Showing Total Active Patients usually doesn't change by month selection unless we track 'active at date'.
        // For simplicity, we'll keep Total Active Patients but maybe show "New Patients" growth?
        // Let's keep Total Active for now as it's a current snapshot.
        const patientsCount = patients.length;

        // Calculate Deltas
        const calcDelta = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? '+100%' : '0%';
          const delta = ((curr - prev) / prev) * 100;
          return (delta > 0 ? '+' : '') + delta.toFixed(0) + '%';
        };

        setDashboardStats({
          patientsCount,
          sessionsThisMonth,
          revenue: revenue,
          revenueDelta: calcDelta(revenue, revenueLastMonth),
          sessionsDelta: calcDelta(sessionsThisMonth, sessionsLastMonth)
        });

        // 4. Chart Data (Last 6 months ENDING at Selected Date)
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(selYear, selMonth - i, 1);
          const monthName = d.toLocaleString('pt-BR', { month: 'short' });
          const y = d.getFullYear();
          const m = d.getMonth();

          const count = appointments.filter(app => {
            const [aYear, aMonth] = app.date.split('-').map(Number);
            // aMonth is 1-indexed in string (e.g. 01), but we seek to match 0-indexed 'm'
            // Wait, d.getMonth() returns 0-11.
            // split gives 1, 2...
            return (aMonth - 1) === m && aYear === y &&
              (app.status !== 'cancelled' && app.status !== 'Cancelado');
          }).length;

          // Title case for month name
          const label = monthName.charAt(0).toUpperCase() + monthName.slice(1);
          last6Months.push({ name: label, sessions: count });
        }
        setChartData(last6Months);

        // 5. Upcoming Appointments (Filter by selected month if not "current"?) 
        // If selected date is in future, show future. If past, show past?
        // Let's show appointments for the SELECTED month.
        const monthApps = currentMonthAppointments
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5); // Show top 5

        setUpcomingAppointments(monthApps);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]); // Re-run when selectedDate changes

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Painel Geral
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Visão geral do consultório em <strong className="text-primary-600">{months[selectedDate.getMonth()].label}/{selectedDate.getFullYear()}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              navigator.clipboard.writeText(url);
              alert('Link de agendamento copiado para a área de transferência!\n' + url);
            }}
            className="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-indigo-200 dark:border-indigo-700"
            title="Link direto para pacientes agendarem com você"
          >
            <Link size={16} />
            <span className="hidden sm:inline">Copiar Meu Link</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Evolução de Sessões
            </h3>
            <Activity size={18} className="text-slate-400" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Next Appointments */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Próximos Agendamentos
            </h3>
            <Clock size={18} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, i) => {
                // Parse date manually to avoid timezone shift
                const [year, month, day] = apt.date.split('-').map(Number);
                const appDate = new Date(year, month - 1, day); // Local midnight

                // Use stored time directly (formatted to HH:MM)
                const timeString = apt.time ? apt.time.substring(0, 5) : '00:00';

                const dateString = appDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                const today = new Date();
                const isToday = appDate.getDate() === today.getDate() &&
                  appDate.getMonth() === today.getMonth() &&
                  appDate.getFullYear() === today.getFullYear();

                return (
                  <div key={i} className="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-3 py-2 rounded text-sm flex flex-col items-center">
                      <span>{timeString}</span>
                      <span className="text-[10px] font-normal text-slate-400">{isToday ? 'Hoje' : dateString}</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-slate-800 dark:text-white">
                        {apt.patients?.name || apt.patientName || 'Cliente sem nome'}
                      </h4>
                      <p className="text-xs text-slate-500">{apt.type}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>Sem agendamentos futuros.</p>
              </div>
            )}

            <button
              onClick={() => onChangeView(AppView.AGENDA)}
              className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium text-center border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboardView;