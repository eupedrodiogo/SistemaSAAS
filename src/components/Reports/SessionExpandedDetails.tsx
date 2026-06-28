import React, { useState } from 'react';
import { FiBook, FiFileText, FiActivity } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { SessionRecord } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SessionExpandedDetailsProps {
  record: SessionRecord;
}

export function SessionExpandedDetails({ record }: SessionExpandedDetailsProps) {
  // 1. Identificar quais Fases têm dados
  const hasAnamnese = !!record.observation;
  const availableAgeRanges = Array.from(new Set([
    ...Object.keys(record.mentalHistory || {}),
    ...Object.keys(record.physicalHistory || {})
  ]));
  const hasCronologica = availableAgeRanges.length > 0 || (record.cycleNotes && Object.keys(record.cycleNotes).length > 0);
  const hasSomatica = (record.somaticHistory || []).length > 0;
  const hasTematica = (record.thematicHistory || []).length > 0;
  const hasFuturo = (record.futureHistory || []).length > 0;
  const hasPotencializacao = (record.potentializationHistory || []).length > 0;

  const availablePhases: string[] = [];
  if (hasAnamnese) availablePhases.push('Anamnese');
  if (hasCronologica) availablePhases.push('Cronológica');
  if (hasSomatica) availablePhases.push('Somática');
  if (hasTematica) availablePhases.push('Temática');
  if (hasFuturo) availablePhases.push('Futuro');
  if (hasPotencializacao) availablePhases.push('Potencialização');

  const [selectedPhase, setSelectedPhase] = useState<string | null>(availablePhases.length > 0 ? availablePhases[0] : null);
  const [selectedAge, setSelectedAge] = useState(availableAgeRanges.length > 0 ? availableAgeRanges[0] : (record.ageRange || '0-10 anos'));

  if (availablePhases.length === 0) {
    return (
      <div className="px-5 pb-5 pt-5 bg-slate-50/50 dark:bg-slate-800/20 text-center">
        <p className="text-sm text-slate-400 italic">Nenhum dado clínico detalhado registrado nesta sessão.</p>
      </div>
    );
  }

  // Lógica de Renderização do Gráfico e Listas
  const renderChartAndList = (datasets: any[], labels: string[], maxLen: number, listData: {label: string, data: number[], color: string, textColor: string}[]) => {
    const chartData = {
      labels,
      datasets
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' as const, labels: { color: '#94a3b8', font: { size: 11 } } },
        tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { size: 12 }, bodyFont: { size: 12 }, cornerRadius: 8 }
      },
      scales: {
        y: { min: 0, max: 10, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
      }
    };

    const isPositiveScale = selectedPhase === 'Potencialização';

    return (
      <div className="space-y-6">
        {maxLen > 0 ? (
          <>
            <div className="h-64 w-full relative bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listData.map((list, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${list.textColor}`}>{list.label} (Histórico)</p>
                  <div className="flex flex-wrap gap-2">
                    {list.data.map((val, i) => {
                      const isHigh = isPositiveScale ? val < 4 : val >= 7;
                      const isMedium = isPositiveScale ? (val >= 4 && val <= 6) : (val >= 4 && val < 7);
                      return (
                        <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shadow-sm ${isHigh ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' : isMedium ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                          {val}
                        </span>
                      );
                    })}
                    {list.data.length === 0 && <span className="text-xs text-slate-400 mt-1">Sem registros</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 italic">Nenhum ponto SUD registrado.</p>
          </div>
        )}
      </div>
    );
  };

  const renderPhaseContent = () => {
    if (selectedPhase === 'Anamnese') {
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FiBook /> Anotações Gerais / Anamnese</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{record.observation}</p>
          </div>
        </div>
      );
    }

    if (selectedPhase === 'Cronológica') {
      const mentalPoints = (record.mentalHistory || {})[selectedAge] || [];
      const physicalPoints = (record.physicalHistory || {})[selectedAge] || [];
      const maxLen = Math.max(mentalPoints.length, physicalPoints.length);
      const labels = Array.from({length: maxLen}, (_, i) => `${i+1}`);
      
      const datasets = [
        { label: 'Emocional', data: mentalPoints, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2 },
        { label: 'Físico', data: physicalPoints, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2 }
      ];

      const listData = [
        { label: 'Emocional', data: mentalPoints, color: 'indigo', textColor: 'text-indigo-500' },
        { label: 'Físico', data: physicalPoints, color: 'emerald', textColor: 'text-emerald-500' }
      ];

      const ageNotes = (record.cycleNotes || {})[selectedAge] || {};

      return (
        <div className="space-y-6">
          {/* Seletor de Faixa Etária (Exclusivo da Cronológica) */}
          {availableAgeRanges.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {availableAgeRanges.map(age => (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${selectedAge === age ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {age}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Coluna Central: Gráfico e Lista (Ocupa 2/3) */}
            <div className="xl:col-span-2">
              {renderChartAndList(datasets, labels, maxLen, listData)}
            </div>
            
            {/* Coluna Lateral: Anotações da Fase (Ocupa 1/3) */}
            <div className="xl:col-span-1 space-y-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FiFileText /> Notas do Terapeuta</h4>
                {Object.keys(ageNotes).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(ageNotes).map(([ciclo, nota]) => (
                      <div key={ciclo} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-extrabold text-indigo-400 uppercase mb-2">Ciclo {ciclo}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{nota}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Nenhuma anotação registrada nesta faixa etária.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Renderização genérica para Somática, Temática, Futuro, Potencialização com gráfico DUAL
    let mentalData: number[] = [];
    let physicalData: number[] = [];

    const r = record as any;
    if (selectedPhase === 'Somática') { 
      mentalData = r.somaticMentalHistory || r.somaticHistory || [];
      physicalData = r.somaticPhysicalHistory || [];
    }
    if (selectedPhase === 'Temática') { 
      mentalData = r.thematicMentalHistory || r.thematicHistory || [];
      physicalData = r.thematicPhysicalHistory || [];
    }
    if (selectedPhase === 'Futuro') { 
      mentalData = r.futureMentalHistory || r.futureHistory || [];
      physicalData = r.futurePhysicalHistory || [];
    }
    if (selectedPhase === 'Potencialização') { 
      mentalData = r.potentializationMentalHistory || r.potentializationHistory || [];
      physicalData = r.potentializationPhysicalHistory || [];
    }

    const maxLen = Math.max(mentalData.length, physicalData.length);
    const labels = Array.from({length: maxLen}, (_, i) => `${i+1}`);
    const datasets = [
      { label: 'Emocional', data: mentalData, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2 },
      { label: 'Físico', data: physicalData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2 }
    ];
    const listData = [
      { label: 'Emocional', data: mentalData, color: 'indigo', textColor: 'text-indigo-500' },
      { label: 'Físico', data: physicalData, color: 'emerald', textColor: 'text-emerald-500' }
    ];

    // O bloco de anotações (Notas Clínicas) precisa aparecer em todas as fases, conforme solicitado
    const allNotes: { ciclo: string; nota: string }[] = [];
    const phaseKeyMap: Record<string, string> = {
      'Somática': 'somatico',
      'Temática': 'tematico',
      'Futuro': 'futuro',
      'Potencialização': 'potencializacao'
    };
    const pKey = phaseKeyMap[selectedPhase || ''] || '';
    if (pKey && record.phaseNotes && record.phaseNotes[pKey]) {
      Object.entries(record.phaseNotes[pKey]).forEach(([ciclo, nota]) => {
        allNotes.push({ ciclo, nota: nota as string });
      });
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {renderChartAndList(datasets, labels, maxLen, listData)}
        </div>
        
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm h-full max-h-[600px] overflow-y-auto custom-scrollbar">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2"><FiFileText /> Notas do Terapeuta</h4>
            {allNotes.length > 0 ? (
              <div className="space-y-4">
                {allNotes.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-extrabold text-indigo-400 uppercase mb-2">Ciclo {item.ciclo}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.nota}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhuma anotação registrada nesta sessão.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 pb-6 pt-5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
      {/* Abas de Fase */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200 dark:border-slate-700/50">
        {availablePhases.map(phase => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-4 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${selectedPhase === phase ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            {phase}
          </button>
        ))}
      </div>

      {/* Conteúdo Dinâmico da Fase */}
      {renderPhaseContent()}
      
      {/* Footer: SUD Final e Transcrição */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(record.sudLevels).length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><FiActivity /> SUD Final por Fase</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(record.sudLevels).filter(([,v]) => v > 0).map(([fase, val]) => {
                const isPos = fase.toLowerCase().includes('potencializacao');
                const isHigh = isPos ? val < 4 : val >= 7;
                const isMed = isPos ? (val >= 4 && val <= 6) : (val >= 4 && val < 7);
                return (
                  <div key={fase} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs text-slate-500 font-bold uppercase">{fase.replace('Cronologico',' Cronológico').replace('fisico','Físico').replace('mental','Emocional')}</span>
                    <span className={`font-black text-lg ${isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-emerald-500'}`}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {record.transcript && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><FiFileText /> Transcrição de Voz</p>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-4 hover:line-clamp-none transition-all duration-300">"{record.transcript}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
