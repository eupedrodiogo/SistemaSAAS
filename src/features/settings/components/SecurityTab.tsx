import React from 'react';
import { Database, Download, Laptop, Smartphone } from 'lucide-react';

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

interface SecurityTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ formData, setFormData }) => {
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "meus_dados_teranexus.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Segurança da Conta</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Autenticação de Dois Fatores (2FA)</p>
              <p className="text-xs text-slate-500">Adiciona uma camada extra de segurança ao login.</p>
            </div>
            <ToggleSwitch checked={formData.security?.twoFactor} onChange={() => setFormData({ ...formData, security: { ...formData.security, twoFactor: !formData.security?.twoFactor } })} />
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Dispositivos Ativos</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-primary-500">
                  <Laptop size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-white">MacBook Pro (Este dispositivo)</p>
                  <p className="text-xs text-slate-500">São Paulo, BR • Ativo agora</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 opacity-60">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800 dark:text-white">iPhone 14</p>
                  <p className="text-xs text-slate-500">São Paulo, BR • 2h atrás</p>
                </div>
                <button className="text-xs text-red-500 hover:underline">Desconectar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Database size={18} /> Gestão de Dados (LGPD)
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">Você pode exportar todos os seus dados para backup ou conformidade legal.</p>
          <button
            onClick={handleExportData}
            className="w-full py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={18} /> Baixar Cópia dos Dados (JSON)
          </button>
        </div>
      </div>
    </div>
  );
};
