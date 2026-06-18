import React from 'react';
import { ChevronLeft, ChevronRight, Ban, DollarSign, Heart } from 'lucide-react';
import { useCalendarContext } from '../CalendarContext';
import { isSameDate, safeParseDate, weekDays } from '../utils';

export const SidebarBlocks: React.FC = () => {
   const {
      currentDate,
      setCurrentDate,
      viewType,
      handlePrev,
      handleNext,
      sidebarTab,
      setSidebarTab,
      appointments,
      setSelectedAppointment,
      blockedTimes
   } = useCalendarContext();

   const renderMiniCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDay = firstDay.getDay();
      const days = []; 
      for (let i = 0; i < startDay; i++) days.push(null); 
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      
      return (
         <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-3">
               <span className="text-center font-bold text-sm text-slate-700 dark:text-slate-200">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
               </span>
               <div className="flex gap-1">
                  <button onClick={handlePrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                     <ChevronLeft size={14} />
                  </button>
                  <button onClick={handleNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                     <ChevronRight size={14} />
                  </button>
               </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-bold mb-2">
               <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
               {days.map((d, i) => (
                  <div key={i} className="aspect-square flex items-center justify-center">
                     {d && (
                        <button 
                           onClick={() => setCurrentDate(d)} 
                           className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${isSameDate(d, currentDate) ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                           {d.getDate()}
                        </button>
                     )}
                  </div>
               ))}
            </div>
         </div>
      );
   };

   return (
      <div className="hidden xl:flex w-80 flex-col gap-4 shrink-0">
         {viewType !== 'month' && renderMiniCalendar()}
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-200px)]">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 shrink-0">
               <button onClick={() => setSidebarTab('sessions')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'sessions' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sessões</button>
               <button onClick={() => setSidebarTab('blocks')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sidebarTab === 'blocks' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Bloqueios</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
               {sidebarTab === 'sessions' ? (
                  appointments.filter((a: any) => safeParseDate(a.date).getTime() >= new Date().setHours(0,0,0,0)).sort((a: any, b: any) => safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()).slice(0,10).map((apt: any) => (
                     <div key={apt.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-primary-300" onClick={() => setSelectedAppointment(apt)}>
                        <div className="flex justify-between items-start mb-1">
                           <span className="font-bold text-slate-800 dark:text-white text-sm">
                              {safeParseDate(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {apt.time}
                           </span>
                           {apt.sessionData?.price === 0 ? <Heart size={14} className="text-pink-500" /> : <DollarSign size={14} className="text-emerald-500" />}
                        </div>
                        <h4 className="font-bold text-primary-600 dark:text-primary-400 text-xs truncate">{apt.patientName}</h4>
                     </div>
                  ))
               ) : (
                  blockedTimes.map((b: any) => (
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
   );
};
