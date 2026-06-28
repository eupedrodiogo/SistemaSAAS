
import React, { useState } from 'react';
import { X, TrendingDown, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddSUDModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (score: number, notes: string) => void;
    loading?: boolean;
}

const AddSUDModal: React.FC<AddSUDModalProps> = ({ isOpen, onClose, onSave, loading = false }) => {
    const [score, setScore] = useState<number>(5);
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(score, notes);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm p-6 bg-white dark:bg-slate-900 border-0 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
                <DialogTitle className="sr-only">Registrar SUD</DialogTitle>
                <DialogDescription className="sr-only">Formulário para registrar nível de desconforto.</DialogDescription>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingDown className="text-indigo-500" size={20} />
                        Registrar SUD
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Score Selector */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nível de Desconforto (0-10)</label>
                            <span className="text-xl font-bold text-indigo-600">{score}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>0 (Sem incômodo)</span>
                            <span>10 (Máximo)</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Observação (Opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm min-h-[80px]"
                            placeholder="Ex: Sentiu alívio após reprocessamento..."
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-base"
                    >
                        {loading ? 'Salvando...' : 'Salvar Registro'}
                        {!loading && <Save size={18} />}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddSUDModal;
