import React from 'react';
import { CalendarIcon, Clock, DollarSign, Heart, User, X } from 'lucide-react';
import { useCalendarContext } from '../CalendarContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '../../../services/api';
import { formatDateKey, formatPhone } from '../utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Schema Zod ────────────────────────────────────────────────────────────────
const appointmentSchema = z.object({
   patientId: z.string().optional(),
   patientName: z.string().optional(),
   date: z.string().min(1, 'Data é obrigatória'),
   time: z.string().min(1, 'Horário é obrigatório'),
   duration: z
      .number({ message: 'Duração deve ser um número' })
      .positive('Duração deve ser positiva')
      .optional(),
}).superRefine((data, ctx) => {
   // patientName obrigatório apenas para sessões não-Anjo (verificado no handler)
   // Deixamos a validação de patientName para o handler existente pois depende de isAnjo
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const AddAppointmentModal: React.FC = () => {
   const {
      addModal,
      setAddModal,
      patientsList,
      showPatientDropdown,
      setShowPatientDropdown,
      setAppointments,
      showNotification,
      setSuccessPopup
   } = useCalendarContext();

   const {
      register,
      handleSubmit,
      setValue,
      formState: { errors },
   } = useForm<AppointmentFormData>({
      resolver: zodResolver(appointmentSchema),
      defaultValues: {
         patientId: addModal?.patientId ?? '',
         patientName: addModal?.patientName ?? '',
         date: addModal?.date ? formatDateKey(addModal.date) : '',
         time: addModal?.time ?? '',
         duration: undefined,
      },
   });

   if (!addModal?.isOpen) return null;

   const handleConfirmAdd = async () => {
      try {
         if (!addModal.isAnjo && !addModal.patientName) {
            showNotification('O nome do paciente é obrigatório', 'error');
            return;
         }

         const appointmentData: any = {
            date: formatDateKey(addModal.date),
            time: addModal.time,
            patientName: addModal.patientName || 'Paciente (Anjo)',
            patientId: addModal.patientId || 'unregistered',
            patientEmail: addModal.patientEmail || '',
            patientPhone: addModal.patientPhone || '',
            type: addModal.isAnjo ? 'Anjo' : 'Regular',
            status: addModal.isAnjo ? 'scheduled' : 'pending_payment',
            sessionData: {
               price: addModal.isAnjo ? 0 : Number((document.getElementById('new-apt-price') as HTMLInputElement)?.value || 150)
            }
         };

         const newApt = await api.appointments.create(appointmentData);

         setAppointments((prev: any) => [...prev, newApt]);
         setSuccessPopup({ isOpen: true, date: addModal.date.toLocaleDateString('pt-BR'), time: addModal.time, isAnjo: addModal.isAnjo });
         setAddModal(null);
      } catch (err: any) {
         showNotification('Erro ao agendar: ' + err.message, 'error');
      }
   };

   // Wrapper que valida com RHF/zod antes de chamar o handler original
   const onSubmitValidated = handleSubmit(() => {
      handleConfirmAdd();
   });

   return (
      <Dialog open={addModal?.isOpen} onOpenChange={(open) => !open && setAddModal(null)}>
         <DialogContent className="p-0 overflow-hidden sm:max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] gap-0">
            <DialogTitle className="sr-only">Agendar Sessão</DialogTitle>
            <DialogDescription className="sr-only">Preencha os dados do agendamento</DialogDescription>
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
               <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <CalendarIcon className="text-primary-500" /> Agendar Sessão
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Preencha os dados do agendamento</p>
               </div>
            </div>

            <form onSubmit={onSubmitValidated} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
               <div className="p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex gap-1">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => setAddModal({ ...addModal, isAnjo: false })}
                     className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all ${
                        !addModal.isAnjo ? 'bg-white hover:bg-white dark:bg-slate-700 dark:hover:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-transparent'
                     }`}
                  >
                     Regular
                  </Button>
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => setAddModal({ ...addModal, isAnjo: true })}
                     className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all ${
                        addModal.isAnjo ? 'bg-rose-50 hover:bg-rose-50 dark:bg-rose-900/30 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-800/50' : 'text-slate-500 hover:text-slate-700 hover:bg-transparent'
                     }`}
                  >
                     Anjo (Gratuita)
                  </Button>
               </div>

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
                        <Input
                           type="time"
                           className="font-semibold text-slate-800 dark:text-white bg-transparent h-auto py-0 px-0 w-full border-0 shadow-none focus-visible:ring-0"
                           value={addModal.time}
                           onChange={(e) => {
                              setAddModal({ ...addModal, time: e.target.value });
                              setValue('time', e.target.value);
                           }}
                        />
                     </div>
                     {errors.time && (
                        <p className="text-xs text-red-500 mt-1">{errors.time.message}</p>
                     )}
                  </div>
               </div>

               <div className="space-y-3 relative z-50">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">{addModal.isAnjo ? 'Nome do Paciente (Opcional)' : 'Nome do Paciente *'}</p>
                     <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500 shrink-0" />
                        <Input
                           type="text"
                           required={!addModal.isAnjo}
                           className="h-auto py-0 px-0 w-full bg-transparent border-0 shadow-none focus-visible:ring-0 font-semibold text-slate-800 dark:text-white placeholder-slate-400"
                           placeholder="Ex: João da Silva"
                           value={addModal.patientName || ''}
                           onChange={(e) => {
                              setAddModal({ ...addModal, patientName: e.target.value, patientId: undefined });
                              setValue('patientName', e.target.value);
                              setShowPatientDropdown(true);
                           }}
                           onFocus={() => setShowPatientDropdown(true)}
                           onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                        />
                     </div>
                     
                     {showPatientDropdown && addModal.patientName && (
                        <div className="absolute left-0 top-[100%] mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                           {patientsList
                              .filter((p: any) => p.name.toLowerCase().includes(addModal.patientName!.toLowerCase()))
                              .map((p: any) => (
                              <div
                                 key={p.id}
                                 className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                 onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    setAddModal({
                                       ...addModal, 
                                       patientId: p.id,
                                       patientName: p.name, 
                                       patientEmail: p.email || '', 
                                       patientPhone: p.phone ? formatPhone(p.phone) : ''
                                    });
                                    setValue('patientId', p.id);
                                    setValue('patientName', p.name);
                                    setShowPatientDropdown(false);
                                 }}
                              >
                                 <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{p.name}</p>
                                 <p className="text-xs text-slate-500">{p.email || 'Sem e-mail'} • {p.phone ? formatPhone(p.phone) : 'Sem telefone'}</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  
                  <div className="flex gap-3">
                     <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">E-mail (Opcional)</p>
                        <Input
                           type="email"
                           className="h-auto py-0 px-0 w-full bg-transparent border-0 shadow-none focus-visible:ring-0 text-sm text-slate-800 dark:text-white placeholder-slate-400"
                           placeholder="email@exemplo.com"
                           value={addModal.patientEmail || ''}
                           onChange={(e) => setAddModal({ ...addModal, patientEmail: e.target.value })}
                        />
                     </div>
                     <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">WhatsApp (Opcional)</p>
                        <Input
                           type="tel"
                           className="h-auto py-0 px-0 w-full bg-transparent border-0 shadow-none focus-visible:ring-0 text-sm text-slate-800 dark:text-white placeholder-slate-400"
                           placeholder="(00) 00000-0000"
                           value={addModal.patientPhone || ''}
                           onChange={(e) => setAddModal({ ...addModal, patientPhone: formatPhone(e.target.value) })}
                        />
                     </div>
                  </div>
               </div>

               {!addModal.isAnjo && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">Valor da Sessão</p>
                     <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-500">R$</span>
                        <Input
                           id="new-apt-price"
                           type="number"
                           className="h-auto py-0 px-0 w-full bg-transparent border-0 shadow-none focus-visible:ring-0 font-semibold text-slate-800 dark:text-white"
                           defaultValue={150}
                           step={10}
                           min={0}
                        />
                     </div>
                  </div>
               )}

               {addModal.isAnjo && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-2 text-rose-500 text-sm">
                     <span className="font-bold flex items-center mb-1">
                        <Heart className="w-4 h-4 mr-2" /> Convite Automático
                     </span>
                     <p className="text-rose-600/80 dark:text-rose-400/80 leading-relaxed text-xs uppercase font-bold tracking-wide">
                        PREENCHA OS CAMPOS ACIMA PARA O ENVIO AUTOMÁTICO DO CONVITE DE ACESSO À SESSÃO.
                     </p>
                  </div>
               )}

               <div className="flex gap-2">
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => setAddModal(null)}
                     className="flex-1 h-12 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm flex items-center justify-center gap-2"
                  >
                     <X size={16} /> Cancelar
                  </Button>
                  <Button
                     type="submit"
                     className={`flex-1 h-12 font-bold rounded-xl text-white shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2 ${
                        addModal.isAnjo
                           ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                           : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600'
                     }`}
                  >
                     <CalendarIcon size={16} /> Confirmar
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
};
