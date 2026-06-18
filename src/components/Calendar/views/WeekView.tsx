import React from 'react';
import { Ban } from 'lucide-react';
import { useCalendarContext } from '../CalendarContext';
import { isSameDate, weekDays, formatDateKey } from '../utils';

export const WeekView: React.FC = () => {
   const {
      currentDate,
      getAppointmentsForDate,
      getBlockedTimeForDay,
      handleQuickAdd,
      setSelectedAppointment,
      suggestedSlot
   } = useCalendarContext();

   const start = new Date(currentDate); 
   start.setDate(start.getDate() - start.getDay());
   
   const weekDates = Array.from({ length: 7 }, (_, i) => { 
      const d = new Date(start); 
      d.setDate(d.getDate() + i); 
      return d; 
   });
   
   const hours = Array.from({ length: 13 }, (_, i) => i + 8);

   return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]">
         <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="w-12 border-r border-slate-200 dark:border-slate-800 shrink-0"></div>
            {weekDates.map((date, i) => (
               <div key={i} className={`flex-1 p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-none ${isSameDate(date, new Date()) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">{weekDays[date.getDay()].short}</p>
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isSameDate(date, new Date()) ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                     {date.getDate()}
                  </div>
               </div>
            ))}
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {hours.map(hour => (
               <div key={hour} className="flex border-b border-slate-100 dark:border-slate-800 min-h-[80px]">
                  <div className="w-12 border-r border-slate-100 dark:border-slate-800 p-2 text-[10px] font-bold text-slate-400 text-right bg-slate-50/30 dark:bg-slate-950/30">
                     {hour}:00
                  </div>
                  {weekDates.map((date, i) => {
                     const apts = getAppointmentsForDate(date).filter(a => parseInt(a.time.split(':')[0]) === hour); 
                     const blocked = getBlockedTimeForDay(date).some(b => parseInt(b.startTime.split(':')[0]) <= hour && parseInt(b.endTime.split(':')[0]) > hour); 
                     const isSuggested = suggestedSlot && suggestedSlot.date === formatDateKey(date) && parseInt(suggestedSlot.time.split(':')[0]) === hour; 
                     
                     return (
                        <div 
                           key={i} 
                           className={`flex-1 border-r border-slate-100 dark:border-slate-800 p-1 relative group transition-colors ${blocked ? 'bg-stripes-gray opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'} ${isSuggested ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-inset ring-2 ring-amber-300 dark:ring-amber-700' : ''}`} 
                           onClick={() => !blocked && apts.length === 0 && handleQuickAdd(date, `${hour}:00`)}
                        >
                           {blocked && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                 <Ban size={16} className="text-slate-400" />
                              </div>
                           )}
                           {apts.map((apt: any) => (
                              <div 
                                 key={apt.id} 
                                 onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }} 
                                 className={`text-[10px] p-1.5 rounded mb-1 cursor-pointer truncate shadow-sm hover:shadow-md transition-all border-l-2 ${(apt.status === 'scheduled' || apt.status === 'Agendado') ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 border-primary-500' :
                                    apt.status === 'pending_payment' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-500' :
                                       (apt.status === 'completed' || apt.status === 'Concluído') ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-500' :
                                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                 }`} 
                                 title={`${apt.time} - ${apt.patientName}`}
                              >
                                 <span className="font-bold block">{apt.time}</span>
                                 {apt.patientName.split(' ')[0]}
                              </div>
                           ))}
                        </div>
                     );
                  })}
               </div>
            ))}
         </div>
      </div>
   );
};
