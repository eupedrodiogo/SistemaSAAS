import React from 'react';
import { useCalendarContext } from '../CalendarContext';

export const DayView: React.FC = () => {
   const {
      currentDate,
      getAppointmentsForDate,
      handleQuickAdd,
      setSelectedAppointment
   } = useCalendarContext();

   return (
      <div className="flex flex-col h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
         <div className="absolute left-16 right-0 border-t-2 border-red-400 z-10 flex items-center" style={{ top: '35%' }}>
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
            <span className="text-[10px] font-bold text-red-500 bg-white dark:bg-slate-900 px-1 ml-1">Agora</span>
         </div>
         {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
            <div key={hour} className="flex border-b border-slate-100 dark:border-slate-800 min-h-[100px] relative group">
               <div className="w-16 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 p-2 text-xs text-slate-400 text-right font-medium bg-slate-50/50 dark:bg-slate-950/50 sticky left-0">{hour}:00</div>
               <div className="flex-1 p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => handleQuickAdd(currentDate, `${hour}:00`)}>
                  {getAppointmentsForDate(currentDate).filter(a => parseInt(a.time.split(':')[0]) === hour).map((apt: any) => (
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
};
