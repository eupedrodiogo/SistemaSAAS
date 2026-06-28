import React from 'react';
import { X, Plus, Edit2, Save } from 'lucide-react';
import { Patient } from 'types';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PatientEditModalProps {
  editingClient: Patient | null;
  isAddingClient: boolean;
  editForm: Partial<Patient>;
  setEditForm: (form: Partial<Patient>) => void;
  setEditingClient: (client: Patient | null) => void;
  setIsAddingClient: (adding: boolean) => void;
  handleSaveEdit: () => void;
}

export const PatientEditModal: React.FC<PatientEditModalProps> = ({
  editingClient,
  isAddingClient,
  editForm,
  setEditForm,
  setEditingClient,
  setIsAddingClient,
  handleSaveEdit
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        setEditingClient(null);
        setIsAddingClient(false);
      }
    }}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] gap-0 [&>button]:top-4 [&>button]:right-4">
        <DialogTitle className="sr-only">{isAddingClient ? 'Novo Cliente' : 'Editar Cliente'}</DialogTitle>
        <DialogDescription className="sr-only">Preencha os dados do paciente.</DialogDescription>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {isAddingClient ? <Plus size={18} /> : <Edit2 size={18} />} 
            {isAddingClient ? 'Novo Cliente' : 'Editar Cliente'}
          </h3>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nome Completo</label>
            <Input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Email</label>
              <Input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Telefone</label>
              <Input
                type="text"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status</label>
            <div className="flex gap-2">
              {['Ativo', 'Em Pausa', 'Inativo'].map(status => (
                <button
                  key={status}
                  onClick={() => setEditForm({ ...editForm, status: status as any })}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${editForm.status === status
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Notas Rápidas</label>
            <textarea
              rows={3}
              value={editForm.notes || ''}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
            />
          </div>

          <Button
            onClick={handleSaveEdit}
            className="w-full h-12 bg-primary-600 hover:bg-primary-700 dark:bg-secondary-600 dark:hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <Save size={18} /> Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
