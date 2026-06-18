import React from 'react';
import { CalendarDays, Ban, Plus, DollarSign, Heart, Clock } from 'lucide-react';
import { useCalendarContext } from '../CalendarContext';
import { isSameDate, weekDays, formatDateKey } from '../utils';

export const MonthView: React.FC = () => {
   const {
      currentDate,
      selectedDay,
      setSelectedDay,
      setCurrentDate,
      isRescheduling,
      showNotification,
      getAppointmentsForDate,
      getBlockedTimeForDay,
      setSelectedAppointment,
      setAddModal,
      isSlotConflicting,
      handleManualAdd,
      setIsBlockModalOpen
   } = useCalendarContext();

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
                  <button onClick={() => setIsBlockModalOpen(true)} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-red-500 hover:text-red-600">
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
                     {apts.map((apt: any) => (
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
   };

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
                              // Let hook handle or maybe update hook's viewType here?
                              // But we don't have setViewType exposed inside MonthView unless we get it from context
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
                               {/* Resumo de sessões */}
                               {apts.length > 0 && (
                                  <div className={`transition-opacity duration-150 hidden md:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm ${isSelected ? 'opacity-0 pointer-events-none' : 'group-hover:opacity-0'}`} title={`${apts.length} sessões no total`}>
                                     {apts.filter((a:any) => a.sessionData?.price !== 0).length > 0 && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center"><DollarSign size={10} strokeWidth={3} className="-mr-0.5" />{apts.filter((a:any) => a.sessionData?.price !== 0).length}</span>}
                                     {apts.filter((a:any) => a.sessionData?.price === 0).length > 0 && <span className="text-[10px] font-bold text-pink-500 dark:text-pink-400 flex items-center gap-0.5"><Heart size={10} fill="currentColor" className="opacity-80" />{apts.filter((a:any) => a.sessionData?.price === 0).length}</span>}
                                  </div>
                               )}

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
                           {apts.map((apt: any) => {
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
                           {apts.slice(0, 3).map((apt: any) => (
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
