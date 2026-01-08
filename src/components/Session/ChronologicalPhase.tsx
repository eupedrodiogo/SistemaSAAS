
import React, { useState } from 'react';
import { TherapistScript } from './TherapistScript';
import { Save, History, RotateCcw, AlertCircle, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

interface ChronologicalPhaseProps {
    currentSud: number;
    onSetSud: (val: number) => void;
    history: Record<string, number[]>;
    onUpdateHistory: (range: string, newHistory: number[]) => void;
}

const AGE_RANGES = [
    '0-10 anos',
    '11-20 anos',
    '21-30 anos',
    '31-40 anos',
    '41-50 anos',
    '51-60 anos',
    '61+ anos'
];

export const ChronologicalPhase: React.FC<ChronologicalPhaseProps> = ({
    currentSud,
    onSetSud,
    history,
    onUpdateHistory
}) => {
    const [selectedRange, setSelectedRange] = useState<string>(AGE_RANGES[0]);

    const handleRangeChange = (range: string) => {
        if (range === selectedRange) return;
        setSelectedRange(range);
        onSetSud(0); // Reset SUD input for new range
    };

    const handleRegisterSud = () => {
        const currentRangeHistory = history[selectedRange] || [];
        const newHistory = [...currentRangeHistory, currentSud];
        onUpdateHistory(selectedRange, newHistory);

        // Visual feedback would be handled by parent or toast, but we reset if 0? 
        // Typically we keep the slider where it is or reset. 
        // If it's 0, we are done with this reprocessing iteration.
    };

    const currentRangeHistory = history[selectedRange] || [];
    const chartData = currentRangeHistory.map((val, idx) => ({ name: `${idx + 1}`, sud: val }));

    return (
        <div className="space-y-6">
            {/* Header / Range Selector */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
                    <History size={16} /> Faixa Etária em Tratamento
                </h3>
                <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map((range) => (
                        <button
                            key={range}
                            onClick={() => handleRangeChange(range)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                ${selectedRange === range
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }
                            `}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Script & Action */}
            <TherapistScript title={`Script: Fase Cronológica (${selectedRange})`}>
                "Pense na idade de {selectedRange}. O que vem à sua mente? Alguma memória, imagem, som ou sentimento?
                Concentre-se nisso e me diga o nível de desconforto de 0 a 10."
            </TherapistScript>

            {/* Register Button */}
            <div className="flex justify-end items-center gap-4 pt-2">
                {currentRangeHistory.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold">{currentRangeHistory.length}</span> registros
                    </div>
                )}

                <button
                    onClick={handleRegisterSud}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-md
                        ${currentSud === 0
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                        }
                    `}
                >
                    <Save size={18} />
                    {currentSud === 0 ? 'Registrar "Zerado" (0)' : 'Registrar SUD'}
                </button>
            </div>

            {/* Feedback / Instructions */}
            {currentRangeHistory.length > 0 && currentRangeHistory[currentRangeHistory.length - 1] > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                        <strong>SUD ainda não zerou.</strong> <br />
                        Continue o reprocessamento: "Ainda sobra algo? O que vem agora?"
                    </div>
                </div>
            )}

            {currentRangeHistory.length > 0 && currentRangeHistory[currentRangeHistory.length - 1] === 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg flex items-start gap-2">
                    <RotateCcw size={16} className="mt-0.5 shrink-0" />
                    <div>
                        <strong>SUD Zerado!</strong> <br />
                        Pergunte novamente sobre a mesma faixa etária até que não surja mais nada ("Limpeza Final").
                    </div>
                </div>
            )}

            {/* Chart */}
            {currentRangeHistory.length > 0 && (
                <div className="mt-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart2 size={14} /> Progresso do SUD ({selectedRange})
                    </h4>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSud" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sud"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSud)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
