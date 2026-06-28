import React from 'react';
import { Ban, CalendarIcon, Clock, X } from 'lucide-react';
import { useCalendarContext } from '../CalendarContext';
import { api } from '../../../services/api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const BlockTimeModal: React.FC = () => {
   const {
      isBlockModalOpen,
      setIsBlockModalOpen,
      blockForm,
      setBlockForm,
      setBlockedTimes,
      showNotification
   } = useCalendarContext();

   if (!isBlockModalOpen) return null;

   const handleAddBlock = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const newBlockData = { ...blockForm };
         const saved = await api.blockedTimes.create(newBlockData);
         setBlockedTimes((prev: any) => [...prev, saved]);
         setIsBlockModalOpen(false);
         showNotification('Horário bloqueado com sucesso', 'success');
      } catch (err: any) {
         showNotification('Erro ao bloquear: ' + err.message, 'error');
      }
   };

   return (
      <Dialog open={isBlockModalOpen} onOpenChange={(open) => !open && setIsBlockModalOpen(false)}>
         <DialogContent className="p-0 overflow-hidden sm:max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-0">
            <DialogTitle className="sr-only">Bloquear Horário</DialogTitle>
            <DialogDescription className="sr-only">Formulário para bloquear horários na agenda.</DialogDescription>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
               <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <Ban className="text-red-500" /> Bloquear Horário
                  </h3>
               </div>
            </div>
            <form onSubmit={handleAddBlock} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Bloqueio</label>
                  <select 
                     value={blockForm.type} 
                     onChange={e => setBlockForm({...blockForm, type: e.target.value})}
                     className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-700 dark:text-white"
                  >
                     <option value="date">Data Específica</option>
                     <option value="recurring">Recorrente (Toda semana)</option>
                  </select>
               </div>
               {blockForm.type === 'date' ? (
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Data</label>
                     <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                        <Input type="date" required value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})} className="h-auto py-2.5 w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-white" />
                     </div>
                  </div>
               ) : (
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Dia da Semana</label>
                     <select value={blockForm.dayOfWeek} onChange={e => setBlockForm({...blockForm, dayOfWeek: parseInt(e.target.value)})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-700 dark:text-white">
                        <option value={1}>Segunda-feira</option><option value={2}>Terça-feira</option><option value={3}>Quarta-feira</option>
                        <option value={4}>Quinta-feira</option><option value={5}>Sexta-feira</option><option value={6}>Sábado</option><option value={0}>Domingo</option>
                     </select>
                  </div>
               )}
               <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Início</label>
                     <div className="relative"><Clock size={16} className="absolute left-3 top-3 text-slate-400" /><Input type="time" required value={blockForm.startTime} onChange={e => setBlockForm({...blockForm, startTime: e.target.value})} className="h-auto py-2.5 w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-white" /></div>
                  </div>
                  <div className="flex-1">
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Fim</label>
                     <div className="relative"><Clock size={16} className="absolute left-3 top-3 text-slate-400" /><Input type="time" required value={blockForm.endTime} onChange={e => setBlockForm({...blockForm, endTime: e.target.value})} className="h-auto py-2.5 w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-white" /></div>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo (Opcional)</label>
                  <Input type="text" placeholder="Ex: Almoço, Reunião" value={blockForm.label} onChange={e => setBlockForm({...blockForm, label: e.target.value})} className="h-auto py-2.5 w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-white" />
               </div>
               <div className="flex gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsBlockModalOpen(false)} className="flex-1 h-10 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</Button>
                  <Button type="submit" className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg">Salvar Bloqueio</Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
};
