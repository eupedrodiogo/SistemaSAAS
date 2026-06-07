
import React from 'react';
import { BarChart2 } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
} from 'recharts';

interface ChronologicalPhaseProps {
    selectedRange: string;
    onRangeChange: (range: string) => void;
    ranges: string[];
    /** Histórico de notas mentais por faixa etária */
    mentalHistory: Record<string, number[]>;
    /** Histórico de notas físicas por faixa etária */
    physicalHistory: Record<string, number[]>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl text-xs">
            <p className="text-slate-400 mb-1">Registro #{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ color: entry.color }} className="font-bold">
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
};

const CustomLegend = ({ payload }: any) => (
    <div className="flex items-center gap-4 justify-center mb-1">
        {payload?.map((entry: any) => (
            <div key={entry.value} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] font-semibold text-slate-400">{entry.value}</span>
            </div>
        ))}
    </div>
);

export const ChronologicalPhase: React.FC<ChronologicalPhaseProps> = ({
    selectedRange,
    mentalHistory,
    physicalHistory,
}) => {
    const mental = mentalHistory[selectedRange] || [];
    const physical = physicalHistory[selectedRange] || [];

    const maxLen = Math.max(mental.length, physical.length);
    const chartData = Array.from({ length: maxLen }, (_, idx) => ({
        name: `${idx + 1}`,
        Emocional: mental[idx] ?? null,
        Físico: physical[idx] ?? null,
    }));

    const hasData = maxLen > 0;

    return (
        <div className="h-full flex flex-col gap-2 p-3">
            {/* ── Gráfico de Progresso — rodapé compacto */}
            <div className="shrink-0 h-44 bg-slate-900 rounded-xl border border-slate-800 shadow-sm px-4 pt-3 pb-2 flex flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
                    <BarChart2 size={13} />
                    Escala de Intensidade do Desconforto ({selectedRange})
                </h4>

                {!hasData ? (
                    <div className="flex-1 flex items-center justify-center text-slate-600 text-xs font-medium">
                        Nenhum dado registrado para esta faixa ainda.
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradMental" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradFisico" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#34d399" stopOpacity={0.30} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
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
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }} />
                                <Legend content={<CustomLegend />} verticalAlign="top" />
                                <Area
                                    type="monotone"
                                    dataKey="Emocional"
                                    stroke="#818cf8"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#gradMental)"
                                    dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#a5b4fc', strokeWidth: 0 }}
                                    connectNulls
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Físico"
                                    stroke="#34d399"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#gradFisico)"
                                    dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#6ee7b7', strokeWidth: 0 }}
                                    connectNulls
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};
