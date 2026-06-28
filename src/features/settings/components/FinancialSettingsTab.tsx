import React from 'react';
import { QrCode } from 'lucide-react';

interface FinancialSettingsTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const FinancialSettingsTab: React.FC<FinancialSettingsTabProps> = ({ formData, setFormData }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dados Fiscais & Pagamento</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
              <QrCode size={20} />
            </div>
            <div>
              <h4 className="font-bold text-green-800 dark:text-green-200">Chave PIX Padrão</h4>
              <p className="text-xs text-green-700 dark:text-green-400">Esta chave será impressa nos recibos para facilitar o pagamento.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tipo de Chave</label>
              <select
                value={formData.pixType}
                onChange={(e) => setFormData({ ...formData, pixType: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-xl dark:text-white"
              >
                <option value="cpf">CPF / CNPJ</option>
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Chave PIX</label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-xl dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Notas de Rodapé (Recibos)</label>
          <textarea
            rows={3}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
            value={formData.invoiceNotes}
            onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })}
            placeholder="Ex: Documento para fins de reembolso..."
          />
        </div>
      </div>
    </div>
  );
};
