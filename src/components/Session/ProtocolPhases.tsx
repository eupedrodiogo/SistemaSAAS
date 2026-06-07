
import React from 'react';
import {
    Settings, ArrowUp, ArrowDown, Trash2, Wind, Sparkles, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';

export interface ProtocolPhase {
    id: string;
    label: string;
    isSystem?: boolean;
    customScript?: string;
}

interface ProtocolPhasesProps {
    phases: ProtocolPhase[];
    currentPhase: string;
    isEditing: boolean;
    isSafetyOpen: boolean;
    aiSuggestions: string[];
    sentiment: 'neutral' | 'stress' | 'calm';

    setPhase: (id: string) => void;
    toggleEditing: () => void;
    toggleSafety: () => void;

    // Edit Actions
    onMovePhase: (index: number, dir: 'up' | 'down') => void;
    onRenamePhase: (index: number, val: string) => void;
    onDeletePhase: (index: number) => void;
    onAddCustomPhase: () => void;

    hasPhaseData: (phaseId: string) => boolean;
}

export const ProtocolPhases: React.FC<ProtocolPhasesProps> = ({
    phases,
    currentPhase,
    isEditing,
    isSafetyOpen,
    aiSuggestions,
    sentiment,
    setPhase,
    toggleEditing,
    toggleSafety,
    onMovePhase,
    onRenamePhase,
    onDeletePhase,
    onAddCustomPhase,
    hasPhaseData
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex flex-col gap-4 shrink-0 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div 
                    className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer select-none group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fases</span>
                        <span className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-wider">
                            {isCollapsed ? '(expandir fases)' : '(ocultar fases)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-300 transition-colors">
                        <button onClick={(e) => { e.stopPropagation(); toggleEditing(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Settings size={14} /></button>
                    </div>
                </div>

                {!isCollapsed && (
                    <>

                {isEditing && (
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1 mb-2">
                            {phases.map((p, idx) => (
                                <div key={p.id} className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => onMovePhase(idx, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowUp size={12} /></button>
                                        <button onClick={() => onMovePhase(idx, 'down')} disabled={idx === phases.length - 1} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowDown size={12} /></button>
                                    </div>
                                    <input value={p.label} onChange={(e) => onRenamePhase(idx, e.target.value)} className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded px-2 py-1" />
                                    {!p.isSystem && <button onClick={() => onDeletePhase(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                                </div>
                            ))}
                        </div>
                        <button onClick={onAddCustomPhase} className="w-full py-1.5 text-xs font-bold text-primary-600 border border-primary-100 border-dashed rounded">+ Fase</button>
                    </div>
                )}

                <div className="p-2 space-y-1">
                    {phases.map((p, idx) => {
                        const isActive = currentPhase === p.id;
                        return (
                            <button key={p.id} onClick={() => setPhase(p.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${isActive ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-white font-bold border border-primary-100 dark:border-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${isActive ? 'bg-primary-600 dark:bg-secondary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{idx + 1}</div>
                                    <span>{p.label}</span>
                                </div>
                                {hasPhaseData(p.id) && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            </button>
                        );
                    })}
                </div>
                    </>
                )}
            </div>

            {!isCollapsed && (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <button onClick={toggleSafety} className="w-full p-4 flex items-center justify-between bg-red-50 dark:bg-red-900/10 hover:bg-red-100 transition-colors">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider"><Wind size={16} /> Mecanismo de Segurança</div>
                            {isSafetyOpen ? <ArrowUp size={16} className="text-red-400" /> : <ArrowDown size={16} className="text-red-400" />}
                        </button>
                        {isSafetyOpen && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/5 animate-slide-up">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic mb-2">"Feche os olhos, repouse suas mãos ao lado do corpo..."</p>
                                <p className="mt-3 text-xs font-bold text-slate-500 uppercase text-center border-t border-red-200 pt-2">"Cheira a florzinha e sopra a velinha"</p>
                            </div>
                        )}
                    </div>

                </>
            )}
        </div>
    );
};
