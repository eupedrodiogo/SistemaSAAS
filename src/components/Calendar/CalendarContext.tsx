import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, BlockedTime } from 'types';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { formatDateKey, isSameDate, safeParseDate, formatPhone } from './utils';

export type ViewType = 'day' | 'week' | 'month' | 'list';

interface CalendarContextProps {
   currentDate: Date;
   setCurrentDate: (date: Date) => void;
   selectedDay: Date;
   setSelectedDay: (date: Date) => void;
   viewType: ViewType;
   setViewType: (view: ViewType) => void;
   selectedAppointment: Appointment | null;
   setSelectedAppointment: (apt: Appointment | null) => void;
   appointments: Appointment[];
   setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
   loading: boolean;
   error: string;
   statusFilter: string;
   setStatusFilter: (s: string) => void;
   blockedTimes: BlockedTime[];
   setBlockedTimes: React.Dispatch<React.SetStateAction<BlockedTime[]>>;
   availability: any[];
   suggestedSlot: { date: string, time: string } | null;
   setSuggestedSlot: React.Dispatch<React.SetStateAction<{ date: string, time: string } | null>>;
   isRescheduling: boolean;
   setIsRescheduling: (v: boolean) => void;
   reschedulingAppointment: Appointment | null;
   setReschedulingAppointment: (apt: Appointment | null) => void;
   addModal: any;
   setAddModal: (data: any) => void;
   successPopup: any;
   setSuccessPopup: (data: any) => void;
   isBlockModalOpen: boolean;
   setIsBlockModalOpen: (v: boolean) => void;
   isAvailabilityModalOpen: boolean;
   setIsAvailabilityModalOpen: (v: boolean) => void;
   blockForm: any;
   setBlockForm: (data: any) => void;
   toast: any;
   setToast: (data: any) => void;
   isOptimizationModalOpen: boolean;
   setIsOptimizationModalOpen: (v: boolean) => void;
   optimizationData: any;
   setOptimizationData: (data: any) => void;
   sidebarTab: 'sessions' | 'blocks';
   setSidebarTab: (tab: 'sessions' | 'blocks') => void;
   patientsList: any[];
   showPatientDropdown: boolean;
   setShowPatientDropdown: (v: boolean) => void;
   
   // Ações Helper
   showNotification: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
   isSlotConflicting: (date: Date, time: string) => boolean;
   getBlockedTimeForDay: (date: Date) => any[];
   getAppointmentsForDate: (date: Date) => any[];
   handleQuickAdd: (date: Date, time: string) => void;
   handleManualAdd: () => void;
   handlePrev: () => void;
   handleNext: () => void;
   handleToday: () => void;
   filteredAppointments: Appointment[];
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

export const CalendarProvider = ({ children, initialAction, initialPatientId, initialPatientName, onActionConsumed }: { children: ReactNode, initialAction?: any, initialPatientId?: any, initialPatientName?: any, onActionConsumed?: any }) => {
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

   useEffect(() => {
      if (initialAction === 'create') {
         setTimeout(() => {
            setViewType('week');
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

   const showNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(null), 5000);
   };

   const filteredAppointments = appointments.filter(apt => {
      if (!apt) return false;
      if (statusFilter === 'all') return true;
      return apt.status === statusFilter;
   });

   const getBlockedTimeForDay = (date: Date) => {
      const d = date.getDay();
      const dayMapping: { [key: number]: string } = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
      const dayStr = dayMapping[d];
      const k = formatDateKey(date);
      const explicitBlocks = blockedTimes.filter(b => {
         if (!b) return false;
         const blockDate = b.date ? (typeof b.date === 'string' ? b.date.split('T')[0] : b.date) : null;
         return (blockDate === k) || (String(b.dayOfWeek) === String(d) || String(b.dayOfWeek) === dayStr);
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

   const isSlotConflicting = (date: Date, time: string): boolean => {
      const dateKey = formatDateKey(date);
      const hour = parseInt(time.split(':')[0]);

      const hasAppointment = filteredAppointments.some(apt => {
         const isCanceled = apt.status === 'cancelled' || apt.status === 'Cancelado';
         return (
            apt.date === dateKey &&
            parseInt(apt.time.split(':')[0]) === hour &&
            !isCanceled
         );
      });

      if (hasAppointment) return true;

      const isBlocked = getBlockedTimeForDay(date).some(block => {
         if (!block) return false;
         return hour >= parseInt(block.startTime.split(':')[0]) &&
                hour < parseInt(block.endTime.split(':')[0]);
      });

      return isBlocked;
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
               setAppointments(prev => prev.map(a => a.id === reschedulingAppointment.id ? { ...a, date: dateKey, time: time } : a));
               showNotification('Agendamento reagendado com sucesso!', 'success');
               setIsRescheduling(false);
               setReschedulingAppointment(null);
            }).catch((err) => showNotification(`Erro: ${err.message}`, 'error'));
         }
         return;
      }

      // Merge user selection with initials if available
      setAddModal({ 
         isOpen: true, 
         date, 
         time,
         patientId: initialPatientId,
         patientName: initialPatientName
      });
   };

   const handleManualAdd = () => {
      const now = new Date();
      let time = '08:00';
      if (selectedDay.getDate() === now.getDate() && selectedDay.getMonth() === now.getMonth() && selectedDay.getFullYear() === now.getFullYear()) {
         const h = now.getHours() + 1;
         if (h >= 8 && h < 18) time = `${h.toString().padStart(2, '0')}:00`;
      }
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

   const getAppointmentsForDate = (date: Date) => {
      const k = formatDateKey(date);
      const list = filteredAppointments.filter(apt => apt.date === k);
      return list.sort((a, b) => (a?.time || '').localeCompare(b?.time || ''));
   };

   const handlePrev = () => { const d = new Date(currentDate); if (viewType === 'week') d.setDate(d.getDate() - 7); else if (viewType === 'day') d.setDate(d.getDate() - 1); else d.setMonth(d.getMonth() - 1); setCurrentDate(d); };
   const handleNext = () => { const d = new Date(currentDate); if (viewType === 'week') d.setDate(d.getDate() + 7); else if (viewType === 'day') d.setDate(d.getDate() + 1); else d.setMonth(d.getMonth() + 1); setCurrentDate(d); };
   const handleToday = () => { const now = new Date(); setCurrentDate(now); setSelectedDay(now); };

   return (
      <CalendarContext.Provider value={{
         currentDate, setCurrentDate, selectedDay, setSelectedDay, viewType, setViewType,
         selectedAppointment, setSelectedAppointment, appointments, setAppointments,
         loading, error, statusFilter, setStatusFilter, blockedTimes, setBlockedTimes,
         availability, suggestedSlot, setSuggestedSlot, isRescheduling, setIsRescheduling,
         reschedulingAppointment, setReschedulingAppointment, addModal, setAddModal,
         successPopup, setSuccessPopup, isBlockModalOpen, setIsBlockModalOpen,
         isAvailabilityModalOpen, setIsAvailabilityModalOpen, blockForm, setBlockForm,
         toast, setToast, isOptimizationModalOpen, setIsOptimizationModalOpen,
         optimizationData, setOptimizationData, sidebarTab, setSidebarTab, patientsList,
         showPatientDropdown, setShowPatientDropdown, showNotification, isSlotConflicting,
         getBlockedTimeForDay, getAppointmentsForDate, handleQuickAdd, handleManualAdd,
         handlePrev, handleNext, handleToday, filteredAppointments
      }}>
         {children}
      </CalendarContext.Provider>
   );
};

export const useCalendarContext = () => {
   const context = useContext(CalendarContext);
   if (!context) {
      throw new Error("useCalendarContext must be used within a CalendarProvider");
   }
   return context;
};
