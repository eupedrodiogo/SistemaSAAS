
import React, { useState } from 'react';
import {
    FileText, AlertCircle, Users, Target, PenTool, AlertTriangle, Edit2
} from 'lucide-react';
import { ClientIntakeData } from 'types';

interface SessionNotesProps {
    intakeData: ClientIntakeData | null;
    observation: string;
    onObservationChange: (val: string) => void;
}

export const SessionNotes: React.FC<SessionNotesProps> = ({
    intakeData,
    observation,
    onObservationChange
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {intakeData ? (
                <div className="space-y-4">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Prontuário Inicial</h4>
                                <p className="text-sm text-slate-500">Dados coletados no formulário de agendamento</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* 1. Dados Pessoais & Queixa */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            <AlertCircle size={14} /> Queixa Principal
                                        </h5>
                                        <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-lg">
                                            {intakeData.complaint || "Não informado"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                            <Users size={14} /> Dados Pessoais
                                        </h5>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            <div><span className="text-slate-500 text-xs">Nome:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.nome || '-'}</p></div>
                                            <div><span className="text-slate-500 text-xs">Idade/Nasc:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.dataNascimento || '-'}</p></div>
                                            <div><span className="text-slate-500 text-xs">Estado Civil:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.estadoCivil || '-'}</p></div>
                                            <div><span className="text-slate-500 text-xs">Profissão:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.profissao || '-'}</p></div>
                                            <div><span className="text-slate-500 text-xs">Religião:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.religiao || '-'}</p></div>
                                            <div><span className="text-slate-500 text-xs">Cidade/UF:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.cidade && intakeData.uf ? `${intakeData.cidade}/${intakeData.uf}` : '-'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Tabela de Sentimentos */}
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Intensidade de Sentimentos (0-10)</h5>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { l: 'Raiva', v: intakeData.int_raiva }, { l: 'Medo', v: intakeData.int_medo },
                                                { l: 'Culpa', v: intakeData.int_culpa }, { l: 'Tristeza', v: intakeData.int_tristeza },
                                                { l: 'Ansiedade', v: intakeData.int_ansiedade }, { l: 'Solidão', v: intakeData.int_solidão },
                                                { l: 'Desânimo', v: intakeData.int_desanimo }, { l: 'Angústia', v: intakeData.int_angustia }
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">{item.l}</span>
                                                    <span className={`text-lg font-bold ${item.v === 'Muita' ? 'text-red-500' : item.v === 'Média' ? 'text-amber-500' : 'text-green-500'}`}>{item.v || '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            <Target size={14} /> Saúde e Hábitos
                                        </h5>
                                        <div className="space-y-3 text-sm">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <span className="block text-xs font-bold text-slate-500 mb-1">Medicamentos</span>
                                                <p className="text-slate-700 dark:text-slate-300">{intakeData.medications || "Nenhum"}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-xs font-bold text-slate-500 mb-1">Álcool/Drogas</span>
                                                    <p className="text-slate-700 dark:text-slate-300">{intakeData.alcool || '-'} / {intakeData.drogas || '-'}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-xs font-bold text-slate-500 mb-1">Sono/Stress</span>
                                                    <p className="text-slate-700 dark:text-slate-300">{intakeData.insonia ? `Insônia: ${intakeData.insonia}` : 'Sono Normal'} / Stress: {intakeData.nivelStress || '-'}</p>
                                                </div>
                                            </div>
                                            {intakeData.ideiasSuicidas === 'sim' && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                                                    <AlertTriangle size={16} /> Relatou Ideias Suicidas
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Contexto Familiar e Pessoal */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Users size={16} className="text-primary-500" /> Contexto Familiar e Pessoal</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Relacionamentos</h5>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Parceiro(a):</span> {intakeData.relacaoParceiro || '-'}</p>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Filhos:</span> {intakeData.numeroFilhos || '0'} - {intakeData.relacaoFilhos || '-'}</p>
                                        <p><span className="font-bold text-slate-600 dark:text-slate-400">Divórcio:</span> {intakeData.motivoDivorcio || '-'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Infância e Pais</h5>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Pai:</span> {intakeData.relacaoPai || '-'}</p>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Mãe:</span> {intakeData.relacaoMae || '-'}</p>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Entre Pais:</span> {intakeData.relacaoEntrePais || '-'}</p>
                                        <p><span className="font-bold text-slate-600 dark:text-slate-400">Traumas Infância:</span> {intakeData.magoaInfancia || '-'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Mental e Emocional</h5>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Autoimagem:</span> {intakeData.pensamentosSi || '-'}</p>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Medos:</span> {intakeData.maioresMedosHoje || '-'}</p>
                                        <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Culpa:</span> {intakeData.sentimentoCulpa || '-'}</p>
                                        <p><span className="font-bold text-slate-600 dark:text-slate-400">Raiva/Rancor:</span> {intakeData.raivaRancor || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Outros Detalhes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Visão de Futuro e Mudança</h5>
                                    <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">O que mudaria:</span> {intakeData.mudanca || '-'}</p>
                                    <p><span className="font-bold text-slate-600 dark:text-slate-400">Visão Futuro:</span> {intakeData.visaoFuturo || '-'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Traumas e Fobias</h5>
                                    <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Traumas:</span> {intakeData.traumas || '-'}</p>
                                    <p><span className="font-bold text-slate-600 dark:text-slate-400">Fobias:</span> {intakeData.fobias || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <FileText size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Nenhum formulário recebido</h4>
                    <p className="text-slate-500 max-w-xs mx-auto">O cliente não preencheu o formulário de anamnese durante o agendamento.</p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <PenTool size={16} className="text-primary-500" /> Notas da Sessão
                    </label>
                    <span className="text-xs text-slate-400">Salvo automaticamente</span>
                </div>
                <textarea
                    className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none transition-all font-medium leading-relaxed"
                    placeholder="Registre suas observações clínicas, percepções e pontos importantes desta sessão..."
                    value={observation}
                    onChange={(e) => onObservationChange(e.target.value)}
                />
            </div>
        </div>
    );
};
