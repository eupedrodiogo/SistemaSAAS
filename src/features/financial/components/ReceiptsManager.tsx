import React from 'react';
import { FileText, Printer, Share2 } from 'lucide-react';

const UserIcon = ({ name }: { name: string }) => {
  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U';
  return <span className="font-bold text-sm">{initial}</span>
};

interface ReceiptsManagerProps {
  transactions: any[];
  handleGenerateReceipt: (name: string) => void;
}

export const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({ transactions, handleGenerateReceipt }) => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Gerador de Recibos e Notas</h3>
            <p className="text-slate-300 text-sm max-w-md">Emita documentos profissionais para seus pacientes automaticamente. Histórico completo de emissões disponível abaixo.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex items-center gap-4">
            <div className="p-3 bg-primary-500 rounded-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-white/60">Recibos Emitidos (Mês)</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        <FileText className="absolute -right-6 -bottom-6 text-white/5 w-48 h-48" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white">Pagamentos Recebidos (Disponível para Recibo)</h3>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline">Configurar Modelo</button>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.filter(t => t.type === 'income' && t.status === 'paid').map(t => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <UserIcon name={t.description} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{t.description}</p>
                  <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <span className="font-bold text-slate-800 dark:text-white">R$ {t.amount.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReceipt(t.description)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Imprimir"
                  >
                    <Printer size={16} />
                  </button>
                  <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Compartilhar">
                    <Share2 size={16} />
                  </button>
                  <button className="px-3 py-2 bg-primary-600 dark:bg-secondary-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-700 dark:hover:bg-secondary-700 transition-colors">
                    Emitir Recibo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
