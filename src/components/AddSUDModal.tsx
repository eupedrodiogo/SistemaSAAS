
import React, { useState } from 'react';
import { X, TrendingDown, Save } from 'lucide-react';

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 animate-scale-up">

                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingDown className="text-indigo-500" size={20} />
                        Registrar SUD
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Salvar Registro'}
                        {!loading && <Save size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddSUDModal;
