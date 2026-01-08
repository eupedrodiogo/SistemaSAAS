import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Loader2, Users, Brain, FileText, AlertTriangle, Clock, Shield } from 'lucide-react';

interface ResponseData {
    id: string;
    created_at: string;
    video_platform: string[];
    record_method: string[];
    pain_point: string[];
    ai_interest: string;
    digital_notebook_interest: string;
    contact: string;
    suggestions: string;
    time_spent_weekly?: string;
    security_concern?: string;
    tech_level?: string;
}

export default function ValidatorDashboard() {
    const [data, setData] = useState<ResponseData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('validation_responses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setData(data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;

    // Process Data helpers
    const processArrayField = (field: keyof ResponseData) => {
        const counts: Record<string, number> = {};
        data.forEach(item => {
            const values = item[field] as string[];
            if (Array.isArray(values)) {
                values.forEach(v => {
                    counts[v] = (counts[v] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const processField = (field: keyof ResponseData) => {
        const counts: Record<string, number> = {};
        data.forEach(item => {
            const v = item[field] as string;
            if (v) counts[v] = (counts[v] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const painPoints = processArrayField('pain_point');
    const timeSpent = processField('time_spent_weekly');
    const usersWithSecurityConcern = data.filter(d => d.security_concern && !d.security_concern.toLowerCase().includes('seguro')).length;

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analytics de Validação</h1>
                    <p className="text-slate-400">Insights em tempo real da pesquisa de mercado.</p>
                </div>
                <div className="text-right">
                    <div className="text-slate-500 text-xs uppercase tracking-widest font-bold">Total Respostas</div>
                    <div className="text-4xl font-bold text-white">{data.length}</div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Users size={18} /> Leads
                    </div>
                    <div className="text-3xl font-bold text-white">{data.length}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-2 text-emerald-400">
                        <Brain size={18} /> Adesão à IA
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {data.length ? Math.round((data.filter(i => i.ai_interest?.includes('Sim')).length / data.length) * 100) : 0}%
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-2 text-red-400">
                        <Clock size={18} /> Sofrem com Tempo
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {data.length ? Math.round((data.filter(i => i.time_spent_weekly?.includes('Mais') || i.time_spent_weekly?.includes('3 a 5')).length / data.length) * 100) : 0}%
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-2 text-amber-400">
                        <Shield size={18} /> Inseguros (Dados)
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {data.length ? Math.round((usersWithSecurityConcern / data.length) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Pain Points (Takes up 2 columns) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Ranking de Dores (O que mais incomoda?)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={painPoints} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" hide />
                                <YAxis dataKey="name" type="category" width={180} stroke="#cbd5e1" fontSize={12} tick={{ fill: '#cbd5e1' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                    cursor={{ fill: '#1e293b' }}
                                />
                                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Time Spent (Pie) */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Tempo Gasto Semanalmente</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={timeSpent}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        return `${(percent * 100).toFixed(0)}%`;
                                    }}
                                >
                                    {timeSpent.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Leads Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                    <h3 className="text-lg font-semibold text-white">Últimos Respondentes</h3>
                    <button className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">Exportar CSV</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Contato</th>
                                <th className="p-4">Tempo Gasto</th>
                                <th className="p-4">Segurança</th>
                                <th className="p-4">Maior Dor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 text-slate-500">{new Date(row.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">{row.contact}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${row.time_spent_weekly?.includes('Mais') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-slate-700'}`}>
                                            {row.time_spent_weekly || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {row.security_concern && row.security_concern.includes('receio') ? (
                                            <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={12} /> Com receio</span>
                                        ) : <span className="text-slate-600">Ok</span>}
                                    </td>
                                    <td className="p-4 max-w-[200px] truncate" title={row.pain_point?.join(', ')}>{row.pain_point?.[0]}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-600 italic">
                                        Nenhuma resposta coletada ainda. Compartilhe o link!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
