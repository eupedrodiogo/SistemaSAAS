
import React, { useState, useEffect } from 'react';
import { ClipboardCopy } from 'lucide-react';
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
   BrainCircuit,
   MoreHorizontal,
   DollarSign,
   Percent,

   CalendarDays,
   Filter,
   Sun,
   Cloud,
   Sparkles,
   AlertCircle,
   Wand2,
   Heart,
   Link,
   Copy
} from 'lucide-react';
import { DEFAULT_BLOCKED_TIMES } from '../constants';
import { Appointment, BlockedTime } from 'types';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { AddToCalendar } from './AddToCalendar';

type ViewType = 'day' | 'week' | 'month' | 'list';

interface CalendarViewProps {
   onNavigateToPatient?: (id: string) => void;
   onNavigateToSession?: (patientId: string) => void;
   initialAction?: 'create' | null;
   initialPatientId?: string;
   initialPatientName?: string;
   onActionConsumed?: () => void;
}

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
      checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
    }`}
  >
    <div
      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToPatient, onNavigateToSession, initialAction, initialPatientId, initialPatientName, onActionConsumed }) => {
   const [currentDate, setCurrentDate] = useState(new Date());
   const [selectedDay, setSelectedDay] = useState<Date>(new Date());
   const [viewType, setViewType] = useState<ViewType>('month');
   const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string>('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
   const [availability, setAvailability] = useState<any[]>([]);
   const [suggestedSlot, setSuggestedSlot] = useState<{ date: string, time: string } | null>(null);
   const [isRescheduling, setIsRescheduling] = useState(false);
   const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
   const [addModal, setAddModal] = useState<{isOpen: boolean, date: Date, time: string, isAnjo?: boolean, patientName?: string, patientId?: string, patientEmail?: string, patientPhone?: string} | null>(null);
   const [successPopup, setSuccessPopup] = useState<{isOpen: boolean, date: string, time: string, isAnjo: boolean} | null>(null);
   const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
   const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
   const [blockForm, setBlockForm] = useState({ type: 'date', date: '', dayOfWeek: 1, startTime: '12:00', endTime: '13:00', label: '' });
   const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);
   const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
   const [optimizationData, setOptimizationData] = useState<any>(null);
   const [sidebarTab, setSidebarTab] = useState<'sessions' | 'blocks'>('sessions');
   const [patientsList, setPatientsList] = useState<any[]>([]);
   const [showPatientDropdown, setShowPatientDropdown] = useState(false);

   // Trigger initial action
   useEffect(() => {
      if (initialAction === 'create') {
         setTimeout(() => {
            setViewType('week'); // Switch to week view to show hours
            showNotification('Selecione o horário desejado clicando em um espaço livre na agenda.', 'info');
         }, 500);
      }
   }, [initialAction]);

   useEffect(() => {
      const fetchBlockedTimes = async () => {
         const times = await api.blockedTimes.list();
         if (times) setBlockedTimes(times.filter(Boolean));
      };
      fetchBlockedTimes();
      
      const savedSettings = localStorage.getItem('TRG_SETTINGS');
      if (savedSettings) {
         try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.availability) setAvailability(parsed.availability);
         } catch(e) {}
      }
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
      if (!apt) return false;
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
         .then((data: Appointment[]) => { 
            if (mounted) {
               setAppointments((data || []).filter(Boolean));
            } 
         })
         .catch(() => { if (mounted) setError('Falha ao carregar agenda'); })
         .finally(() => { if (mounted) setLoading(false); });

      api.patients.list()
         .then(data => { if (mounted) setPatientsList(data || []); })
         .catch(() => {});

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

   const formatPhone = (val: string) => {
      let v = val.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length === 0) return '';
      if (v.length <= 2) return `(${v}`;
      if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
      if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
      return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
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
      const isBlocked = getBlockedTimeForDay(date).some(block => {
         if (!block) return false;
         return hour >= parseInt(block.startTime.split(':')[0]) &&
                hour < parseInt(block.endTime.split(':')[0]);
      });

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
      setIsRescheduling(true);
      setReschedulingAppointment(selectedAppointment);
      setSelectedAppointment(null); // Close modal
      showNotification('Modo de reagendamento ativo. Clique no novo horário desejado.', 'info');
   };

   const cancelReschedule = () => {
      setIsRescheduling(false);
      setReschedulingAppointment(null);
      showNotification('Reagendamento cancelado.', 'info');
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



   const handleSaveAvailability = () => {
      const savedSettings = localStorage.getItem('TRG_SETTINGS');
      let parsed: any = {};
      if (savedSettings) {
         try { parsed = JSON.parse(savedSettings); } catch(e) {}
      }
      parsed.availability = availability;
      localStorage.setItem('TRG_SETTINGS', JSON.stringify(parsed));
      setIsAvailabilityModalOpen(false);
      showNotification('Horários atualizados com sucesso!', 'success');
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

         if (newBlock) {
            const updatedBlocks = [...blockedTimes, newBlock].filter(Boolean);
            setBlockedTimes(updatedBlocks);
            setIsBlockModalOpen(false);
            
            const isFullDay = blockForm.startTime === '00:00' && blockForm.endTime === '23:59';
            if (isFullDay) {
               showNotification('Esse dia foi bloqueado com sucesso.', 'success');
            } else {
               showNotification('Esse horário foi bloqueado com sucesso.', 'success');
            }
         } else {
            showNotification('Erro ao bloquear: resposta inválida', 'error');
         }
      } catch (e: any) {
         console.error(e);
         showNotification(`Erro ao bloquear horário: ${e.message || 'Falha na comunicação'}`, 'error');
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

      if (isRescheduling && reschedulingAppointment) {
         if (window.confirm(`Mover agendamento de ${reschedulingAppointment.patientName} para ${formatDateKey(date)} às ${time}?`)) {
            const dateKey = formatDateKey(date);
            api.appointments.update(reschedulingAppointment.id, {
               date: dateKey,
               time: time
            }).then((updated) => {
               // Update local list logic could be improved with a full fetch, but let's try manual update first
               setAppointments(prev => prev.map(a => a.id === reschedulingAppointment.id ? { ...a, date: dateKey, time: time } : a));

               showNotification('Agendamento reagendado com sucesso!', 'success');
               setIsRescheduling(false);
               setReschedulingAppointment(null);
            }).catch((err) => showNotification(`Erro: ${err.message}`, 'error'));
         }
         return;
      }

      setAddModal({ isOpen: true, date, time });
   }

   const handleConfirmAdd = async () => {
      if (!addModal) return;
      const { date, time, isAnjo, patientName, patientId, patientEmail, patientPhone } = addModal;
      const dateKey = formatDateKey(date);
      
      const priceInput = document.getElementById('new-apt-price') as HTMLInputElement;
      const price = priceInput ? Number(priceInput.value) : 0;

      const payload = isAnjo
         ? {
              date: dateKey,
              time,
              status: 'scheduled',
              type: 'Anjo',
              patientId: patientId || 'unregistered',
              patientName: patientName || 'Cliente Anjo (Pendente)',
              patientEmail: patientEmail,
              patientPhone: patientPhone,
              sessionData: { price: 0 },
           }
         : {
              date: dateKey,
              time,
              status: 'scheduled',
              type: 'Regular', // Ajustado para Regular
              patientId: patientId || initialPatientId || 'unregistered',
              patientName: patientName || initialPatientName || 'Paciente (A definir)',
              patientEmail: patientEmail,
              patientPhone: patientPhone,
              sessionData: { price },
           };

      try {
         const created = await api.appointments.create(payload);
         setAppointments(prev => [created as Appointment, ...prev]);
         
         // Disparar e-mail de confirmação ou Convite Anjo
         try {
             // Pegar token do supabase
             const { data: { session } } = await supabase.auth.getSession();
             if (session?.access_token) {
                 const { data: userData } = await supabase.auth.getUser();
                 const therapistName = userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || 'Terapeuta';
                 const therapistEmail = userData?.user?.email;

                 if (isAnjo) {
                     const link = `${window.location.origin}/convite-anjo/${created.id}`;
                     
                     // 1. Auto Copy
                     try { await navigator.clipboard.writeText(link); } catch(e) {}
                     
                     // 2. Enviar Convite Anamnese / Link Anjo
                     if ((payload as any).patientEmail) {
                         await fetch('/api/emails/anamnese', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                             body: JSON.stringify({ 
                                email: (payload as any).patientEmail, 
                                patientName: payload.patientName, 
                                link: `${window.location.origin}/portal-paciente/login?email=${encodeURIComponent((payload as any).patientEmail)}`,
                                date: date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                                time
                             })
                         });
                     }
                     if ((payload as any).patientPhone) {
                         await fetch('/api/notifications/manual', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                             body: JSON.stringify({ phone: (payload as any).patientPhone, templateType: 'ANAMNESE_REQUEST', templateParams: { patientName: payload.patientName, link } })
                         });
                     }
                 }
                 
                 // 3. SEMPRE enviar e-mail de confirmação (notifica Terapeuta e Paciente)
                 await fetch('/api/emails/confirmacao-agendamento', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${session.access_token}`
                     },
                     body: JSON.stringify({
                         patientName: payload.patientName,
                         patientEmail: (payload as any).patientEmail,
                         patientPhone: (payload as any).patientPhone,
                         therapistName,
                         therapistEmail,
                         date: date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                         time,
                         type: payload.type
                     })
                 });
             }
         } catch (emailError) {
             console.error("Erro ao enviar comunicados:", emailError);
         }

         setSuccessPopup({
            isOpen: true,
            date: date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            time,
            isAnjo: !!isAnjo
         });
         setAddModal(null);
         setTimeout(() => setSelectedAppointment(created as Appointment), 100);
         if (onActionConsumed) onActionConsumed();
      } catch (error) {
         showNotification('Erro ao criar agendamento.', 'error');
      }
   };

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
      const dayMapping: { [key: number]: string } = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
      const dayStr = dayMapping[d];
      const k = formatDateKey(date);
      const explicitBlocks = blockedTimes.filter(b => {
         if (!b) return false;
         const blockDate = b.date ? (typeof b.date === 'string' ? b.date.split('T')[0] : b.date) : null;
         return (blockDate === k) || (b.dayOfWeek === d || b.dayOfWeek === dayStr);
      }) as any[];

      if (availability && availability.length > 0) {
         const currentAvail = availability.find(a => a.dayOfWeek === dayStr);
         if (currentAvail) {
            if (!currentAvail.isActive) {
               explicitBlocks.push({ id: 'avail-block', dayOfWeek: dayStr, startTime: '00:00', endTime: '23:59', label: 'Fora de Horário' });
            } else {
               const startH = currentAvail.startTime;
               const endH = currentAvail.endTime;
               if (startH !== '00:00') {
                  explicitBlocks.push({ id: 'avail-block-1', dayOfWeek: dayStr, startTime: '00:00', endTime: startH, label: 'Fora de Horário' });
               }
               if (endH !== '23:59' && endH !== '24:00') {
                  explicitBlocks.push({ id: 'avail-block-2', dayOfWeek: dayStr, startTime: endH, endTime: '23:59', label: 'Fora de Horário' });
               }
            }
         }
      }

      return explicitBlocks;
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
                     const blocked = getBlockedTimeForDay(date);
                     const isFullDayBlocked = blocked.some(b => b.startTime === '00:00' && b.endTime === '23:59');
                     const isToday = isSameDate(date, new Date());
                     const isSelected = isSameDate(date, selectedDay);

                     return (
                        <div
                           key={idx}
                           onClick={() => {
                              setSelectedDay(date);
                              setCurrentDate(date);
                              if (isRescheduling) {
                                 setViewType('day');
                                 showNotification(`Dia ${date.getDate()} selecionado. Agora clique no horário desejado.`, 'info');
                              }
                           }}
                           className={`
                        p-2 border-r border-b border-slate-100 dark:border-slate-800 relative cursor-pointer transition-colors group
                        ${isSelected ? 'bg-primary-50 dark:bg-slate-800 ring-inset ring-2 ring-primary-500' :
                                 isFullDayBlocked ? 'bg-slate-100 dark:bg-slate-900/40 pattern-diagonal-lines-sm' :
                                    'hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                        >
                           <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-primary-600 text-white' : isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                 {date.getDate()}
                              </span>
                              <div className="relative">
                                  {/* Resumo de sessões (some no hover ou quando selecionado para dar lugar ao botão +) */}
                                  {apts.length > 0 && (
                                     <div className={`transition-opacity duration-150 hidden md:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm ${isSelected ? 'opacity-0 pointer-events-none' : 'group-hover:opacity-0'}`} title={`${apts.length} sessões no total`}>
                                        {apts.filter(a => a.sessionData?.price !== 0).length > 0 && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center"><DollarSign size={10} strokeWidth={3} className="-mr-0.5" />{apts.filter(a => a.sessionData?.price !== 0).length}</span>}
                                        {apts.filter(a => a.sessionData?.price === 0).length > 0 && <span className="text-[10px] font-bold text-pink-500 dark:text-pink-400 flex items-center gap-0.5"><Heart size={10} fill="currentColor" className="opacity-80" />{apts.filter(a => a.sessionData?.price === 0).length}</span>}
                                     </div>
                                  )}

                                  {/* Botão + no canto superior direito no hover (quando já existem agendamentos) */}
                                  {!isFullDayBlocked && apts.length > 0 && (
                                     <button
                                        onClick={(e) => {
                                           e.stopPropagation();
                                           setSelectedDay(date);
                                           setCurrentDate(date);
                                           
                                           const now = new Date();
                                           let time = '08:00';
                                           if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                                              const h = now.getHours() + 1;
                                              if (h >= 8 && h < 18) time = `${h.toString().padStart(2, '0')}:00`;
                                           }
                                           
                                           let h = parseInt(time.split(':')[0]);
                                           let found = false;
                                           while (h < 18) {
                                              const t = `${h.toString().padStart(2, '0')}:00`;
                                              if (!isSlotConflicting(date, t)) {
                                                 time = t;
                                                 found = true;
                                                 break;
                                              }
                                              h++;
                                           }
                                           if (found) {
                                              setAddModal({ isOpen: true, date, time });
                                           } else {
                                              showNotification("Não há horários livres padrão das 8h às 18h neste dia.", "warning");
                                           }
                                        }}
                                        className={`absolute right-0 top-0 w-6 h-6 rounded-full bg-primary-600 hover:bg-primary-750 text-white flex items-center justify-center shadow-md transition-all z-10 duration-150 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 md:group-hover:scale-100 opacity-0 md:group-hover:opacity-100'}`}
                                        title="Agendar nova sessão neste dia"
                                     >
                                        <Plus size={12} />
                                     </button>
                                  )}
                               </div>
                           </div>

                           <div className="hidden md:block space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                              {blocked.filter(b => !(b.startTime === '00:00' && b.endTime === '23:59') && b.id !== 'avail-block-1' && b.id !== 'avail-block-2').map((b, i) => (
                                 <div key={`blk-${i}`} className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-500 flex items-center gap-1 truncate">
                                    <Ban size={8} /> {b.startTime}
                                 </div>
                              ))}
                              {apts.map(apt => {
                                 const isAnjo = apt.sessionData?.price === 0;
                                 return (
                                    <div
                                       key={apt.id}
                                       onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                       className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center justify-center gap-1 cursor-pointer font-medium transition-colors ${
                                          isAnjo 
                                             ? 'bg-pink-50 border-pink-100 text-pink-500 hover:bg-pink-100 dark:bg-pink-900/10 dark:border-pink-900/20 dark:text-pink-400'
                                             : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20 dark:text-emerald-400'
                                       }`}
                                    >
                                       {isAnjo ? <Heart size={8} className="shrink-0" fill="currentColor" /> : <DollarSign size={8} strokeWidth={3} className="shrink-0" />}
                                       <span className="truncate">{apt.time} {(apt.patientName || 'Paciente').split(' ')[0]}</span>
                                    </div>
                                 );
                              })}
                              {isFullDayBlocked && (
                                 <div className="text-[9px] px-1.5 py-0.5 rounded border border-red-100 bg-red-50 text-red-400 dark:bg-red-900/10 dark:border-red-900/20 text-center font-medium">
                                    Bloqueado
                                 </div>
                              )}
                           </div>

                            {/* Botão + grande e centralizado no hover ou selecionado (quando o dia está livre) */}
                            {!isFullDayBlocked && apts.length === 0 && (
                               <button
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedDay(date);
                                     setCurrentDate(date);
                                     
                                     const now = new Date();
                                     let time = '08:00';
                                     if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                                        const h = now.getHours() + 1;
                                        if (h >= 8 && h < 18) time = `${h.toString().padStart(2, '0')}:00`;
                                     }
                                     
                                     let h = parseInt(time.split(':')[0]);
                                     let found = false;
                                     while (h < 18) {
                                        const t = `${h.toString().padStart(2, '0')}:00`;
                                        if (!isSlotConflicting(date, t)) {
                                           time = t;
                                           found = true;
                                           break;
                                        }
                                        h++;
                                     }
                                     if (found) {
                                        setAddModal({ isOpen: true, date, time });
                                     } else {
                                        showNotification("Não há horários livres padrão das 8h às 18h neste dia.", "warning");
                                     }
                                  }}
                                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-lg transition-all z-10 duration-150 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 md:group-hover:scale-100 opacity-0 md:group-hover:opacity-100'}`}
                                  title="Agendar nova sessão neste dia"
                               >
                                  <Plus size={16} />
                               </button>
                            )}

                           <div className="md:hidden flex flex-wrap justify-center gap-1 mt-1">
                              {isFullDayBlocked && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
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
                     {blocked.map((b, i) => (
                        <div key={`mob-blk-${i}`} className="relative group">
                           <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-red-400" />
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 opacity-75">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-bold text-slate-500 dark:text-white text-sm">
                                    {b.startTime === '00:00' && b.endTime === '23:59' ? 'Dia Todo' : `${b.startTime} - ${b.endTime}`}
                                 </span>
                                 <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border shadow-sm bg-red-50 text-red-500 border-red-100 dark:bg-red-900/10 dark:text-red-300 dark:border-red-900/30">
                                    Bloqueado
                                 </span>
                              </div>
                              <h4 className="font-bold text-slate-600 dark:text-slate-400 text-sm mb-0.5">{b.label || 'Indisponível'}</h4>
                           </div>
                        </div>
                     ))}
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
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><img src="/logo-new.jpg" alt="Logo" className="w-3 h-3 opacity-70" /> {apt.type}</p>
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

         {isRescheduling && (
            <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 p-3 text-center flex items-center justify-center gap-4 animate-fade-in absolute top-0 left-0 right-0 z-50">
               <span className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Modo Reagendamento: Selecione um novo horário para {reschedulingAppointment?.patientName}
               </span>
               <button onClick={cancelReschedule} className="px-3 py-1 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-100 text-xs font-bold rounded shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-700">
                  Cancelar
               </button>
            </div>
         )}

         <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-1"><button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={20} /></button><button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={20} /></button><button onClick={handleToday} className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-1">Hoje</button></div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white min-w-[180px]">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">

               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[
                     { id: 'month', icon: <CalendarIcon size={16} />, label: 'Mês' },
                     { id: 'week', icon: <LayoutGrid size={16} />, label: 'Semana' },
                     { id: 'day', icon: <Clock size={16} />, label: 'Dia' },
                     { id: 'list', icon: <List size={16} />, label: 'Lista' }
                  ].map(v => (
                     <button
                        key={v.id}
                        onClick={() => setViewType(v.id as ViewType)}
                        className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewType === v.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                           }`}
                        title={v.label}
                     >
                        {v.icon}
                        <span className="hidden lg:inline">{v.label}</span>
                     </button>
                  ))}
               </div>

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

               <button onClick={() => setIsAvailabilityModalOpen(true)} title="Horários de Atendimento" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-indigo-500 transition-colors"><Clock size={20} /></button>
               <button onClick={openBlockModal} title="Bloquear Horário Extraordinário" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"><Ban size={20} /></button>
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
               {viewType !== 'month' && renderMiniCalendar()}
               <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-200px)]">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 shrink-0">
                     <button onClick={() => setSidebarTab('sessions')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'sessions' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sessões Agendadas</button>
                     <button onClick={() => setSidebarTab('blocks')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'blocks' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Bloqueios de Horários</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                     {sidebarTab === 'sessions' ? (
                        appointments.filter(a => safeParseDate(a.date).getTime() >= new Date().setHours(0,0,0,0)).sort((a,b) => safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()).slice(0,10).map(apt => (
                           <div key={apt.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-primary-300" onClick={() => setSelectedAppointment(apt)}>
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-bold text-slate-800 dark:text-white text-sm">{safeParseDate(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {apt.time}</span>
                                 {apt.sessionData?.price === 0 ? <Heart size={14} className="text-pink-500" /> : <DollarSign size={14} className="text-emerald-500" />}
                              </div>
                              <h4 className="font-bold text-primary-600 dark:text-primary-400 text-xs truncate">{apt.patientName}</h4>
                           </div>
                        ))
                     ) : (
                        blockedTimes.map(b => (
                           <div key={b.id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                                    {b.date ? safeParseDate(b.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : b.dayOfWeek !== undefined ? weekDays[b.dayOfWeek]?.label : ''}
                                 </span>
                                 <Ban size={14} className="text-red-400" />
                              </div>
                              <h4 className="text-xs text-red-500 font-bold">{b.startTime} - {b.endTime}</h4>
                              <p className="text-[10px] text-red-400 uppercase mt-1 truncate">{b.label}</p>
                           </div>
                        ))
                     )}
                  </div>
               </div>
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
                           <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon size={16} /> {new Date(selectedAppointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
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

                      {/* Botão Link Anjo - só aparece para sessões Anjo sem paciente vinculado */}
                      {(selectedAppointment.type === 'Anjo' || selectedAppointment.sessionData?.price === 0) && selectedAppointment.patientId === 'unregistered' && (
                         <button
                            onClick={() => {
                               const link = `${window.location.origin}/convite-anjo/${selectedAppointment.id}`;
                               navigator.clipboard.writeText(link);
                               showNotification('💗 Link Anjo copiado! Envie ao cliente.', 'success');
                            }}
                            className="w-full py-2.5 mb-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors text-sm flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800"
                         >
                            <Heart size={16} fill="currentColor" /> Copiar Link Anjo
                         </button>
                      )}

                      {selectedAppointment.patientId !== 'unregistered' && (
                         <>
                            <button 
                               onClick={async () => {
                                   const link = `${window.location.origin}/portal-paciente/cadastro?email=${encodeURIComponent(selectedAppointment.patientEmail || '')}&appointmentId=${selectedAppointment.id}`;
                                   
                                   // Copia pro clipboard como backup
                                   navigator.clipboard.writeText(`Olá ${selectedAppointment.patientName}! Preencha sua ficha de anamnese: ${link}`);
                                   showNotification('Enviando solicitações...', 'info');

                                   const hasEmail = !!selectedAppointment.patientEmail;
                                   const hasPhone = !!selectedAppointment.patientPhone;

                                   if (!hasEmail && !hasPhone) {
                                      showNotification('Paciente sem e-mail e telefone cadastrados. Link copiado!', 'warning');
                                      return;
                                   }

                                   const results: string[] = [];
                                   const errors: string[] = [];

                                   // Send Email via Backend
                                   if (hasEmail) {
                                      try {
                                         const { data: { session } } = await supabase.auth.getSession();
                                         const { data: userData } = await supabase.auth.getUser();
                                         const therapistName = userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || 'Terapeuta';
                                         
                                         const emailRes = await fetch('/api/emails/anamnese', {
                                            method: 'POST',
                                            headers: {
                                               'Content-Type': 'application/json',
                                               ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                                            },
                                            body: JSON.stringify({
                                               email: selectedAppointment.patientEmail,
                                               patientName: selectedAppointment.patientName,
                                               therapistName: therapistName,
                                               date: new Date(selectedAppointment.start).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                                               time: selectedAppointment.time,
                                               link: `${window.location.origin}/portal-paciente/login?email=${encodeURIComponent(selectedAppointment.patientEmail)}`
                                            })
                                         });
                                         const emailData = await emailRes.json();
                                         if (emailRes.ok) {
                                            results.push('Email ✓');
                                         } else {
                                            errors.push(`Email: ${emailData.error || 'Erro desconhecido'}`);
                                         }
                                      } catch (e: any) {
                                         errors.push(`Email: ${e.message}`);
                                      }
                                   }

                                   // Send WhatsApp via Backend
                                   if (hasPhone) {
                                      try {
                                         const { data: { session: waSession } } = await supabase.auth.getSession();
                                         const waRes = await fetch('/api/notifications/manual', {
                                            method: 'POST',
                                            headers: {
                                               'Content-Type': 'application/json',
                                               ...(waSession?.access_token ? { 'Authorization': `Bearer ${waSession.access_token}` } : {})
                                            },
                                            body: JSON.stringify({
                                               phone: selectedAppointment.patientPhone,
                                               templateType: 'ANAMNESE_REQUEST',
                                               templateParams: {
                                                  patientName: selectedAppointment.patientName,
                                                  link: link
                                               }
                                            })
                                         });
                                         const waData = await waRes.json();
                                         if (waRes.ok) {
                                            results.push('WhatsApp ✓');
                                         } else {
                                            errors.push(`WhatsApp: ${waData.error || 'Erro desconhecido'}`);
                                         }
                                      } catch (e: any) {
                                         errors.push(`WhatsApp: ${e.message}`);
                                      }
                                   }

                                   if (results.length > 0 && errors.length === 0) {
                                      showNotification(`Anamnese solicitada via ${results.join(' e ')}!`, 'success');
                                   } else if (results.length > 0 && errors.length > 0) {
                                      showNotification(`Parcial: ${results.join(', ')}. Erros: ${errors.join(', ')}`, 'warning');
                                   } else {
                                      showNotification(`Falha no envio: ${errors.join(' | ')}`, 'error');
                                   }
                                }}
                               className="w-full py-2.5 mb-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                               <ClipboardCopy size={16} /> Solicitar Anamnese
                            </button>

                            <div className="flex gap-2">
                               <button onClick={() => onNavigateToPatient?.(selectedAppointment.patientId)} className="flex-1 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-sm flex items-center justify-center gap-2"><User size={16} /> Ver Ficha</button>
                               <button onClick={handleStartSession} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"><BrainCircuit size={16} /> Iniciar Sessão</button>
                            </div>
                         </>
                      )}

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

         {isAvailabilityModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-slide-up ring-1 ring-slate-200 dark:ring-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Clock size={20} className="text-indigo-500" /> Horários de Atendimento</h3>
                     <button onClick={() => setIsAvailabilityModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Defina seus dias e horários padrão de trabalho.</p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {availability.map((avail, index) => {
                      const dayMapping: { [key: string]: string } = { 'dom': 'Domingo', 'seg': 'Segunda-feira', 'ter': 'Terça-feira', 'qua': 'Quarta-feira', 'qui': 'Quinta-feira', 'sex': 'Sexta-feira', 'sab': 'Sábado' };
                      const dayName = dayMapping[avail.dayOfWeek] || avail.dayOfWeek;
                      return (
                        <div key={avail.dayOfWeek} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4 w-full md:w-1/3">
                            <ToggleSwitch 
                              checked={avail.isActive} 
                              onChange={() => {
                                const newAvail = [...availability];
                                newAvail[index].isActive = !newAvail[index].isActive;
                                setAvailability(newAvail);
                              }} 
                            />
                            <span className={`font-medium ${avail.isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                              {dayName}
                            </span>
                          </div>
                          
                          <div className={`flex items-center gap-3 transition-opacity ${avail.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Início</span>
                              <input
                                type="time"
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                value={avail.startTime}
                                onChange={(e) => {
                                  const newAvail = [...availability];
                                  newAvail[index].startTime = e.target.value;
                                  setAvailability(newAvail);
                                }}
                              />
                            </div>
                            <span className="text-slate-400 mt-5">até</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</span>
                              <input
                                type="time"
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                value={avail.endTime}
                                onChange={(e) => {
                                  const newAvail = [...availability];
                                  newAvail[index].endTime = e.target.value;
                                  setAvailability(newAvail);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6">
                     <button onClick={handleSaveAvailability} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors">Salvar Alterações</button>
                  </div>
               </div>
            </div>
         )}

         <OptimizationModal
            isOpen={isOptimizationModalOpen}
            onClose={() => setIsOptimizationModalOpen(false)}
            data={optimizationData}
            onApply={handleApplyOptimization}
         />
         {/* Painel de Criação de Agendamento — mesmo estilo do painel de detalhes */}
         {addModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-slate-200 dark:ring-slate-800">

                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                     <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <CalendarIcon size={18} className="text-primary-600 dark:text-secondary-400" />
                           Nova Sessão
                        </h3>
                        <p className="text-xs text-slate-400">
                           Configure os detalhes do novo agendamento
                        </p>
                     </div>
                     <button onClick={() => setAddModal(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  {/* Body — mesmo layout dos cards de Data e Horário */}
                  <div className="p-6 space-y-4">

                     {/* Seleção do Tipo de Atendimento */}
                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tipo de Atendimento</label>
                        <div className="grid grid-cols-2 gap-3">
                           {/* Card Sessão Regular */}
                           <button
                              type="button"
                              onClick={() => setAddModal({ ...addModal, isAnjo: false })}
                              className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-center ${
                                 !addModal.isAnjo
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                           >
                              <DollarSign size={20} className={!addModal.isAnjo ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
                              <span className="font-bold text-xs">Regular</span>
                              <span className="text-[9px] leading-tight opacity-75">Sessão padrão individual</span>
                           </button>

                           {/* Card Sessão Anjo */}
                           <button
                              type="button"
                              onClick={() => setAddModal({ ...addModal, isAnjo: true })}
                              className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-center ${
                                 addModal.isAnjo
                                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400'
                                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-slate-400 hover:text-rose-400'
                              }`}
                           >
                              <Heart size={20} fill={addModal.isAnjo ? 'currentColor' : 'none'} className={addModal.isAnjo ? 'text-rose-500' : 'text-slate-400'} />
                              <span className="font-bold text-xs">Anjo</span>
                              <span className="text-[9px] leading-tight opacity-75">Social gratuita via link</span>
                           </button>
                        </div>
                     </div>

                     {/* Data e Hora */}
                     <div className="flex gap-4">
                        <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                           <p className="text-xs text-slate-400 font-bold uppercase mb-1">Data</p>
                           <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                              <CalendarIcon size={16} />
                              {addModal.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                           </p>
                        </div>
                        <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                           <p className="text-xs text-slate-400 font-bold uppercase mb-1">Horário</p>
                           <div className="flex items-center gap-2">
                              <Clock size={16} className="text-slate-500 shrink-0" />
                              <input
                                 type="time"
                                 className="font-semibold text-slate-800 dark:text-white bg-transparent outline-none w-full"
                                 value={addModal.time}
                                 onChange={(e) => setAddModal({ ...addModal, time: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>

                     {/* Campos do Paciente (Comum para Regular e Anjo) */}
                     <div className="space-y-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 relative z-50">
                           <p className="text-xs text-slate-400 font-bold uppercase mb-1">{addModal.isAnjo ? 'Nome do Paciente (Opcional)' : 'Nome do Paciente *'}</p>
                           <div className="flex items-center gap-2">
                              <User size={16} className="text-slate-500 shrink-0" />
                              <input
                                 type="text"
                                 required={!addModal.isAnjo}
                                 className="w-full bg-transparent font-semibold text-slate-800 dark:text-white outline-none placeholder-slate-400"
                                 placeholder="Ex: João da Silva"
                                 value={addModal.patientName || initialPatientName || ''}
                                 onChange={(e) => {
                                    setAddModal({ ...addModal, patientName: e.target.value, patientId: undefined });
                                    setShowPatientDropdown(true);
                                 }}
                                 onFocus={() => setShowPatientDropdown(true)}
                                 onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                              />
                           </div>
                           
                           {/* Dropdown de Autocomplete */}
                           {showPatientDropdown && addModal.patientName && (
                              <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                                 {patientsList
                                    .filter(p => p.name.toLowerCase().includes(addModal.patientName!.toLowerCase()))
                                    .map(p => (
                                    <div
                                       key={p.id}
                                       className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                       onMouseDown={(e) => {
                                          // Use onMouseDown instead of onClick to fire before onBlur of the input
                                          e.preventDefault(); 
                                          setAddModal({
                                             ...addModal, 
                                             patientId: p.id,
                                             patientName: p.name, 
                                             patientEmail: p.email || '', 
                                             patientPhone: p.phone ? formatPhone(p.phone) : ''
                                          });
                                          setShowPatientDropdown(false);
                                       }}
                                    >
                                       <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.name}</p>
                                       <p className="text-xs text-slate-500">{p.email || 'Sem e-mail'} • {p.phone ? formatPhone(p.phone) : 'Sem telefone'}</p>
                                    </div>
                                 ))}
                                 {patientsList.filter(p => p.name.toLowerCase().includes(addModal.patientName!.toLowerCase())).length === 0 && (
                                    <div className="p-3 text-xs text-slate-500 text-center">Nenhum paciente encontrado</div>
                                 )}
                              </div>
                           )}
                        </div>
                        
                        <div className="flex gap-3">
                           <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase mb-1">E-mail (Opcional)</p>
                              <input
                                 type="email"
                                 className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder-slate-400"
                                 placeholder="email@exemplo.com"
                                 value={addModal.patientEmail || ''}
                                 onChange={(e) => setAddModal({ ...addModal, patientEmail: e.target.value })}
                              />
                           </div>
                           <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase mb-1">WhatsApp (Opcional)</p>
                              <input
                                 type="tel"
                                 className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder-slate-400"
                                 placeholder="(00) 00000-0000"
                                 value={addModal.patientPhone || ''}
                                 onChange={(e) => setAddModal({ ...addModal, patientPhone: formatPhone(e.target.value) })}
                              />
                           </div>
                        </div>
                     </div>

                     {/* Financeiro (Só Sessão Regular) */}
                     {!addModal.isAnjo && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                           <p className="text-xs text-slate-400 font-bold uppercase mb-1">Valor da Sessão</p>
                           <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-500">R$</span>
                              <input
                                 id="new-apt-price"
                                 type="number"
                                 className="w-full bg-transparent font-semibold text-slate-800 dark:text-white outline-none"
                                 defaultValue={150}
                                 step={10}
                                 min={0}
                              />
                           </div>
                        </div>
                     )}

                     {/* Hint Anjo */}
                     {addModal.isAnjo && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-2 text-rose-500 text-sm">
                           <span className="font-bold flex items-center mb-1">
                              <Heart className="w-4 h-4 mr-2" /> Convite Automático
                           </span>
                           <p className="text-rose-600/80 dark:text-rose-400/80 leading-relaxed text-xs uppercase font-bold tracking-wide">
                              PREENCHA OS CAMPOS ACIMA PARA O ENVIO AUTOMÁTICO DO CONVITE DE ACESSO À SESSÃO POR WHATSAPP E EMAIL, ALÉM DA ANAMNESE PARA PREENCHIMENTO.
                           </p>
                        </div>
                     )}

                     {/* Botões de ação — "Ver Ficha" / "Iniciar Sessão" substituídos por "Cancelar" / "Confirmar" */}
                     <div className="flex gap-2">
                        <button
                           onClick={() => setAddModal(null)}
                           className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                           <X size={16} /> Cancelar
                        </button>
                        <button
                           onClick={handleConfirmAdd}
                           className={`flex-1 py-2.5 font-bold rounded-xl text-white transition-all shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2 ${
                              addModal.isAnjo
                                 ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                                 : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600'
                           }`}
                        >
                           <CalendarIcon size={16} /> Confirmar
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
         
         {/* Modal de Sucesso */}
         {successPopup?.isOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle2 size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                     Agendamento Realizado!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                     A sessão foi agendada com sucesso para <strong>{successPopup.date}</strong> às <strong>{successPopup.time}</strong>.
                     <br/><br/>
                     {successPopup.isAnjo ? 'O convite de acesso e a ficha de anamnese foram enviados automaticamente ao cliente.' : 'O agendamento foi salvo com sucesso.'}
                  </p>
                  <button
                     onClick={() => setSuccessPopup(null)}
                     className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
                  >
                     Entendi
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};

export default CalendarView;

