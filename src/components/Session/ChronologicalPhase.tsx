
import React from 'react';
import { BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TherapistScript } from './TherapistScript';
import { AgeRangeController } from './AgeRangeController';

interface ChronologicalPhaseProps {
    /** Faixa etária controlada externamente (pelo CockpitPanel via SessionView) */
    selectedRange: string;
    onRangeChange: (range: string) => void;
    ranges: string[];
    /** Histórico de notas mentais por faixa etária */
    mentalHistory: Record<string, number[]>;
}

export const ChronologicalPhase: React.FC<ChronologicalPhaseProps> = ({
    selectedRange,
    onRangeChange,
    ranges,
    mentalHistory,
}) => {
    const currentHistory = mentalHistory[selectedRange] || [];
    const chartData = currentHistory.map((val, idx) => ({ name: `${idx + 1}`, sud: val }));

    return (
        <div className="h-full flex flex-col gap-4 p-4">

            {/* ── Script do Terapeuta — funde controlador + instrução ── */}
            <TherapistScript
                headerSlot={
                    <AgeRangeController
                        ranges={ranges}
                        selectedRange={selectedRange}
                        onRangeChange={onRangeChange}
                    />
                }
            >
                {`Pense na idade de ${selectedRange}. O que vem à sua mente? Alguma memória, imagem, som ou sentimento?\nConcentre-se nisso e me diga o nível de desconforto de 0 a 10.`}
            </TherapistScript>

            {/* ── Gráfico de Progresso — ocupa o espaço restante ── */}
            <div className="flex-1 min-h-0 bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4 flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
                    <BarChart2 size={13} />
                    Progresso do SUD ({selectedRange})
                </h4>

                {currentHistory.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-600 text-xs font-medium">
                        Nenhum dado registrado para esta faixa ainda.
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSudChrono" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={[0, 10]}
                                    stroke="#475569"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    ticks={[0, 3, 5, 7, 10]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '10px',
                                        border: '1px solid #334155',
                                        background: '#0f172a',
                                        color: '#e2e8f0',
                                        fontSize: '12px',
                                    }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
                                    formatter={(v: number) => [`SUD: ${v}`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sud"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorSudChrono)"
                                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};
