import React from 'react';
import { Calendar as CalendarIcon, Globe, Video } from 'lucide-react';

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

interface IntegrationsTabProps {
  integrations: any;
  setIntegrations: React.Dispatch<React.SetStateAction<any>>;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ integrations, setIntegrations }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white">Sincronização Zero-Click</h4>
              <p className="text-sm text-slate-500">Agendamentos são enviados via convite iCal para seu email.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-wider">Ativo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
              <Globe size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white">Google Calendar (API)</h4>
              <p className="text-sm text-slate-500">Integração nativa avançada (vincular conta).</p>
            </div>
          </div>
          <ToggleSwitch checked={integrations.googleCalendar} onChange={() => setIntegrations({ ...integrations, googleCalendar: !integrations.googleCalendar })} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
              <Video size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white">Zoom Meetings</h4>
              <p className="text-sm text-slate-500">Gera links de reunião para sessões remotas.</p>
            </div>
          </div>
          <ToggleSwitch checked={integrations.zoom} onChange={() => setIntegrations({ ...integrations, zoom: !integrations.zoom })} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center text-white">
              <Globe size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white">Stripe Payments</h4>
              <p className="text-sm text-slate-500">Processe cartões de crédito e boletos.</p>
            </div>
          </div>
          <ToggleSwitch checked={integrations.stripe} onChange={() => setIntegrations({ ...integrations, stripe: !integrations.stripe })} />
        </div>
      </div>
    </div>
  );
};
