import React from 'react';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Schema Zod ────────────────────────────────────────────────────────────────
const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter ao menos 3 caracteres'),
  amount: z
    .number({ message: 'Valor deve ser um número' })
    .positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['income', 'expense']),
  status: z.enum(['Pago', 'Pendente']),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface TransactionModalProps {
  newTransaction: any;
  setNewTransaction: React.Dispatch<React.SetStateAction<any>>;
  setIsTransactionModalOpen: (open: boolean) => void;
  handleSaveTransaction: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  newTransaction,
  setNewTransaction,
  setIsTransactionModalOpen,
  handleSaveTransaction,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: newTransaction.description ?? '',
      amount: newTransaction.amount ? Number(newTransaction.amount) : undefined,
      date: newTransaction.date ?? '',
      category: newTransaction.category ?? '',
      type: newTransaction.type ?? 'income',
      status: newTransaction.status ?? 'Pendente',
    },
  });

  const watchedType = watch('type');
  const watchedStatus = watch('status');

  // Mantém newTransaction em sincronia para que handleSaveTransaction use os valores atualizados
  const syncField = (field: keyof TransactionFormData, value: any) => {
    setValue(field, value);
    setNewTransaction((prev: any) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (data: TransactionFormData) => {
    // Garante que newTransaction tem os dados validados antes de delegar ao handler externo
    setNewTransaction((prev: any) => ({ ...prev, ...data }));
    // Usa setTimeout para aguardar o estado ser atualizado antes do save
    setTimeout(() => handleSaveTransaction(), 0);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setIsTransactionModalOpen(false)}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-0 [&>button]:top-4 [&>button]:right-4">
        <DialogTitle className="sr-only">Novo Lançamento</DialogTitle>
        <DialogDescription className="sr-only">Crie um novo lançamento financeiro.</DialogDescription>
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-slate-800 dark:text-white">Novo Lançamento</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Tipo: Receita / Despesa */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => syncField('type', 'income')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${watchedType === 'income' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500'}`}
            >
              <ArrowUpCircle size={16} /> Receita
            </button>
            <button
              type="button"
              onClick={() => syncField('type', 'expense')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${watchedType === 'expense' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500'}`}
            >
              <ArrowDownCircle size={16} /> Despesa
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Descrição</label>
            <Input
              type="text"
              placeholder={watchedType === 'income' ? 'Ex: Sessão Paciente X' : 'Ex: Aluguel Sala'}
              className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              {...register('description')}
              onChange={(e) => {
                register('description').onChange(e);
                setNewTransaction((prev: any) => ({ ...prev, description: e.target.value }));
              }}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor (R$)</label>
              <Input
                type="number"
                placeholder="0,00"
                className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                {...register('amount', { valueAsNumber: true })}
                onChange={(e) => {
                  register('amount', { valueAsNumber: true }).onChange(e);
                  setNewTransaction((prev: any) => ({ ...prev, amount: e.target.value }));
                }}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Data</label>
              <Input
                type="date"
                className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                {...register('date')}
                onChange={(e) => {
                  register('date').onChange(e);
                  setNewTransaction((prev: any) => ({ ...prev, date: e.target.value }));
                }}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Categoria</label>
            <select
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              {...register('category')}
              onChange={(e) => {
                register('category').onChange(e);
                setNewTransaction((prev: any) => ({ ...prev, category: e.target.value }));
              }}
            >
              {watchedType === 'income' ? (
                <>
                  <option>Sessão TRG</option>
                  <option>Pacote de Sessões</option>
                  <option>Taxa de Cancelamento</option>
                  <option>Outros</option>
                </>
              ) : (
                <>
                  <option>Aluguel / Condomínio</option>
                  <option>Marketing</option>
                  <option>Software / Sistemas</option>
                  <option>Impostos</option>
                  <option>Utilidades</option>
                  <option>Outros</option>
                </>
              )}
            </select>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => syncField('status', 'Pago')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${watchedStatus === 'Pago' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200' : 'bg-transparent border-slate-200 text-slate-400'}`}
              >
                {watchedType === 'income' ? 'Recebido' : 'Pago'}
              </button>
              <button
                type="button"
                onClick={() => syncField('status', 'Pendente')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${watchedStatus === 'Pendente' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200' : 'bg-transparent border-slate-200 text-slate-400'}`}
              >
                Pendente
              </button>
            </div>
            {errors.status && (
              <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-primary-600 hover:bg-primary-700 dark:bg-secondary-600 dark:hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 dark:shadow-secondary-600/30 transition-all active:scale-95 mt-2"
          >
            Salvar Lançamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
