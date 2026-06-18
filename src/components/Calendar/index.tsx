import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { CalendarProvider, useCalendarContext } from './CalendarContext';
import { CalendarHeader } from './components/CalendarHeader';
import { SidebarBlocks } from './components/SidebarBlocks';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { ListView } from './views/ListView';
import { AddAppointmentModal } from './modals/AddAppointmentModal';
import { BlockTimeModal } from './modals/BlockTimeModal';
import { AppointmentDetailsModal } from './modals/AppointmentDetailsModal';

const CalendarInner: React.FC<{ onNavigateToPatient?: (id: string) => void }> = ({ onNavigateToPatient }) => {
   const {
      viewType,
      loading,
      error,
      toast,
      isRescheduling,
      reschedulingAppointment,
      setIsRescheduling,
      setReschedulingAppointment
   } = useCalendarContext();

   const cancelReschedule = () => {
      setIsRescheduling(false);
      setReschedulingAppointment(null);
   };

   return (
      <div className="flex flex-col h-full min-h-[600px] animate-fade-in pb-20 md:pb-0 relative bg-white dark:bg-slate-900">
         {toast && toast.show && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-slide-up">
               <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-800 border-slate-700 text-white'}`}>
                  {toast.type === 'error' ? <AlertTriangle size={18} /> : toast.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  <span className="text-sm font-bold">{toast.message}</span>
               </div>
            </div>
         )}

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

         <CalendarHeader />

         <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            <div className="flex-1 min-w-0">
               {loading ? (
                  <div className="p-6 text-slate-500">Carregando agenda...</div>
               ) : error ? (
                  <div className="p-6 text-red-600">{error}</div>
               ) : (
                  <>
                     {viewType === 'month' && <MonthView />}
                     {viewType === 'week' && <WeekView />}
                     {viewType === 'day' && <DayView />}
                     {viewType === 'list' && <ListView />}
                  </>
               )}
            </div>
            
            <SidebarBlocks />
         </div>

         <AddAppointmentModal />
         <BlockTimeModal />
         <AppointmentDetailsModal onNavigateToPatient={onNavigateToPatient} />
      </div>
   );
};

interface CalendarViewProps {
   initialAction?: string;
   initialPatientId?: string;
   initialPatientName?: string;
   onActionConsumed?: () => void;
   onNavigateToPatient?: (id: string) => void;
   onNavigateToSession?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = (props) => {
   return (
      <CalendarProvider {...props}>
         <CalendarInner onNavigateToPatient={props.onNavigateToPatient} />
      </CalendarProvider>
   );
};

export default CalendarView;
