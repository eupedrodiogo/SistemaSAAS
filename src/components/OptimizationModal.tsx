import React from 'react';
import { X, Sparkles, ArrowRight, TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Suggestion {
    originalAppointmentId: string;
    patientName: string;
    currentDate: string;
    currentTime: string;
    suggestedDate: string;
    suggestedTime: string;
    reason: string;
}

interface OptimizationData {
    analysis: string;
    suggestions: Suggestion[];
    savings: string;
}

interface OptimizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: OptimizationData | null;
    onApply: () => void;
}

const formatDateShort = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m} ${timeStr}`;
};

const OptimizationModal: React.FC<OptimizationModalProps> = ({ isOpen, onClose, data, onApply }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-scale-up overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Otimização Inteligente</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Sugestões da IA para sua agenda</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Analysis Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                            <AlertCircle size={16} /> Análise Inicial
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {data.analysis}
                        </div>
                    </div>

                    {/* Savings Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                            <TrendingUp size={16} /> Impacto Estimado
                        </h3>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800 dark:text-green-300">Tempo Recuperado</h4>
                                <p className="text-green-700 dark:text-green-400">{data.savings}</p>
                            </div>
                        </div>
                    </div>

                    {/* Suggestions List */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                            <Calendar size={16} /> Sugestões de Reagendamento ({data.suggestions.length})
                        </h3>

                        {data.suggestions.length > 0 ? (
                            <div className="space-y-3">
                                {data.suggestions.map((suggestion, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all group">

                                        {/* Patient Info */}
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                {suggestion.patientName}
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">Paciente</span>
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-1">{suggestion.reason}</p>
                                        </div>

                                        {/* Time Change */}
                                        <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                                            <div className="text-center px-2">
                                                <span className="block text-xs text-slate-400 uppercase">De</span>
                                                <span className="font-mono font-bold text-slate-600 dark:text-slate-400 strike-through decoration-red-500 line-through">
                                                    {formatDateShort(suggestion.currentDate, suggestion.currentTime)}
                                                </span>
                                            </div>
                                            <ArrowRight size={16} className="text-violet-500" />
                                            <div className="text-center px-2">
                                                <span className="block text-xs text-slate-400 uppercase">Para</span>
                                                <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                                    {formatDateShort(suggestion.suggestedDate, suggestion.suggestedTime)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                                Nenhuma sugestão de mudança necessária. Sua agenda já está otimizada!
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 font-medium transition-all"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={onApply}
                        className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        Aplicar Sugestões
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OptimizationModal;
