
import React, { useState, useEffect } from 'react';
import OptimizationModal from './OptimizationModal';
import {
   ChevronLeft,
   ChevronRight,
   Calendar as CalendarIcon,
   Clock,
   Plus,
   LayoutGrid,
   List,
   Download,
   X,
   User,
   CheckCircle2,
   AlertTriangle,
   Ban,
   Trash2,
   Zap,
   Search,
   MoreHorizontal,
   DollarSign,
   Percent,
   BrainCircuit,
   CalendarDays,
   Filter,
   Sun,
   Cloud,
   Sparkles,
   AlertCircle,
   Wand2
} from 'lucide-react';
import { DEFAULT_BLOCKED_TIMES } from '../constants';
import { Appointment, BlockedTime } from 'types';
import { api } from '../services/api';
import { AddToCalendar } from './AddToCalendar';

type ViewType = 'day' | 'week' | 'month' | 'list';

interface CalendarViewProps {
   onNavigateToPatient?: (id: string) => void;
   onNavigateToSession?: (patientId: string) => void;
   initialAction?: 'create' | null;
   onActionConsumed?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToPatient, onNavigateToSession, initialAction, onActionConsumed }) => {
   const [currentDate, setCurrentDate] = useState(new Date());
   const [selectedDay, setSelectedDay] = useState<Date>(new Date());
   const [viewType, setViewType] = useState<ViewType>('month');
   const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string>('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
   const [suggestedSlot, setSuggestedSlot] = useState<{ date: string, time: string } | null>(null);
   const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
   const [blockForm, setBlockForm] = useState({ type: 'date', date: '', dayOfWeek: 1, startTime: '12:00', endTime: '13:00', label: '' });
   const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);
   const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
   const [optimizationData, setOptimizationData] = useState<any>(null);

   // Trigger initial action
   useEffect(() => {
      if (initialAction === 'create') {
         setTimeout(() => {
            handleManualAdd();
            if (onActionConsumed) onActionConsumed();
         }, 500);
      }
   }, [initialAction]);

   useEffect(() => {
      const fetchBlockedTimes = async () => {
         const times = await api.blockedTimes.list();
         if (times) setBlockedTimes(times);
      };
      fetchBlockedTimes();
   }, []);

   const formatDateKey = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
   };

   const isSameDate = (date1: Date, date2: Date) => {
      return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
   };

   const filteredAppointments = appointments.filter(apt => {
      if (statusFilter === 'all') return true;
      return apt.status === statusFilter;
   });

   const calculateInsights = () => {
      const totalSessions = filteredAppointments.length;
      const revenue = filteredAppointments.filter(a => a.status === 'completed' || a.status === 'scheduled').length * 250;
      const maxDailySlots = 8 * 5 * 4; // Approx slots per month (8 hours * 5 days * 4 weeks) - naive estimation
      const occupancy = totalSessions > 0 ? Math.min(Math.round((totalSessions / maxDailySlots) * 100), 100) : 0;
      return { totalSessions, revenue, occupancy };
   };

   const insights = calculateInsights();

   useEffect(() => {
      let mounted = true;
      setLoading(true);
      setError('');
      api.appointments.list()
         .then((data: Appointment[]) => { if (mounted) setAppointments(data); })
         .catch(() => { if (mounted) setError('Falha ao carregar agenda'); })
         .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
   }, []);

   const safeParseDate = (value: string) => {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
   };
   const safeHour = (t: string) => {
      if (!t || !t.includes(':')) return NaN;
      const h = parseInt(t.split(':')[0]);
      return isNaN(h) ? NaN : h;
   };
   const safeMinute = (t: string) => {
      if (!t || !t.includes(':')) return '00';
      const m = t.split(':')[1];
      return m || '00';
   };

   const showNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(null), 5000);
   };

   const isSlotConflicting = (date: Date, time: string): boolean => {
      const dateKey = formatDateKey(date);
      const hour = parseInt(time.split(':')[0]);

      // Check Appointments
      const hasAppointment = filteredAppointments.some(apt => {
         const isCanceled = apt.status === 'cancelled' || apt.status === 'Cancelado';

         return (
            apt.date === dateKey &&
            parseInt(apt.time.split(':')[0]) === hour &&
            !isCanceled
         );
      });

      if (hasAppointment) return true;

      // Check Blocked Times
      const dayOfWeek = date.getDay();
      const isBlocked = blockedTimes.some(block =>
         ((block.date === dateKey) || (block.dayOfWeek !== undefined && block.dayOfWeek === dayOfWeek)) &&
         hour >= parseInt(block.startTime.split(':')[0]) &&
         hour < parseInt(block.endTime.split(':')[0])
      );

      return isBlocked;
   };

   const handleCancelAppointment = () => {
      if (!selectedAppointment) return;
      const id = selectedAppointment.id;

      api.appointments.update(id, { status: 'cancelled' })
         .then((updated) => {
            setAppointments(prev => prev.map(a => a.id === id ? (updated as Appointment) : a));
            showNotification('Agendamento cancelado.', 'warning');
         })
         .catch(() => showNotification('Erro ao cancelar.', 'error'))
         .finally(() => setSelectedAppointment(null));
   };

   const handleReschedule = () => {
      if (!selectedAppointment) return;
      setSelectedAppointment(null);
      showNotification('Modo de reagendamento iniciado.', 'info');
   };

   const handleUpdatePrice = async (newPrice: number) => {
      if (!selectedAppointment) return;
      try {
         const updated = await api.appointments.update(selectedAppointment.id, {
            sessionData: { ...selectedAppointment.sessionData, price: newPrice }
         });
         if (updated) {
            setAppointments(prev => prev.map(a => a.id === updated.id ? updated as Appointment : a));
            setSelectedAppointment(updated as Appointment);
            showNotification('Valor atualizado com sucesso!', 'success');
         }
      } catch (error) {
         showNotification('Erro ao atualizar valor.', 'error');
      }
   };

   const handleFindSlot = () => {
      showNotification('IA: Buscando próxima vaga disponível...', 'info');

      const findNextAvailableSlot = () => {
         const today = new Date();
         const next30Days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() + i + 1); // Start from tomorrow
            return d;
         });

         for (const date of next30Days) {
            // Check hours from 08:00 to 18:00
            for (let hour = 8; hour < 18; hour++) {
               const timeString = `${hour.toString().padStart(2, '0')}:00`;
               if (!isSlotConflicting(date, timeString)) {
                  return { date, time: timeString };
               }
            }
         }
         return null;
      };

      setTimeout(() => {
         const slot = findNextAvailableSlot();
         if (slot) {
            const dateKey = formatDateKey(slot.date);
            setSuggestedSlot({ date: dateKey, time: slot.time });
            setCurrentDate(slot.date);
            setSelectedDay(slot.date);
            // Switch to week view to visualize better
            if (viewType === 'month' || viewType === 'list') setViewType('week');

            showNotification(`Vaga encontrada: ${slot.date.toLocaleDateString('pt-BR')} às ${slot.time}`, 'success');

            // Auto clear suggestion after 10s
            setTimeout(() => setSuggestedSlot(null), 10000);
         } else {
            showNotification('Nenhuma vaga encontrada nos próximos 30 dias.', 'warning');
         }
      }, 500); // Small delay for UX "thinking" feel
   };

   const handleOptimizeSchedule = async () => {
      const confirmOptimize = window.confirm("A IA irá analisar os agendamentos desta semana para sugerir melhorias de produtividade. Deseja continuar?");
      if (!confirmOptimize) return;

      showNotification("IA: Analisando padrões de agendamento...", "info");

      try {
         // Get appointments for the currently viewed period (simplified to current week context)
         const weekStart = new Date(currentDate);
         weekStart.setDate(weekStart.getDate() - weekStart.getDay());
         const weekEnd = new Date(weekStart);
         weekEnd.setDate(weekEnd.getDate() + 6);

         const periodAppointments = appointments.filter(apt => {
            const d = safeParseDate(apt.date);
            return d >= weekStart && d <= weekEnd;
         });

         if (periodAppointments.length === 0) {
            showNotification("Sem agendamentos nesta semana para otimizar.", "warning");
            return;
         }

         const response = await fetch('/api/ai/optimize', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${localStorage.getItem('trg_token')}` // Ensure auth if needed, though usually cookie based in this stack
            },
            body: JSON.stringify({
               appointments: periodAppointments,
               blockedTimes: blockedTimes,
               dateRange: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
            })
         });

         if (response.ok) {
            const data = await response.json();
            setOptimizationData(data);
            setIsOptimizationModalOpen(true);
            showNotification("Análise de otimização concluída!", "success");
         } else {
            throw new Error('Falha na resposta da IA');
         }

      } catch (error) {
         console.error(error);
         showNotification("Erro ao conectar com a IA de otimização.", "error");
      }
   };

   const handleSaveBlock = async () => {
      if (!blockForm.label || !blockForm.startTime || !blockForm.endTime) { showNotification('Preencha todos os campos.', 'warning'); return; }

      try {
         const payload: any = {
            startTime: blockForm.startTime,
            endTime: blockForm.endTime,
            label: blockForm.label
         };

         if (blockForm.type === 'weekly') {
            payload.dayOfWeek = Number(blockForm.dayOfWeek);
         } else {
            payload.date = blockForm.date || formatDateKey(selectedDay);
         }

         const newBlock = await api.blockedTimes.create(payload);

         const updatedBlocks = [...blockedTimes, newBlock];
         setBlockedTimes(updatedBlocks);
         setIsBlockModalOpen(false);
         showNotification('Horário bloqueado com sucesso.', 'success');
      } catch (e) {
         showNotification('Erro ao bloquear horário.', 'error');
      }
   };

   const openBlockModal = () => {
      setBlockForm(prev => ({ ...prev, type: 'date', date: formatDateKey(selectedDay), startTime: '09:00', endTime: '10:00', label: '' }));
      setIsBlockModalOpen(true);
   };

   const handleManualAdd = () => {
      const now = new Date();
      let time = '08:00';

      // If selected day is today, try to suggest next hour
      if (selectedDay.getDate() === now.getDate() && selectedDay.getMonth() === now.getMonth() && selectedDay.getFullYear() === now.getFullYear()) {
         const h = now.getHours() + 1;
         if (h >= 8 && h < 18) time = `${h.toString().padStart(2, '0')}:00`;
      }

      // Try to find a free slot starting from default time
      let h = parseInt(time.split(':')[0]);
      while (h < 18) {
         const t = `${h.toString().padStart(2, '0')}:00`;
         if (!isSlotConflicting(selectedDay, t)) {
            time = t;
            break;
         }
         h++;
      }

      handleQuickAdd(selectedDay, time);
   };

   const handleQuickAdd = (date: Date, time: string) => {
      if (isSlotConflicting(date, time)) {
         showNotification("Este horário já está ocupado ou bloqueado.", "error");
         return;
      }
      if (window.confirm(`Agendar novo paciente para ${time}?`)) {
         const dateKey = formatDateKey(date);
         api.appointments.create({
            date: dateKey,
            time,
            status: 'scheduled',
            type: 'Anamnese',
            patientId: 'unregistered',
            patientName: 'Paciente (A definir)',
         }).then((created) => {
            setAppointments(prev => [created as Appointment, ...prev]);
            showNotification('Agendamento pré-criado. Edite para vincular um paciente.', 'success');
            setTimeout(() => setSelectedAppointment(created as Appointment), 100);
         }).catch(() => showNotification('Erro ao criar agendamento.', 'error'));
      }
   }

   const handleExportICS = () => {
      try {
         const header = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TeraNexus//PT-BR\n";
         const footer = "END:VCALENDAR";
         const events = filteredAppointments.map(apt => {
            const start = (apt?.date || '').replace(/-/g, '') + 'T' + (apt?.time || '00:00').replace(':', '') + '00';
            const hour = safeHour(apt?.time || '');
            const endHour = isNaN(hour) ? 0 : hour + 1;
            const end = (apt?.date || '').replace(/-/g, '') + 'T' + endHour.toString().padStart(2, '0') + safeMinute(apt?.time || '') + '00';
            return `BEGIN:VEVENT\nUID:${apt.id}@teranexus.com\nSUMMARY:Sessão TRG - ${apt.patientName}\nDESCRIPTION:Protocolo: ${apt.type}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`;
         }).join('\n');
         const blob = new Blob([header + events + footer], { type: 'text/calendar' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a'); a.href = url; a.download = 'agenda_trg.ics'; a.click(); window.URL.revokeObjectURL(url);
         showNotification("Arquivo ICS gerado!", "success");
      } catch (e) { showNotification("Erro ao exportar.", "warning"); }
   };

   const handleApplyOptimization = async () => {
      if (!optimizationData || !optimizationData.suggestions) return;

      setIsOptimizationModalOpen(false);
      showNotification("IA: Aplicando otimizações...", "info");

      try {
         const suggestions = optimizationData.suggestions;
         let appliedCount = 0;

         // Execute updates in parallel
         await Promise.all(suggestions.map(async (suggestion: any) => {
            if (suggestion.originalAppointmentId) {
               await api.appointments.update(suggestion.originalAppointmentId, {
                  date: suggestion.suggestedDate,
                  time: suggestion.suggestedTime
               });
               appliedCount++;
            }
         }));

         // Refresh the calendar
         const refreshed = await api.appointments.list();
         setAppointments(refreshed);

         showNotification(`${appliedCount} agendamentos otimizados com sucesso!`, "success");
         setOptimizationData(null); // Clear data

      } catch (error) {
         console.error("Error applying optimization:", error);
         showNotification("Erro ao aplicar as mudanças.", "error");
      }
   };

   const handleStartSession = () => {
      if (!selectedAppointment) return;

      console.log("Starting session for:", selectedAppointment.patientName);

      // Save patient ID to localStorage so SessionView can pick it up
      localStorage.setItem('TRG_CURRENT_PATIENT_ID', selectedAppointment.patientId);
      localStorage.setItem('TRG_CURRENT_APPOINTMENT_ID', selectedAppointment.id); // Save specific appointment for context

      // Close modal first to ensure UI feedback
      setSelectedAppointment(null);

      if (onNavigateToSession) {
         console.log("Navigating to session view...");
         onNavigateToSession(selectedAppointment.patientId);
      } else {
         console.error("onNavigateToSession callback is missing!");
      }
   };

   const handlePrev = () => { const d = new Date(currentDate); if (viewType === 'week') d.setDate(d.getDate() - 7); else if (viewType === 'day') d.setDate(d.getDate() - 1); else d.setMonth(d.getMonth() - 1); setCurrentDate(d); };
   const handleNext = () => { const d = new Date(currentDate); if (viewType === 'week') d.setDate(d.getDate() + 7); else if (viewType === 'day') d.setDate(d.getDate() + 1); else d.setMonth(d.getMonth() + 1); setCurrentDate(d); };
   const handleToday = () => { const now = new Date(); setCurrentDate(now); setSelectedDay(now); };

   const getAppointmentsForDate = (date: Date) => {
      const k = formatDateKey(date);
      const list = filteredAppointments.filter(apt => apt.date === k);
      return list.sort((a, b) => (a?.time || '').localeCompare(b?.time || ''));
   };
   const getBlockedTimeForDay = (date: Date) => {
      const d = date.getDay();
      const k = formatDateKey(date);
      return blockedTimes.filter(b => (b.date === k) || (b.dayOfWeek === d));
   };
   const weekDays = [{ val: 0, label: 'Domingo', short: 'Dom' }, { val: 1, label: 'Segunda', short: 'Seg' }, { val: 2, label: 'Terça', short: 'Ter' }, { val: 3, label: 'Quarta', short: 'Qua' }, { val: 4, label: 'Quinta', short: 'Qui' }, { val: 5, label: 'Sexta', short: 'Sex' }, { val: 6, label: 'Sábado', short: 'Sáb' }];

   const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay();

      const days = [];
      for (let i = 0; i < startDayOfWeek; i++) {
         days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
         days.push(new Date(year, month, i));
      }

      return (
         <div className="flex flex-col h-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-shrink-0">
               <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {weekDays.map(d => (
                     <div key={d.val} className="p-3 text-center text-xs font-bold uppercase text-slate-400">
                        {d.short}
                     </div>
                  ))}
               </div>
               <div className="grid grid-cols-7 auto-rows-[minmax(80px,1fr)] md:auto-rows-[120px]">
                  {days.map((date, idx) => {
                     if (!date) return <div key={idx} className="bg-slate-50/30 dark:bg-slate-950/30 border-r border-b border-slate-100 dark:border-slate-800"></div>;

                     const apts = getAppointmentsForDate(date);
                     const isToday = isSameDate(date, new Date());
                     const isSelected = isSameDate(date, selectedDay);

                     return (
                        <div
                           key={idx}
                           onClick={() => setSelectedDay(date)}
                           className={`
                        p-2 border-r border-b border-slate-100 dark:border-slate-800 relative cursor-pointer transition-colors group
                        ${isSelected ? 'bg-primary-50 dark:bg-slate-800 ring-inset ring-2 ring-primary-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                        >
                           <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-primary-600 text-white' : isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                 {date.getDate()}
                              </span>
                              <span className="hidden md:block text-[10px] font-bold text-slate-400">{apts.length > 0 ? apts.length : ''}</span>
                           </div>

                           <div className="hidden md:block space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                              {apts.map(apt => (
                                 <div
                                    key={apt.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${(apt.status === 'scheduled' || apt.status === 'Agendado') ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' :
                                       apt.status === 'pending_payment' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300' :
                                          (apt.status === 'completed' || apt.status === 'Concluído') ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' :
                                             'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                       }`}
                                 >
                                    {apt.time} {apt.patientName.split(' ')[0]}
                                 </div>
                              ))}
                           </div>

                           <div className="md:hidden flex justify-center gap-1 mt-1">
                              {apts.slice(0, 3).map(apt => (
                                 <div key={apt.id} className={`w-1.5 h-1.5 rounded-full ${(apt.status === 'scheduled' || apt.status === 'Agendado') ? 'bg-primary-500' :
                                    apt.status === 'pending_payment' ? 'bg-amber-500' :
                                       (apt.status === 'completed' || apt.status === 'Concluído') ? 'bg-green-500' :
                                          'bg-slate-300'
                                    }`} />
                              ))}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="md:hidden mt-4 animate-slide-up pb-20">
               {renderMobileMonthDetails()}
            </div>
         </div>
      );
   };

   const renderMobileMonthDetails = () => {
      const apts = getAppointmentsForDate(selectedDay);
      const blocked = getBlockedTimeForDay(selectedDay);
      const dailyRevenue = apts.filter(a => a.status !== 'Cancelado').length * 250;

      return (
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <CalendarDays size={18} className="text-primary-500" />
                     {selectedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'short' })}
                  </h3>
                  {apts.length > 0 && (
                     <p className="text-xs text-slate-500 mt-1 font-medium">
                        {apts.length} sessões • Est. R$ {dailyRevenue.toFixed(2)}
                     </p>
                  )}
               </div>
               <div className="flex gap-2">
                  <button onClick={openBlockModal} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-red-500 hover:text-red-600">
                     <Ban size={20} />
                  </button>
                  <button onClick={handleManualAdd} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-primary-600 hover:bg-primary-50 transition-colors">
                     <Plus size={20} />
                  </button>
               </div>
            </div>

            <div className="p-4 space-y-4">
               {apts.length === 0 && blocked.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                     <Clock size={32} className="mx-auto mb-2 opacity-20" />
                     <p className="text-sm">Dia livre.</p>
                  </div>
               ) : (
                  <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                     {apts.map(apt => (
                        <div key={apt.id} className="relative group" onClick={() => setSelectedAppointment(apt)}>
                           <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${(apt.status === 'scheduled' || apt.status === 'Agendado') ? 'bg-primary-500' :
                              apt.status === 'pending_payment' ? 'bg-amber-500' :
                                 (apt.status === 'completed' || apt.status === 'Concluído') ? 'bg-green-500' :
                                    'bg-slate-300'
                              }`} />
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-98 transition-transform">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-bold text-slate-800 dark:text-white text-sm">{apt.time}</span>
                                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shadow-sm ${apt.status === 'pending_payment' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700' : 'bg-white dark:bg-slate-800'
                                    }`}>
                                    {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'pending_payment' ? 'Pagamento Pendente' : apt.status === 'completed' ? 'Concluído' : apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                                 </span>
                              </div>
                              <h4 className="font-bold text-primary-700 dark:text-primary-400 text-sm mb-0.5">{apt.patientName}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><BrainCircuit size={12} /> {apt.type}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      );
   }

   const renderWeekView = () => {
      const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay());
      const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
      const hours = Array.from({ length: 13 }, (_, i) => i + 8);

      return (
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><div className="w-12 border-r border-slate-200 dark:border-slate-800 shrink-0"></div>{weekDates.map((date, i) => (<div key={i} className={`flex-1 p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-none ${isSameDate(date, new Date()) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}><p className="text-xs font-bold uppercase text-slate-400 mb-1">{weekDays[date.getDay()].short}</p><div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isSameDate(date, new Date()) ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{date.getDate()}</div></div>))}</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">{hours.map(hour => (<div key={hour} className="flex border-b border-slate-100 dark:border-slate-800 min-h-[80px]"><div className="w-12 border-r border-slate-100 dark:border-slate-800 p-2 text-[10px] font-bold text-slate-400 text-right bg-slate-50/30 dark:bg-slate-950/30">{hour}:00</div>{weekDates.map((date, i) => {
               const apts = getAppointmentsForDate(date).filter(a => parseInt(a.time.split(':')[0]) === hour); const blocked = getBlockedTimeForDay(date).some(b => parseInt(b.startTime.split(':')[0]) <= hour && parseInt(b.endTime.split(':')[0]) > hour); const isSuggested = suggestedSlot && suggestedSlot.date === formatDateKey(date) && parseInt(suggestedSlot.time.split(':')[0]) === hour; return (<div key={i} className={`flex-1 border-r border-slate-100 dark:border-slate-800 p-1 relative group transition-colors ${blocked ? 'bg-stripes-gray opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'} ${isSuggested ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-inset ring-2 ring-amber-300 dark:ring-amber-700' : ''}`} onClick={() => !blocked && apts.length === 0 && handleQuickAdd(date, `${hour}:00`)}>{blocked && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><Ban size={16} className="text-slate-400" /></div>}{apts.map(apt => (<div key={apt.id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }} className={`text-[10px] p-1.5 rounded mb-1 cursor-pointer truncate shadow-sm hover:shadow-md transition-all border-l-2 ${(apt.status === 'scheduled' || apt.status === 'Agendado') ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 border-primary-500' :
                  apt.status === 'pending_payment' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-500' :
                     (apt.status === 'completed' || apt.status === 'Concluído') ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-500' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`} title={`${apt.time} - ${apt.patientName}`}><span className="font-bold block">{apt.time}</span>{apt.patientName.split(' ')[0]}</div>))}</div>);
            })}</div>))}</div>
         </div>
      );
   };

   const renderDayView = () => (
      <div className="flex flex-col h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
         <div className="absolute left-16 right-0 border-t-2 border-red-400 z-10 flex items-center" style={{ top: '35%' }}>
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
            <span className="text-[10px] font-bold text-red-500 bg-white dark:bg-slate-900 px-1 ml-1">Agora</span>
         </div>
         {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
            <div key={hour} className="flex border-b border-slate-100 dark:border-slate-800 min-h-[100px] relative group">
               <div className="w-16 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 p-2 text-xs text-slate-400 text-right font-medium bg-slate-50/50 dark:bg-slate-950/50 sticky left-0">{hour}:00</div>
               <div className="flex-1 p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => handleQuickAdd(currentDate, `${hour}:00`)}>
                  {getAppointmentsForDate(currentDate).filter(a => parseInt(a.time.split(':')[0]) === hour).map(apt => (
                     <div key={apt.id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }} className="p-3 rounded-lg border-l-4 bg-blue-50 border-blue-500 mb-2 cursor-pointer">
                        <span className="font-bold text-sm text-slate-800">{apt.patientName}</span>
                        <div className="text-xs text-slate-500">{apt.time} - {apt.type}</div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
      </div>
   );

   const renderListView = () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] flex flex-col">
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><h3 className="font-bold text-slate-700 dark:text-slate-300">Lista de Agendamentos</h3></div>
         <div className="overflow-y-auto custom-scrollbar p-2 space-y-2">
            {filteredAppointments.sort((a, b) => (safeParseDate(a?.date || '').getTime() || 0) - (safeParseDate(b?.date || '').getTime() || 0)).map(apt => (
               <div key={apt.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary-300 cursor-pointer" onClick={() => setSelectedAppointment(apt)}>
                  <div className="flex flex-col items-center min-w-[60px]"><span className="text-xs font-bold uppercase text-slate-400">{safeParseDate(apt?.date || '').toLocaleDateString('pt-BR', { weekday: 'short' })}</span><span className="text-xl font-bold text-slate-800 dark:text-white">{safeParseDate(apt?.date || '').getDate()}</span></div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex-1"><h4 className="font-bold text-slate-800 dark:text-white">{apt.patientName}</h4><span className="text-xs text-slate-500">{apt.time} • {apt.type}</span></div>
               </div>
            ))}
         </div>
      </div>
   );

   const renderMiniCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDay = firstDay.getDay();
      const days = []; for (let i = 0; i < startDay; i++) days.push(null); for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      return (
         <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-3"><span className="text-center font-bold text-sm text-slate-700 dark:text-slate-200">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span><div className="flex gap-1"><button onClick={handlePrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronLeft size={14} /></button><button onClick={handleNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronRight size={14} /></button></div></div>
            <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-bold mb-2"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
            <div className="grid grid-cols-7 gap-1">{days.map((d, i) => (<div key={i} className="aspect-square flex items-center justify-center">{d && (<button onClick={() => setCurrentDate(d)} className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${isSameDate(d, currentDate) ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{d.getDate()}</button>)}</div>))}</div>
         </div>
      );
   };

   return (
      <div className="flex flex-col h-full min-h-[600px] animate-fade-in pb-20 md:pb-0 relative bg-white dark:bg-slate-900">
         {toast && toast.show && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-slide-up"><div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-800 border-slate-700 text-white'}`}>{toast.type === 'error' ? <AlertTriangle size={18} /> : toast.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}<span className="text-sm font-bold">{toast.message}</span></div></div>}

         <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-1"><button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={20} /></button><button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={20} /></button><button onClick={handleToday} className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-1">Hoje</button></div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white min-w-[180px]">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">

               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[
                     { id: 'all', label: 'Todos' },
                     { id: 'scheduled', label: 'Agendados' },
                     { id: 'pending_payment', label: 'Pendentes' }
                  ].map(v => (
                     <button
                        key={v.id}
                        onClick={() => setStatusFilter(v.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${statusFilter === v.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                           }`}
                     >
                        {v.label}
                     </button>
                  ))}
               </div>

               <button onClick={openBlockModal} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-red-500"><Ban size={20} /></button>
               <button onClick={handleExportICS} title="Exportar Agenda (.ics)" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary-600 transition-colors">
                  <Download size={20} />
               </button>
               <button onClick={handleManualAdd} className="p-2.5 bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-2 font-bold">
                  <Plus size={20} /> <span className="hidden sm:inline">Nova Sessão</span>
               </button>
               <button onClick={handleFindSlot} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl font-bold shadow-lg"><Zap size={16} className="text-yellow-400" /> Encontrar Vaga</button>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            <div className="flex-1 min-w-0">
               {loading ? (
                  <div className="p-6 text-slate-500">Carregando agenda...</div>
               ) : error ? (
                  <div className="p-6 text-red-600">{error}</div>
               ) : (
                  <>
                     {viewType === 'month' && renderMonthView()}
                     {viewType === 'week' && renderWeekView()}
                     {viewType === 'day' && renderDayView()}
                     {viewType === 'list' && renderListView()}
                  </>
               )}
            </div>
            <div className="hidden xl:flex w-80 flex-col gap-4 shrink-0">
               {renderMiniCalendar()}
               {/* Weather Widget Removed (was mock data) */}
               <button onClick={handleOptimizeSchedule} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"><Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> Otimização Inteligente</button>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BrainCircuit size={16} /> Insights</h3><div className="space-y-4"><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Percent size={18} /></div><div><p className="text-xs text-slate-500 font-bold">Ocupação</p><p className="text-lg font-bold text-slate-800 dark:text-white">{insights.occupancy}%</p></div></div></div><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><DollarSign size={18} /></div><div><p className="text-xs text-slate-500 font-bold">Receita Est.</p><p className="text-lg font-bold text-slate-800 dark:text-white">R$ {insights.revenue}</p></div></div></div></div></div>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><AlertCircle size={16} /> Pendências</h3><div className="space-y-3">
                  {/* Todo: Fetch pending items from API */}
                  <div className="text-center py-4 text-slate-400 text-xs">Nenhuma pendência.</div>
               </div></div>
            </div>
         </div>

         {selectedAppointment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-slate-200 dark:ring-slate-800">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-950"><div><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'Agendado') ? 'bg-blue-100 text-blue-700' :
                     selectedAppointment.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                     }`}>{
                        selectedAppointment.status === 'scheduled' ? 'Agendado' :
                           selectedAppointment.status === 'pending_payment' ? 'Pagamento Pendente' :
                              selectedAppointment.status === 'completed' ? 'Concluído' :
                                 selectedAppointment.status
                     }</span><h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedAppointment.patientName}</h3><p className="text-sm text-slate-500">{selectedAppointment.type}</p></div><button onClick={() => setSelectedAppointment(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"><X size={20} /></button></div>
                  <div className="p-6 space-y-4">
                     <div className="flex gap-4">
                        <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                           <p className="text-xs text-slate-400 font-bold uppercase mb-1">Data</p>
                           <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon size={16} /> {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                           <p className="text-xs text-slate-400 font-bold uppercase mb-1">Horário</p>
                           <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><Clock size={16} /> {selectedAppointment.time}</p>
                        </div>
                     </div>

                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Financeiro</p>
                        <div className="flex items-center gap-2">
                           <span className="text-slate-500 font-bold">R$</span>
                           <input
                              type="number"
                              className="w-full bg-transparent font-semibold text-slate-800 dark:text-white outline-none placeholder-slate-400"
                              placeholder="0,00"
                              defaultValue={selectedAppointment.sessionData?.price || ''}
                              onBlur={(e) => handleUpdatePrice(Number(e.target.value))}
                              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                              autoFocus={!selectedAppointment.sessionData?.price}
                           />
                        </div>
                     </div>

                     <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/30">
                        <AddToCalendar
                           title={`Sessão TRG: ${selectedAppointment.patientName}`}
                           date={selectedAppointment.date}
                           time={selectedAppointment.time}
                           description={`Paciente: ${selectedAppointment.patientName}\nTipo: ${selectedAppointment.type}\nStatus: ${selectedAppointment.status}`}
                           className="w-full"
                        />
                     </div>

                     <div className="flex gap-2">
                        <button onClick={() => onNavigateToPatient?.(selectedAppointment.patientId)} className="flex-1 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-sm flex items-center justify-center gap-2"><User size={16} /> Ver Ficha</button>
                        <button onClick={handleStartSession} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"><BrainCircuit size={16} /> Iniciar Sessão</button>
                     </div>
                     <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center"><button onClick={handleCancelAppointment} className="text-red-500 text-sm font-bold hover:underline">Cancelar Agendamento</button><button onClick={handleReschedule} className="text-primary-600 dark:text-secondary-400 text-sm font-bold hover:underline">Reagendar</button></div>
                  </div>
               </div>
            </div>
         )}

         {isBlockModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-slide-up ring-1 ring-slate-200 dark:ring-slate-800">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Ban size={20} className="text-red-500" /> Bloquear Horário</h3><button onClick={() => setIsBlockModalOpen(false)}><X size={20} className="text-slate-400" /></button></div>
                  <div className="space-y-4">
                     <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                           onClick={() => setBlockForm({ ...blockForm, type: 'date' })}
                           className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${blockForm.type === 'date' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}
                        >
                           Data Específica
                        </button>
                        <button
                           onClick={() => setBlockForm({ ...blockForm, type: 'weekly' })}
                           className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${blockForm.type === 'weekly' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}
                        >
                           Semanal (Recorrente)
                        </button>
                     </div>

                     {blockForm.type === 'date' ? (
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
                           <input
                              type="date"
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                              value={blockForm.date}
                              onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                           />
                        </div>
                     ) : (
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Dia da Semana</label>
                           <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" value={blockForm.dayOfWeek} onChange={(e) => setBlockForm({ ...blockForm, dayOfWeek: parseInt(e.target.value) })}>{weekDays.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}</select>
                        </div>
                     )}

                     <div className="flex items-center gap-2 mb-2">
                        <input
                           type="checkbox"
                           id="allDay"
                           className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                           checked={blockForm.startTime === '00:00' && blockForm.endTime === '23:59'}
                           onChange={(e) => {
                              if (e.target.checked) {
                                 setBlockForm({ ...blockForm, startTime: '00:00', endTime: '23:59' });
                              } else {
                                 setBlockForm({ ...blockForm, startTime: '09:00', endTime: '18:00' });
                              }
                           }}
                        />
                        <label htmlFor="allDay" className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Bloquear dia todo</label>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Início</label>
                           <input
                              type="time"
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              value={blockForm.startTime}
                              onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                              disabled={blockForm.startTime === '00:00' && blockForm.endTime === '23:59'}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fim</label>
                           <input
                              type="time"
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              value={blockForm.endTime}
                              onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                              disabled={blockForm.startTime === '00:00' && blockForm.endTime === '23:59'}
                           />
                        </div>
                     </div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Rótulo</label><input type="text" placeholder="Ex: Almoço" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" value={blockForm.label} onChange={(e) => setBlockForm({ ...blockForm, label: e.target.value })} /></div><button onClick={handleSaveBlock} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-colors">Confirmar Bloqueio</button></div>
               </div>
            </div>
         )}
         <OptimizationModal
            isOpen={isOptimizationModalOpen}
            onClose={() => setIsOptimizationModalOpen(false)}
            data={optimizationData}
            onApply={handleApplyOptimization}
         />
      </div>
   );
};

export default CalendarView;

