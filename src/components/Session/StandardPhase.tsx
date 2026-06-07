import React from 'react';
import { TherapistScript } from './TherapistScript';
import { Save, AlertCircle, RotateCcw, BarChart2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StandardPhaseProps {
    mentalHistory?: number[];
    physicalHistory?: number[];
    type?: 'distress' | 'positive'; 
}

export const StandardPhase: React.FC<StandardPhaseProps> = ({
    mentalHistory = [],
    physicalHistory = [],
    type = 'distress',
}) => {
    const maxLen = Math.max(mentalHistory.length, physicalHistory.length);
    const chartData = Array.from({ length: maxLen }).map((_, idx) => ({
        name: `${idx + 1}`,
        Emocional: mentalHistory[idx] ?? null,
        Físico: physicalHistory[idx] ?? null,
    }));

    const isFinished = type === 'distress'
        ? ((mentalHistory.length > 0 && mentalHistory[mentalHistory.length - 1] === 0) && (physicalHistory.length > 0 && physicalHistory[physicalHistory.length - 1] === 0))
        : ((mentalHistory.length > 0 && mentalHistory[mentalHistory.length - 1] === 10) && (physicalHistory.length > 0 && physicalHistory[physicalHistory.length - 1] === 10));

    const isDistress = type === 'distress';
    const hasData = maxLen > 0;

    return (
        <div className="h-full flex flex-col gap-2 p-3">

            {hasData && !isFinished && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg flex items-start gap-2 shrink-0">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                        {isDistress
                            ? <><strong>Intensidade ainda não zerou.</strong> <br />
                                Continue o reprocessamento: "Ainda sobra algo? O que vem agora?"</>
                            : <><strong>Ainda podemos fortalecer.</strong> <br />
                                Continue intensificando a sensação positiva.</>
                        }
                    </div>
                </div>
            )}

            {isFinished && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg flex items-start gap-2 shrink-0">
                    {isDistress ? <RotateCcw size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                    <div>
                        {isDistress ? (
                            <>
                                <strong>Desconforto Zerado!</strong> <br />
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

            {/* Chart Area */}
            <div className="shrink-0 h-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm px-4 pt-3 pb-2 flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
                    {isDistress ? <BarChart2 size={13} /> : <TrendingUp size={13} />}
                    {isDistress ? 'Escala de Intensidade do Desconforto' : 'Progresso do Fortalecimento'}
                </h4>

                {!hasData ? (
                    <div className="flex-1 flex items-center justify-center text-slate-600 text-xs font-medium">
                        Nenhum dado registrado para esta fase ainda.
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradMental" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradPhysical" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 10]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} ticks={[0, 3, 5, 7, 10]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Emocional"
                                    stroke="#818cf8"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#gradMental)"
                                    dot={{ r: 4, fill: "#818cf8", strokeWidth: 0 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Físico"
                                    stroke="#34d399"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#gradPhysical)"
                                    dot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};
