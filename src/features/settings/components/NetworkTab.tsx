import React from 'react';
import { LogOut, Network } from 'lucide-react';

// Helper component
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

interface NetworkTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

export const NetworkTab: React.FC<NetworkTabProps> = ({ formData, setFormData, triggerToast }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Network size={32} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl">Rede de Transbordo</h3>
            <p className="text-indigo-100 text-sm">Conecte-se com outros terapeutas para enviar ou receber pacientes.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* 1. Receive Patients (Target) */}
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-slate-800 dark:text-white text-lg">Receber Indicações</h4>
              {formData.is_verified ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Verificado</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">Não Verificado</span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              Ao ativar esta opção, você aparecerá nas buscas quando outros terapeutas precisarem encaminhar pacientes (Transbordo).
              Você receberá as indicações via WhatsApp.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <p className="text-sm text-slate-500 italic">Configure suas especialidades na aba "Meu Perfil" para serem exibidas aqui.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center md:border-l border-slate-200 dark:border-slate-700 md:pl-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Status</span>
              <ToggleSwitch
                checked={formData.is_overflow_target}
                onChange={() => {
                  if (!formData.is_verified) {
                      triggerToast('Você precisa validar seu certificado primeiro para receber indicações.', 'error');
                      return;
                  }
                  setFormData({ ...formData, is_overflow_target: !formData.is_overflow_target })
                }}
              />
              <span className={`text-sm font-bold ${formData.is_overflow_target ? 'text-green-600' : 'text-slate-400'}`}>
                {formData.is_overflow_target ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Send Patients (Source) */}
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                <LogOut size={20} />
              </div>
              <h4 className="font-bold text-red-900 dark:text-red-200 text-lg">Modo Transbordo (Fechar Agenda)</h4>
            </div>
            <p className="text-red-800 dark:text-red-300 text-sm leading-relaxed mb-4">
              Ative esta opção quando sua agenda estiver lotada.
              Seus pacientes verão um aviso de "Agenda Lotada" e serão oferecidos a opção de buscar um
              <strong> Terapeuta Parceiro Certificado</strong> da sua confiança (Rede de Transbordo).
            </p>
          </div>
          <div className="flex items-center justify-center md:border-l border-red-200 md:pl-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase text-red-400">Status</span>
              <ToggleSwitch
                checked={formData.is_overflow_source}
                onChange={() => setFormData({ ...formData, is_overflow_source: !formData.is_overflow_source })}
              />
              <span className={`text-sm font-bold ${formData.is_overflow_source ? 'text-red-600' : 'text-slate-400'}`}>
                {formData.is_overflow_source ? 'ATIVADO' : 'Desativado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
