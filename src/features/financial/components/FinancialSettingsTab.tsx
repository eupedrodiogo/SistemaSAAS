import React from 'react';

interface FinancialSettingsTabProps {
  showNotification: (msg: string, type: string) => void;
}

export const FinancialSettingsTab: React.FC<FinancialSettingsTabProps> = ({ showNotification }) => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Políticas de Cancelamento e Cobrança</h3>
        <p className="text-sm text-slate-500 mb-6">Defina as regras automáticas para cobrança de taxas.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Prazo para Cancelamento Gratuito</label>
            <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-700 dark:text-white outline-none">
              <option>24 horas de antecedência</option>
              <option>48 horas de antecedência</option>
            </select>
          </div>
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Taxa de No-Show</label>
            <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg font-bold text-slate-700 dark:text-white outline-none">
              <option>50% do valor da sessão</option>
              <option>100% do valor da sessão</option>
            </select>
          </div>
        </div>
        <button onClick={() => showNotification("Políticas salvas!", "success")} className="mt-4 px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold">Salvar Preferências</button>
      </div>
    </div>
  );
};
