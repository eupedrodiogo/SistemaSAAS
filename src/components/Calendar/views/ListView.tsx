import React from 'react';
import { useCalendarContext } from '../CalendarContext';
import { safeParseDate } from '../utils';

export const ListView: React.FC = () => {
   const {
      filteredAppointments,
      setSelectedAppointment
   } = useCalendarContext();

   return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] flex flex-col">
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Lista de Agendamentos</h3>
         </div>
         <div className="overflow-y-auto custom-scrollbar p-2 space-y-2">
            {[...filteredAppointments]
               .sort((a, b) => (safeParseDate(a?.date || '').getTime() || 0) - (safeParseDate(b?.date || '').getTime() || 0))
               .map((apt: any) => (
               <div key={apt.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary-300 cursor-pointer" onClick={() => setSelectedAppointment(apt)}>
                  <div className="flex flex-col items-center min-w-[60px]">
                     <span className="text-xs font-bold uppercase text-slate-400">
                        {safeParseDate(apt?.date || '').toLocaleDateString('pt-BR', { weekday: 'short' })}
                     </span>
                     <span className="text-xl font-bold text-slate-800 dark:text-white">
                        {safeParseDate(apt?.date || '').getDate()}
                     </span>
                  </div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex-1">
                     <h4 className="font-bold text-slate-800 dark:text-white">{apt.patientName}</h4>
                     <span className="text-xs text-slate-500">{apt.time} • {apt.type}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};
