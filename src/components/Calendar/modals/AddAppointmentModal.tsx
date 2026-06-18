import React from 'react';
import { CalendarIcon, Clock, DollarSign, Heart, User, X } from 'lucide-react';
import { useCalendarContext } from '../CalendarContext';
import { api } from '../../../services/api';
import { formatDateKey, formatPhone } from '../utils';

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

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAddModal(null)} />
         <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-slide-up border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
               <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <CalendarIcon className="text-primary-500" /> Agendar Sessão
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Preencha os dados do agendamento</p>
               </div>
               <button onClick={() => setAddModal(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
               <div className="p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex gap-1">
                  <button
                     type="button"
                     onClick={() => setAddModal({ ...addModal, isAnjo: false })}
                     className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        !addModal.isAnjo ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                     }`}
                  >
                     Regular
                  </button>
                  <button
                     type="button"
                     onClick={() => setAddModal({ ...addModal, isAnjo: true })}
                     className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        addModal.isAnjo ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-800/50' : 'text-slate-500 hover:text-slate-700'
                     }`}
                  >
                     Anjo (Gratuita)
                  </button>
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
                        <input
                           type="time"
                           className="font-semibold text-slate-800 dark:text-white bg-transparent outline-none w-full"
                           value={addModal.time}
                           onChange={(e) => setAddModal({ ...addModal, time: e.target.value })}
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-3 relative z-50">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">{addModal.isAnjo ? 'Nome do Paciente (Opcional)' : 'Nome do Paciente *'}</p>
                     <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500 shrink-0" />
                        <input
                           type="text"
                           required={!addModal.isAnjo}
                           className="w-full bg-transparent font-semibold text-slate-800 dark:text-white outline-none placeholder-slate-400"
                           placeholder="Ex: João da Silva"
                           value={addModal.patientName || ''}
                           onChange={(e) => {
                              setAddModal({ ...addModal, patientName: e.target.value, patientId: undefined });
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
                        <input
                           type="email"
                           className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder-slate-400"
                           placeholder="email@exemplo.com"
                           value={addModal.patientEmail || ''}
                           onChange={(e) => setAddModal({ ...addModal, patientEmail: e.target.value })}
                        />
                     </div>
                     <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">WhatsApp (Opcional)</p>
                        <input
                           type="tel"
                           className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder-slate-400"
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
                        <input
                           id="new-apt-price"
                           type="number"
                           className="w-full bg-transparent font-semibold text-slate-800 dark:text-white outline-none"
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
                  <button
                     onClick={() => setAddModal(null)}
                     className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                     <X size={16} /> Cancelar
                  </button>
                  <button
                     onClick={handleConfirmAdd}
                     className={`flex-1 py-2.5 font-bold rounded-xl text-white transition-all shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2 ${
                        addModal.isAnjo
                           ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                           : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600'
                     }`}
                  >
                     <CalendarIcon size={16} /> Confirmar
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};
