import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'
        }`}
    />
  </button>
);

interface NotificationsTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  reminder15minEnabled: boolean;
  setReminder15minEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  reminder24hEnabled: boolean;
  setReminder24hEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  whatsappTemplate: string;
  setWhatsappTemplate: React.Dispatch<React.SetStateAction<string>>;
  showNotification: (msg: string) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  formData,
  setFormData,
  reminder15minEnabled,
  setReminder15minEnabled,
  reminder24hEnabled,
  setReminder24hEnabled,
  whatsappTemplate,
  setWhatsappTemplate,
  showNotification
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Preferências de Notificação</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 dark:text-white">Email</p>
            <p className="text-xs text-slate-500">Receber resumos semanais e alertas de segurança.</p>
          </div>
          <ToggleSwitch checked={formData.notifications?.email} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, email: !formData.notifications?.email } })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 dark:text-white">Push (Navegador)</p>
            <p className="text-xs text-slate-500">Alertas de próxima sessão e mensagens.</p>
          </div>
          <ToggleSwitch checked={formData.notifications?.push} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, push: !formData.notifications?.push } })} />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-green-500" /> Integração WhatsApp
              </p>
              <p className="text-xs text-slate-500">Enviar lembretes automáticos para pacientes.</p>
            </div>
            <ToggleSwitch checked={formData.notifications?.whatsapp} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, whatsapp: !formData.notifications?.whatsapp } })} />
          </div>

          {formData.notifications?.whatsapp && (
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4 animate-slide-up space-y-5">
              {/* Lembrete 15 minutos */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    ⏰ Lembrete 15 minutos antes
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Enviado automaticamente no dia da sessão via Z-API.</p>
                  {reminder15minEnabled && (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Preview da mensagem</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        🌿 <strong>TeraNexus — Lembrete de Sessão</strong><br/>
                        Olá, <strong>[Nome do Paciente]</strong>! ⏰ Sua sessão está marcada para <strong>hoje às [HH:MM]</strong>.<br/>
                        🔗 Acesse o portal e entre na sala com antecedência.
                      </p>
                    </div>
                  )}
                </div>
                <ToggleSwitch
                  checked={reminder15minEnabled}
                  onChange={() => setReminder15minEnabled(v => !v)}
                />
              </div>

              <div className="border-t border-green-100 dark:border-green-900/30" />

              {/* Lembrete 24 horas */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    📅 Lembrete 24 horas antes
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Enviado na véspera da sessão via Z-API (texto livre, sem aprovação Meta).</p>
                  {reminder24hEnabled && (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Preview da mensagem</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        🌿 <strong>TeraNexus — Lembrete de Sessão</strong><br/>
                        Olá, <strong>[Nome do Paciente]</strong>! Sua sessão com <strong>[Seu Nome]</strong> está confirmada para <strong>amanhã às [HH:MM]</strong>. ✨<br/>
                        🔗 Acesse seu portal com antecedência.
                      </p>
                    </div>
                  )}
                </div>
                <ToggleSwitch
                  checked={reminder24hEnabled}
                  onChange={() => setReminder24hEnabled(v => !v)}
                />
              </div>

              <div className="border-t border-green-100 dark:border-green-900/30" />

              {/* Modelo personalizado (legado) */}
              <div>
                <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-2 uppercase">Modelo Personalizado (15min)</label>
                <textarea
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => showNotification("Mensagem de teste enviada!")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Send size={12} /> Testar Envio
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
