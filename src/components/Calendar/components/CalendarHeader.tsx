import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, Clock, List, Zap, Plus, Ban, Download } from 'lucide-react';
import { useCalendarContext, ViewType } from '../CalendarContext';

export const CalendarHeader: React.FC = () => {
   const {
      currentDate,
      handlePrev,
      handleNext,
      handleToday,
      viewType,
      setViewType,
      statusFilter,
      setStatusFilter,
      setIsAvailabilityModalOpen,
      setIsBlockModalOpen,
      handleManualAdd,
      filteredAppointments,
      showNotification
   } = useCalendarContext();

   const handleExportICS = () => {
      try {
         const header = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TeraNexus//PT-BR\n";
         const footer = "END:VCALENDAR";
         const events = filteredAppointments.map(apt => {
            const start = (apt?.date || '').replace(/-/g, '') + 'T' + (apt?.time || '00:00').replace(':', '') + '00';
            const h = apt?.time ? parseInt(apt.time.split(':')[0]) : 0;
            const hour = isNaN(h) ? 0 : h;
            const endHour = hour + 1;
            const m = apt?.time ? apt.time.split(':')[1] : '00';
            const end = (apt?.date || '').replace(/-/g, '') + 'T' + endHour.toString().padStart(2, '0') + m + '00';
            return `BEGIN:VEVENT\nUID:${apt.id}@teranexus.com\nSUMMARY:Sessão TRG - ${apt.patientName}\nDESCRIPTION:Protocolo: ${apt.type}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`;
         }).join('\n');
         const blob = new Blob([header + events + footer], { type: 'text/calendar' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a'); a.href = url; a.download = 'agenda_trg.ics'; a.click(); window.URL.revokeObjectURL(url);
         showNotification("Arquivo ICS gerado!", "success");
      } catch (e) { showNotification("Erro ao exportar.", "warning"); }
   };

   // handleFindSlot omitted here for simplicity, or we can add it later if needed by the header button
   // For now, removing handleFindSlot dependency from header since it requires AI optimization mock.

   return (
      <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 shrink-0">
         <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-1">
               <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={20} /></button>
               <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={20} /></button>
               <button onClick={handleToday} className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-1">Hoje</button>
            </div>
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
            <button onClick={() => { setIsBlockModalOpen(true); }} title="Bloquear Horário Extraordinário" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"><Ban size={20} /></button>
            <button onClick={handleExportICS} title="Exportar Agenda (.ics)" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary-600 transition-colors">
               <Download size={20} />
            </button>
            <button onClick={handleManualAdd} className="p-2.5 bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-2 font-bold">
               <Plus size={20} /> <span className="hidden sm:inline">Nova Sessão</span>
            </button>
         </div>
      </div>
   );
};
