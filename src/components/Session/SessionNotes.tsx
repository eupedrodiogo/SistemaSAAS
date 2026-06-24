import React, { useState } from 'react';
import {
    FileText, Users, Target, PenTool, Activity,
    Brain, HeartPulse, Sparkles, Quote, MessageSquare
} from 'lucide-react';
import { ClientIntakeData } from 'types';

interface SessionNotesProps {
    intakeData: ClientIntakeData | null;
    observation: string;
    onObservationChange: (val: string) => void;
}

export const SessionNotes: React.FC<SessionNotesProps> = ({ intakeData, observation, onObservationChange }) => {

    // Helper to clean up "Queixa Principal" (removes "Queixa:" prefix and legacy formatting)
    const getCleanComplaint = (text?: string) => {
        if (!text) return "Não informada.";
        // Legacy format might be "Queixa: ... | Histórico: ..."
        let clean = text;
        // Remove common prefixes case-insensitive
        clean = clean.replace(/^(Queixa Principal|Queixa|Motivo):/i, '').trim();
        return clean || "Não informada.";
    };

    /**
     * Renders a list of items with their intensity levels using premium badges.
     */
    const renderLevelItems = (items?: { name: string; level: number }[], emptyText = "Nenhum relatado") => {
        if (!items || items.length === 0) return <p className="text-slate-400 dark:text-slate-500 italic text-sm">{emptyText}</p>;

        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item, idx) => {
                    let levelColorClass = '';
                    let levelLabel = '';

                    if (item.level <= 3) {
                        levelColorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
                        levelLabel = 'Leve';
                    } else if (item.level <= 6) {
                        levelColorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
                        levelLabel = 'Moderado';
                    } else {
                        levelColorClass = 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
                        levelLabel = 'Intenso';
                    }

                    return (
                        <div key={idx}
                            className="group flex items-center pl-3 pr-1 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">
                                {item.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-transparent ${levelColorClass}`} title={`${levelLabel} (Nível ${item.level})`}>
                                {item.level}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDetailedSection = (title: string, icon: React.ReactNode, data: { label: string, value?: string }[]) => {
        const validData = data.filter(d => d.value && d.value.trim() !== '' && d.value.trim() !== '-');
        if (validData.length === 0) return null;
        
        return (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {icon} {title}
                </h3>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-sm">
                    {validData.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
                            <span className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in pb-20">
            {/* Header / Context */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                            <FileText size={20} />
                        </span>
                        Revisão da Anamnese
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-11">
                        Resumo clínico e queixas iniciais do paciente
                    </p>
                </div>
            </div>

            {/* 1. Complaint Highlight */}
            <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-lg"></div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 pl-6 rounded-r-lg border-y border-r border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Quote size={14} className="fill-current opacity-50" />
                        Queixa Principal
                    </h3>
                    <p className="text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        "{getCleanComplaint(intakeData?.complaint || intakeData?.history)}"
                    </p>
                </div>
            </div>

            {/* 2. Structured Clinical Scan (Grid Layout) */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={14} />
                    Mapeamento Clínico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Mental / Emotional */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                            <Brain size={18} />
                            <h4 className="font-bold text-sm">Transtornos & Mental</h4>
                        </div>
                        <div className="min-h-[100px]">
                            {renderLevelItems(intakeData?.transtornos, "Nenhum transtorno reportado.")}
                        </div>
                    </div>

                    {/* Column 2: Physical / Somatic */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 text-rose-600 dark:text-rose-400">
                            <HeartPulse size={18} />
                            <h4 className="font-bold text-sm">Sintomas Físicos</h4>
                        </div>
                        <div className="min-h-[100px]">
                            {renderLevelItems(intakeData?.doresFisicas, "Nenhuma queixa física.")}
                        </div>
                    </div>

                    {/* Column 3: Future / Anxiety */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                            <Sparkles size={18} />
                            <h4 className="font-bold text-sm">Questões de Futuro</h4>
                        </div>
                        <div className="min-h-[100px]">
                            {renderLevelItems(intakeData?.temasFuturo, "Nenhum medo futuro listado.")}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Users size={16} /> Contexto Pessoal
                    </h3>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-sm">
                        <div className="grid grid-cols-[130px_1fr] gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Nome:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{intakeData?.nome || intakeData?.name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr] gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Data Nasc.:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{intakeData?.dataNascimento || '-'}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr] gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Celular:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{intakeData?.celular || intakeData?.phone || '-'}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr] gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Profissão:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{intakeData?.profissao || '-'}</span>
                        </div>
                    </div>
                </div>

                {intakeData?.visaoFuturo && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Target size={16} /> Objetivos & Visão
                        </h3>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-sm h-full">
                            <div className="mb-3">
                                <span className="block text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Visão de Futuro</span>
                                <p className="text-slate-800 dark:text-slate-200 leading-relaxed italic">
                                    "{intakeData.visaoFuturo}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FULL ANAMNESIS FIELDS */}
            {renderDetailedSection("Saúde e Hábitos", <HeartPulse size={16} />, [
                { label: "Nível de Estresse", value: intakeData?.nivelStress },
                { label: "Dores de Cabeça Constantes", value: intakeData?.doresCabeca },
                { label: "Insônia", value: intakeData?.insonia },
                { label: "Medicações em Uso", value: intakeData?.medications },
                { label: "Ideações Suicidas", value: intakeData?.ideiasSuicidas },
                { label: "Uso de Álcool", value: intakeData?.alcool },
                { label: "Uso de Drogas", value: intakeData?.drogas },
                { label: "Fobias", value: intakeData?.fobias },
                { label: "Traumas Relatados", value: intakeData?.traumas },
                { label: "Aspectos de Sexualidade", value: intakeData?.sexualidade },
            ])}

            {renderDetailedSection("Vida Pessoal e Dinâmica Familiar", <Users size={16} />, [
                { label: "Estado Civil", value: intakeData?.estadoCivil },
                { label: "Motivo de Divórcio (se houver)", value: intakeData?.motivoDivorcio },
                { label: "Número de Filhos", value: intakeData?.numeroFilhos },
                { label: "Relação com os Filhos", value: intakeData?.relacaoFilhos },
                { label: "Relação com Parceiro(a)", value: intakeData?.relacaoParceiro },
                { label: "Sentimento sobre a Casa onde mora", value: intakeData?.sentimentoCasa },
                { label: "Sentimento sobre o Ambiente de Trabalho", value: intakeData?.sentimentoTrabalho },
                { label: "Sentimento de Pertencimento Familiar", value: intakeData?.pertenceFamilia },
                { label: "Sentimento de Pertencimento Social", value: intakeData?.pertenceSocial },
                { label: "Maiores Frustrações", value: intakeData?.frustracoes },
            ])}

            {renderDetailedSection("Histórico da Infância", <Brain size={16} />, [
                { label: "Por quem foi criado(a)", value: intakeData?.criadoPais },
                { label: "Como era a relação com o Pai", value: intakeData?.relacaoPai },
                { label: "Como era a relação com a Mãe", value: intakeData?.relacaoMae },
                { label: "Pais eram agressivos?", value: intakeData?.paisAgressivos },
                { label: "Havia alcoolismo em casa?", value: intakeData?.paisAlcool },
                { label: "Como os pais se tratavam", value: intakeData?.relacaoEntrePais },
                { label: "Crença sobre relacionamentos", value: intakeData?.crencaRelacionamento },
                { label: "Maior mágoa da infância", value: intakeData?.magoaInfancia },
                { label: "Maior medo na infância", value: intakeData?.medoInfancia },
            ])}

            {renderDetailedSection("Mapeamento Emocional Profundo", <Activity size={16} />, [
                { label: "Pensamentos sobre si mesmo", value: intakeData?.pensamentosSi },
                { label: "Pensamentos sobre o próprio corpo", value: intakeData?.pensamentosCorpo },
                { label: "Pensamentos sobre sua competência", value: intakeData?.pensamentosCompetencia },
                { label: "O que seria felicidade para você", value: intakeData?.felicidade },
                { label: "O que acha mais difícil mudar hoje", value: intakeData?.mudanca },
                { label: "Maiores Medos Hoje", value: intakeData?.maioresMedosHoje },
                { label: "Qual papel costuma assumir na vida", value: intakeData?.papelVida },
                { label: "Mais dominante ou submisso?", value: intakeData?.dominanteSubmisso },
                { label: "Situações de Raiva e Rancor", value: intakeData?.raivaRancor },
                { label: "Situações de Culpa", value: intakeData?.sentimentoCulpa },
            ])}
            
            {/* Tabela de Sentimentos Intensidade */}
            {(() => {
                const sentimentos = [
                    { label: "Raiva", value: intakeData?.int_raiva },
                    { label: "Medo", value: intakeData?.int_medo },
                    { label: "Culpa", value: intakeData?.int_culpa },
                    { label: "Tristeza", value: intakeData?.int_tristeza },
                    { label: "Ansiedade", value: intakeData?.int_ansiedade },
                    { label: "Solidão", value: intakeData?.int_solidão },
                    { label: "Desânimo", value: intakeData?.int_desanimo },
                    { label: "Angústia", value: intakeData?.int_angustia },
                ].filter(s => s.value && s.value.trim() !== '');
                
                if (sentimentos.length === 0) return null;

                return (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <MessageSquare size={16} /> Intensidade de Sentimentos (0 a 10)
                        </h3>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {sentimentos.map((s, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium mb-1">{s.label}</span>
                                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* 4. Therapist Observations (Input) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <PenTool size={16} /> Observações Iniciais do Terapeuta
                </h3>
                <textarea
                    value={observation}
                    onChange={(e) => onObservationChange(e.target.value)}
                    className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
                    placeholder="Registre aqui suas impressões iniciais para a sessão..."
                />
            </div>
        </div>
    );
};

