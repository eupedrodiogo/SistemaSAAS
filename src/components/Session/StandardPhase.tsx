import React from 'react';
import { TherapistScript } from './TherapistScript';
import { Save, AlertCircle, RotateCcw, BarChart2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StandardPhaseProps {
    currentValue: number;
    onRegister: () => void;
    history: number[];
    type?: 'distress' | 'positive'; // distress (SUD 0-10, 0 is good), positive (0-10, 10 is good)
    scriptTitle?: string;
    scriptContent?: React.ReactNode;
    customScriptContent?: string;
    onUpdateScript?: (text: string) => void;
}

export const StandardPhase: React.FC<StandardPhaseProps> = ({
    currentValue,
    onRegister,
    history,
    type = 'distress',
    scriptTitle = 'Script',
    scriptContent,
    customScriptContent,
    onUpdateScript
}) => {
    const chartData = history.map((val, idx) => ({ name: `${idx + 1}`, value: val }));

    const isFinished = type === 'distress'
        ? (history.length > 0 && history[history.length - 1] === 0)
        : (history.length > 0 && history[history.length - 1] === 10);

    const isDistress = type === 'distress';
    const chartColor = isDistress ? "#6366f1" : "#10b981"; // Indigo vs Emerald

    return (
        <div className="space-y-6">

            {/* Script Section */}
            {(customScriptContent || scriptContent) && (
                <TherapistScript
                    title={scriptTitle}
                    editable={!!onUpdateScript}
                    onEdit={onUpdateScript}
                >
                    {customScriptContent || scriptContent}
                </TherapistScript>
            )}

            {/* Register Button Area */}
            <div className="flex justify-end items-center gap-4 pt-2">
                {history.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold">{history.length}</span> registros
                    </div>
                )}

                <button
                    onClick={onRegister}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-md text-white
                        ${isDistress
                            ? (currentValue === 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700')
                            : (currentValue === 10 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700') // Potentiation logic
                        }
                    `}
                >
                    <Save size={18} />
                    {isDistress
                        ? (currentValue === 0 ? 'Registrar "Zerado" (0)' : 'Registrar SUD')
                        : (currentValue === 10 ? 'Registrar Máximo (10)' : 'Registrar Nível')
                    }
                </button>
            </div>

            {/* Feedback / Instructions */}
            {history.length > 0 && !isFinished && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                        {isDistress ? (
                            <>
                                <strong>SUD ainda não zerou.</strong> <br />
                                Continue o reprocessamento: "Ainda sobra algo? O que vem agora?"
                            </>
                        ) : (
                            <>
                                <strong>Ainda podemos fortalecer.</strong> <br />
                                Continue intensificando a sensação positiva.
                            </>
                        )}
                    </div>
                </div>
            )}

            {isFinished && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg flex items-start gap-2">
                    {isDistress ? <RotateCcw size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                    <div>
                        {isDistress ? (
                            <>
                                <strong>SUD Zerado!</strong> <br />
                                Pergunte novamente ("Limpeza Final") ou avance para a próxima fase.
                            </>
                        ) : (
                            <>
                                <strong>Potencialização Máxima!</strong> <br />
                                O cliente atingiu o nível máximo de fortalecimento.
                            </>
                        )}

                    </div>
                </div>
            )}

            {/* Chart */}
            {history.length > 0 && (
                <div className="mt-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        {isDistress ? <BarChart2 size={14} /> : <TrendingUp size={14} />}
                        {isDistress ? 'Progresso do SUD' : 'Progresso do Fortalecimento'}
                    </h4>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`colorValue-${type}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: chartColor, strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={chartColor}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill={`url(#colorValue-${type})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
