
import React, { useState } from 'react';
import { Brain, Activity, FileText, Save, RotateCcw, AlertCircle, ChevronRight, BookOpen } from 'lucide-react';
import { AgeRangeController } from './AgeRangeController';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface SudGridProps {
    value: number;
    onChange: (v: number) => void;
    isPositiveScale?: boolean;
}

interface CockpitPanelProps {
    mode?: 'dual' | 'single';
    phaseLabel?: string;
    isKeyboardOpen?: boolean;
    
    // Faixa etária (fase cronológica apenas)
    showAgeRanges?: boolean;
    showMentalSud?: boolean;
    showPhysicalSud?: boolean;
    ageRanges?: string[];
    selectedAgeRange?: string;
    onAgeRangeChange?: (range: string) => void;
    selectedCycle?: number;
    onCycleChange?: (cycle: number) => void;

    // Escala Mental/Filme (dual mode)
    mentalSud?: number;
    onMentalSudChange?: (v: number) => void;
    onRegisterMentalSud?: () => void;
    mentalHistory?: number[];

    // Escala Física (dual mode)
    physicalSud?: number;
    onPhysicalSudChange?: (v: number) => void;
    onRegisterPhysicalSud?: () => void;
    physicalHistory?: number[];

    // Escala Única (single mode para outras fases)
    singleSud?: number;
    onSingleSudChange?: (v: number) => void;
    onRegisterSingleSud?: () => void;
    singleHistory?: number[];
    isPositiveScale?: boolean;

    // Notas clínicas
    clinicalNotes: string;
    onClinicalNotesChange: (v: string) => void;
    onSaveClinicalNotes: () => void;

    // Ação: concluir fase
    onAdvancePhase: () => void;
}

// (Scripts removidos a pedido)

// ─── Sub: Grid de botões SUD (0-10) compactos ────────────────────────────────

const SUD_COLORS: Record<number, { active: string; idle: string }> = {
    0:  { active: 'bg-emerald-500 text-white ring-emerald-400/40',  idle: 'hover:bg-emerald-900/30 hover:text-emerald-300' },
    1:  { active: 'bg-emerald-400 text-white ring-emerald-400/40',  idle: 'hover:bg-emerald-900/20 hover:text-emerald-400' },
    2:  { active: 'bg-teal-400 text-white ring-teal-400/40',         idle: 'hover:bg-teal-900/20 hover:text-teal-400' },
    3:  { active: 'bg-cyan-500 text-white ring-cyan-400/40',         idle: 'hover:bg-cyan-900/20 hover:text-cyan-400' },
    4:  { active: 'bg-sky-500 text-white ring-sky-400/40',           idle: 'hover:bg-sky-900/20 hover:text-sky-400' },
    5:  { active: 'bg-yellow-400 text-slate-900 ring-yellow-400/40', idle: 'hover:bg-yellow-900/20 hover:text-yellow-400' },
    6:  { active: 'bg-amber-400 text-slate-900 ring-amber-400/40',   idle: 'hover:bg-amber-900/20 hover:text-amber-400' },
    7:  { active: 'bg-orange-500 text-white ring-orange-400/40',     idle: 'hover:bg-orange-900/20 hover:text-orange-400' },
    8:  { active: 'bg-red-500 text-white ring-red-400/40',           idle: 'hover:bg-red-900/20 hover:text-red-400' },
    9:  { active: 'bg-rose-600 text-white ring-rose-400/40',         idle: 'hover:bg-rose-900/20 hover:text-rose-400' },
    10: { active: 'bg-red-700 text-white ring-red-600/40',           idle: 'hover:bg-red-900/30 hover:text-red-400' },
};

const SudGrid: React.FC<SudGridProps> = ({ value, onChange, isPositiveScale }) => {
    return (
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-1">
            {Array.from({ length: 11 }, (_, i) => {
                const isActive = value === i;
                const colorIndex = isPositiveScale ? 10 - i : i;
                const colors = SUD_COLORS[colorIndex];
                return (
                    <button
                        key={i}
                        onClick={() => onChange(i)}
                        aria-label={`SUD ${i}`}
                        aria-pressed={isActive}
                        className={`
                            relative flex items-center justify-center
                            h-9 rounded-lg text-xs font-bold
                            transition-all duration-150 select-none
                            border
                            ${isActive
                                ? `${colors.active} ring-2 scale-110 shadow-lg border-transparent`
                                : `bg-slate-800 text-slate-400 border-slate-700 ${colors.idle}`
                            }
                        `}
                    >
                        {i}
                        {isActive && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// ─── Sub: Badge de histórico e feedback ──────────────────────────────────────

const SudFeedback: React.FC<{ history: number[], isPositiveScale?: boolean }> = ({ history, isPositiveScale }) => {
    if (history.length === 0) return null;
    const last = history[history.length - 1];
    const isGoalReached = isPositiveScale ? last === 10 : last === 0;

    return (
        <div className={`
            flex items-start gap-2 p-2.5 rounded-lg text-xs font-medium
            ${isGoalReached
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                : 'bg-amber-900/20 text-amber-400 border border-amber-800/40'
            }
        `}>
            {isGoalReached
                ? <RotateCcw size={13} className="shrink-0 mt-0.5" />
                : <AlertCircle size={13} className="shrink-0 mt-0.5" />
            }
            <span>
                {isGoalReached
                    ? <><strong>{isPositiveScale ? 'Força Máxima (10)!' : 'Zerado!'}</strong> Confirme e avance.</>
                    : <><strong>Nível = {last}.</strong> Continue o {isPositiveScale ? 'fortalecimento' : 'reprocessamento'}.</>
                }
                {' '}
                <span className="opacity-60">({history.length} reg.)</span>
            </span>
        </div>
    );
};

// ─── Sub: Header de seção ────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex items-center gap-2 mb-2.5">
        <span className="text-indigo-400 shrink-0">{icon}</span>
        <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</h3>
    </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

export const CockpitPanel: React.FC<CockpitPanelProps> = ({
    mode = 'dual',
    phaseLabel = 'Fase Cronológica',
    isKeyboardOpen = false,
    showAgeRanges = true,
    showMentalSud = true,
    showPhysicalSud = true,
    ageRanges = [],
    selectedAgeRange = '',
    onAgeRangeChange,
    selectedCycle,
    onCycleChange,
    mentalSud = 0,
    onMentalSudChange,
    onRegisterMentalSud,
    mentalHistory = [],
    physicalSud = 0,
    onPhysicalSudChange,
    onRegisterPhysicalSud,
    physicalHistory = [],
    singleSud = 0,
    onSingleSudChange,
    onRegisterSingleSud,
    singleHistory = [],
    isPositiveScale = false,
    clinicalNotes,
    onClinicalNotesChange,
    onSaveClinicalNotes,
    onAdvancePhase,
}) => {
    // (Aviso: script do terapeuta foi removido do painel)
    return (
        /*
         * Coluna direita: altura total e scroll no Desktop (lg).
         * No mobile se ajusta ao conteúdo, deixando a página inteira rolar.
         */
        <aside className="
            flex flex-col gap-0
            lg:h-full w-full lg:w-80 xl:w-96 shrink-0
            bg-slate-900 border border-slate-700/60
            rounded-2xl overflow-hidden shadow-xl
        ">
            {/* ── Header da sidebar ──────────────────────────────────────── */}
            <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 shrink-0">
                <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
                    Painel de Controle
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{phaseLabel}</p>
            </div>

            {/* ── Área com scroll (Apenas no Desktop) ───────────────────── */}
            <div className="flex-1 flex flex-col lg:overflow-y-auto custom-scrollbar px-3 py-3 space-y-4">

                {/* MODO DUAL: Cronológico */}
                {mode === 'dual' && (
                    <>
                        {/* ── A) Controlador de Faixa Etária ─────────────────────── */}
                        <div className="flex flex-col gap-2">
                            {showAgeRanges && (
                                <div>
                                    <SectionHeader icon={<RotateCcw size={13} />} label="Faixa Etária" />
                                    <div className="rounded-xl overflow-hidden border border-slate-700/60">
                                        {onAgeRangeChange && (
                                            <AgeRangeController
                                                ranges={ageRanges}
                                                selectedRange={selectedAgeRange}
                                                onRangeChange={onAgeRangeChange}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* ── B) Seletor de Ciclos ─────────────────────── */}
                            <div className="flex items-center justify-between bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 shadow-inner">
                                <button 
                                    onClick={() => onCycleChange?.(Math.max(1, (selectedCycle || 1) - 1))}
                                    disabled={(selectedCycle || 1) <= 1}
                                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                                    title="Ciclo Anterior"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <span className="text-xs font-bold text-slate-300">Ciclo {selectedCycle || 1}</span>
                                <button 
                                    onClick={() => onCycleChange?.((selectedCycle || 1) + 1)}
                                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                                    title="Próximo Ciclo"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── C) Escala Mental / Filme ────────────────────────────── */}
                        {showMentalSud && (
                            <div className="space-y-2.5">
                                <SectionHeader icon={<Brain size={13} />} label="Desconforto Emocional / Filme" />

                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-500">Valor selecionado:</span>
                                    <span className={`
                                        text-lg font-extrabold tabular-nums leading-none
                                        ${isPositiveScale 
                                            ? (mentalSud >= 8 ? 'text-emerald-400' : mentalSud >= 5 ? 'text-amber-400' : 'text-slate-400')
                                            : (mentalSud <= 3 ? 'text-emerald-400' : mentalSud <= 6 ? 'text-amber-400' : 'text-rose-400')}
                                    `}>
                                        {mentalSud}<span className="text-xs font-normal text-slate-500">/10</span>
                                    </span>
                                </div>

                                {onMentalSudChange && <SudGrid value={mentalSud} onChange={onMentalSudChange} isPositiveScale={isPositiveScale} />}

                                <SudFeedback history={mentalHistory} isPositiveScale={isPositiveScale} />

                                {onRegisterMentalSud && (
                                    <button
                                        onClick={onRegisterMentalSud}
                                        className={`
                                            w-full flex items-center justify-center gap-2
                                            py-2.5 rounded-xl text-xs font-bold
                                            transition-all duration-150 active:scale-[0.97] shadow-md
                                            ${isPositiveScale
                                                ? (mentalSud === 10 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40')
                                                : (mentalSud === 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40')
                                            }
                                        `}
                                    >
                                        <Save size={13} />
                                        {isPositiveScale 
                                            ? (mentalSud === 10 ? 'Registrar Máximo (10)' : `Registrar Nota Emocional (${mentalSud})`)
                                            : (mentalSud === 0 ? 'Registrar "Zerado" (0)' : `Registrar Nota Emocional (${mentalSud})`)
                                        }
                                    </button>
                                )}
                            </div>
                        )}

                        {showPhysicalSud && (
                            <>
                                {/* Divisor */}
                                <div className="h-px bg-slate-700/50 my-1" />

                                {/* ── D) Escala Física ─────────────────────────────────────── */}
                                <div className="space-y-2.5">
                                    <SectionHeader icon={<Activity size={13} />} label="Desconforto Físico" />

                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-500">Valor selecionado:</span>
                                        <span className={`
                                            text-lg font-extrabold tabular-nums leading-none
                                            ${isPositiveScale 
                                                ? (physicalSud >= 8 ? 'text-emerald-400' : physicalSud >= 5 ? 'text-amber-400' : 'text-slate-400')
                                                : (physicalSud <= 3 ? 'text-emerald-400' : physicalSud <= 6 ? 'text-amber-400' : 'text-rose-400')}
                                        `}>
                                            {physicalSud}<span className="text-xs font-normal text-slate-500">/10</span>
                                        </span>
                                    </div>

                                    {onPhysicalSudChange && <SudGrid value={physicalSud} onChange={onPhysicalSudChange} isPositiveScale={isPositiveScale} />}

                                    <SudFeedback history={physicalHistory} isPositiveScale={isPositiveScale} />

                                    {onRegisterPhysicalSud && (
                                        <button
                                            onClick={onRegisterPhysicalSud}
                                            className={`
                                                w-full flex items-center justify-center gap-2
                                                py-2.5 rounded-xl text-xs font-bold
                                                transition-all duration-150 active:scale-[0.97] shadow-md
                                                ${isPositiveScale
                                                    ? (physicalSud === 10 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40')
                                                    : (physicalSud === 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40')
                                                }
                                            `}
                                        >
                                            <Save size={13} />
                                            {isPositiveScale 
                                                ? (physicalSud === 10 ? 'Registrar Máximo (10)' : `Registrar Nota Física (${physicalSud})`)
                                                : (physicalSud === 0 ? 'Registrar "Zerado" (0)' : `Registrar Nota Física (${physicalSud})`)
                                            }
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* MODO SINGLE: Outras fases */}
                {mode === 'single' && (
                    <div className="space-y-2.5">
                        <SectionHeader icon={<Activity size={13} />} label={isPositiveScale ? "Nível de Fortalecimento" : "Escala de Intensidade do Desconforto"} />

                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">Valor selecionado:</span>
                            <span className={`
                                text-lg font-extrabold tabular-nums leading-none
                                ${isPositiveScale
                                    ? (singleSud >= 8 ? 'text-emerald-400' : singleSud >= 5 ? 'text-amber-400' : 'text-slate-400')
                                    : (singleSud <= 3 ? 'text-emerald-400' : singleSud <= 6 ? 'text-amber-400' : 'text-rose-400')}
                            `}>
                                {singleSud}<span className="text-xs font-normal text-slate-500">/10</span>
                            </span>
                        </div>

                        {onSingleSudChange && <SudGrid value={singleSud} onChange={onSingleSudChange} isPositiveScale={isPositiveScale} />}

                        <SudFeedback history={singleHistory} isPositiveScale={isPositiveScale} />

                        {onRegisterSingleSud && (
                            <button
                                onClick={onRegisterSingleSud}
                                className={`
                                    w-full flex items-center justify-center gap-2
                                    py-2.5 rounded-xl text-xs font-bold
                                    transition-all duration-150 active:scale-[0.97] shadow-md
                                    ${isPositiveScale
                                        ? (singleSud === 10 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40')
                                        : (singleSud === 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40')
                                    }
                                `}
                            >
                                <Save size={13} />
                                {isPositiveScale
                                    ? (singleSud === 10 ? 'Registrar Máximo (10)' : `Registrar Nível (${singleSud})`)
                                    : (singleSud === 0 ? 'Registrar "Zerado" (0)' : `Registrar Nível (${singleSud})`)
                                }
                            </button>
                        )}
                    </div>
                )}

                {/* Divisor */}
                <div className="h-px bg-slate-700/50" />

                {/* ── E) Anotações ─────────────────────────────────── */}
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between">
                        <SectionHeader icon={<FileText size={13} />} label={`Anotações (Ciclo ${selectedCycle || 1})`} />
                    </div>
                    <textarea
                        id="clinical-notes-textarea"
                        value={clinicalNotes}
                        onChange={(e) => onClinicalNotesChange(e.target.value)}
                        onBlur={onSaveClinicalNotes}
                        onFocus={() => {
                            setTimeout(() => {
                                document.getElementById('clinical-notes-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        }}
                        placeholder="Observações, reações, insights do cliente..."
                        className="
                            flex-1 w-full min-h-[120px] bg-slate-800 border border-slate-700 rounded-xl
                            px-3 py-2.5 text-xs text-slate-300
                            placeholder:text-slate-600
                            resize-none
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent
                            transition-all leading-relaxed
                            custom-scrollbar
                        "
                    />
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => (selectedCycle || 1) > 1 && onCycleChange?.((selectedCycle || 1) - 1)}
                            disabled={(selectedCycle || 1) <= 1}
                            className={`flex-1 max-w-[80px] sm:max-w-[100px] font-bold py-2.5 px-3 rounded-lg text-xs transition-colors shadow-sm ${
                                (selectedCycle || 1) <= 1 
                                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700' 
                                : 'bg-sky-500 hover:bg-sky-400 text-white'
                            }`}
                        >
                            Voltar
                        </button>
                        <button
                            onClick={() => onCycleChange?.((selectedCycle || 1) + 1)}
                            className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 px-3 rounded-lg text-xs text-center transition-colors shadow-sm"
                        >
                            avançar para o próximo ciclo
                        </button>
                    </div>
                </div>

                {/* Espaço extra no fundo para conforto de scroll, e grande espaçamento no mobile se teclado ativo */}
                <div className={`shrink-0 transition-all duration-300 ${isKeyboardOpen ? 'h-[60vh] lg:h-2' : 'h-2'}`} />
            </div>
        </aside>
    );
};
