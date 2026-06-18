import React, { useState, useEffect } from 'react';
import {
   FiFileText, FiDownload, FiShare2, FiClock, FiCheckCircle,
   FiAlertCircle, FiRefreshCw, FiBook, FiList, FiTrash2, FiUser, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
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

interface Report {
   id: string;
   title: string;
   type: string;
   content: string;
   created_at: string;
   status: string;
}

interface Patient {
   id: string;
   name: string;
   email?: string;
   phone?: string;
   status?: string;
   nextSession?: string;
   avatar?: string;
}

interface SessionRecord {
   id: string;
   sessionNumber: number;
   date: string;
   durationSeconds: number;
   patientName: string;
   observation: string;
   transcript: string;
   sudLevels: Record<string, number>;
   ageRange?: string;
   mentalHistory?: Record<string, number[]>;
   physicalHistory?: Record<string, number[]>;
   cycleNotes?: Record<string, Record<string, string>>;
   phaseNotes?: Record<string, Record<string, string>>;
   somaticHistory?: number[];
   thematicHistory?: number[];
   futureHistory?: number[];
   potentializationHistory?: number[];
}

// Helper to avoid timezone shifts when parsing YYYY-MM-DD strings
const parseSafeDate = (dateStr: string | undefined | Date) => {
   if (!dateStr) return new Date();
   if (dateStr instanceof Date) return dateStr;
   if (dateStr.length === 10) return new Date(`${dateStr}T12:00:00`);
   return new Date(dateStr);
};

function SessionExpandedDetails({ record }: { record: SessionRecord }) {
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

   const availablePhases = [];
   if (hasAnamnese) availablePhases.push('Anamnese');
   if (hasCronologica) availablePhases.push('Cronológica');
   if (hasSomatica) availablePhases.push('Somática');
   if (hasTematica) availablePhases.push('Temática');
   if (hasFuturo) availablePhases.push('Futuro');
   if (hasPotencializacao) availablePhases.push('Potencialização');

   const [selectedPhase, setSelectedPhase] = useState(availablePhases.length > 0 ? availablePhases[0] : null);
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
                              )})}
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
      const pKey = phaseKeyMap[selectedPhase] || '';
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
                     )})}
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

interface ReportsViewProps {
   initialPatientId?: string;
   onParamsConsumed?: () => void;
}

export function ReportsView({ initialPatientId, onParamsConsumed }: ReportsViewProps) {
   const { user } = useAuth();
   const { isDarkMode } = useTheme();

   const [patients, setPatients] = useState<Patient[]>([]);
   const [selectedPatient, setSelectedPatient] = useState('');
   const [reportType, setReportType] = useState('evolution');
   const [clinicalNotes, setClinicalNotes] = useState('');
   const [loading, setLoading] = useState(false);
   const [generating, setGenerating] = useState(false);
   const [currentReport, setCurrentReport] = useState('');
   const [savedReports, setSavedReports] = useState<Report[]>([]);
   const [loadingHistory, setLoadingHistory] = useState(false);
   const [sudData, setSudData] = useState<number[]>([]);
   const [sudLabels, setSudLabels] = useState<string[]>([]);
   const [patientMetadata, setPatientMetadata] = useState({ phase: 'N/A', symptoms: 'N/A' });
   const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
   const [expandedSession, setExpandedSession] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<'sessions' | 'ai' | 'all'>('sessions');

   useEffect(() => {
      loadPatients();
   }, []);

   useEffect(() => {
      if (selectedPatient) {
         loadPatientData(selectedPatient);
         loadReports(selectedPatient);
         
         // Carrega histórico de sessões via API (Agendamentos)
         api.appointments.list().then(apps => {
            const patientApps = apps.filter(a => a.patientId === selectedPatient && (a.status === 'Concluído' || a.status === 'completed'));
            // Ordena mais recente primeiro
            patientApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const records: SessionRecord[] = patientApps.map(a => {
               const clinical = a.sessionData?.clinicalRecord || {};
               return {
                  id: a.id || `session-${Date.now()}`,
                  sessionNumber: a.sessionData?.sessionNumber || clinical.sessionNumber || 1,
                  date: a.date || clinical.date || new Date().toISOString(),
                  durationSeconds: clinical.durationSeconds || 0,
                  patientName: a.patientName || clinical.patientName,
                  observation: clinical.observation || a.sessionData?.notes || '',
                  transcript: clinical.transcript || '',
                  sudLevels: clinical.sudLevels || {},
                  ageRange: clinical.ageRange || a.sessionData?.selectedAgeRange,
                  mentalHistory: a.sessionData?.mentalHistory || {},
                  physicalHistory: a.sessionData?.physicalHistory || {},
                  cycleNotes: a.sessionData?.cycleNotes || {},
                  phaseNotes: a.sessionData?.phaseNotes || {},
                  somaticHistory: a.sessionData?.somaticHistory || [],
                  thematicHistory: a.sessionData?.thematicHistory || [],
                  futureHistory: a.sessionData?.futureHistory || [],
                  potentializationHistory: a.sessionData?.potentializationHistory || []
               };
            });
            setSessionHistory(records);
            
            // Monta os dados do gráfico a partir das sessões reais salvas
            if (records.length > 0) {
               const labels = records.map(r => `S${r.sessionNumber} - ${parseSafeDate(r.date).toLocaleDateString()}`);
               const avgSud = records.map(r => {
                  const vals = Object.values(r.sudLevels || {}).filter((v: any) => typeof v === 'number' && v > 0) as number[];
                  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
               });
               setSudLabels(labels.reverse());
               setSudData(avgSud.reverse());
            }
         }).catch(err => {
            console.error("Erro ao buscar histórico de sessões", err);
            setSessionHistory([]);
         });
      } else {
         setSavedReports([]);
         setCurrentReport('');
         setSessionHistory([]);
      }
   }, [selectedPatient]);

   // Auto-seleciona paciente quando chega via prop (ex: botão na Sala de Espera)
   useEffect(() => {
      if (initialPatientId) {
         setSelectedPatient(initialPatientId);
         onParamsConsumed?.();
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [initialPatientId]);

   const loadPatients = async () => {
      try {
         setLoading(true);
         const data = await api.patients.list();
         setPatients(data);
      } catch (error) {
         console.error('Failed to load patients', error);
      } finally {
         setLoading(false);
      }
   };

   const loadReports = async (patientId: string) => {
      try {
         setLoadingHistory(true);
         const therapistId = user?.id || 'demo-therapist';
         const res = await fetch(`/api/reports?therapistId=${therapistId}&patientId=${patientId}`);
         if (res.ok) {
            const data = await res.json();
            setSavedReports(data);
         }
      } catch (err) {
         console.error('Error loading reports:', err);
      } finally {
         setLoadingHistory(false);
      }
   }

   const loadPatientData = async (patientId: string) => {
      try {
         // Fetch SUD Data
         const sudRes = await fetch(`/api/sud?patientId=${patientId}`);
         if (sudRes.ok) {
            const sudRecords = await sudRes.json();
            // Format for Chart
            const labels = sudRecords.map((r: any) => parseSafeDate(r.date || r.created_at).toLocaleDateString());
            const data = sudRecords.map((r: any) => r.score);
            setSudLabels(labels);
            setSudData(data);
         }

         // Fetch Patient Details for Metadata (Phase)
         const detailsRes = await fetch(`/api/patient-details?patientId=${patientId}`);
         if (detailsRes.ok) {
            // We can store this if we want to display more info, but for now we just want it for AI context
            // For simplicity, we might just fetch it dynamically in handleGenerate or store strict needed info
            // But to follow React patterns, let's store the phase
            const details = await detailsRes.json();
            if (details.timeline && details.timeline.length > 0) {
               const lastSession = details.timeline[0]; // Assuming sorted DESC
               // Parse phase from title "Sessão - X" or just use title
               setPatientMetadata(prev => ({ ...prev, phase: lastSession.title.split(' - ')[1] || 'Em Andamento' }));
            }
         }
      } catch (error) {
         console.error('Error loading patient data', error);
      }
   };

   const handleGenerate = async () => {
      if (!selectedPatient) return;

      setGenerating(true);
      try {
         const patient = patients.find(p => p.id === selectedPatient);

         // Use metadata from state (fetched from last session) or fallback
         const metadata = {
            symptoms: patientMetadata.symptoms !== 'N/A' ? patientMetadata.symptoms : (clinicalNotes.toLowerCase().includes('ansiedade') ? 'Ansiedade' : 'Não especificado'),
            phase: patientMetadata.phase
         };

         const response = await fetch('/api/ai/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               patientId: selectedPatient,
               patientName: patient?.name || 'Paciente',
               reportType,
               clinicalNotes, // Passing notes
               therapistId: user?.id || 'demo-therapist',
               metadata
            })
         });

         if (response.ok) {
            const data = await response.json();
            setCurrentReport(data.report);
            await saveReport(data.report, patient?.name);
         } else {
            alert('Erro ao gerar relatório. Tente novamente.');
         }
      } catch (error) {
         console.error('AI generation error:', error);
         alert('Erro de conexão com a IA.');
      } finally {
         setGenerating(false);
      }
   };

   const saveReport = async (content: string, patientName?: string) => {
      try {
         const typeLabels: Record<string, string> = {
            'evolution': 'Evolução',
            'laudo': 'Laudo',
            'atestado': 'Atestado',
            'encaminhamento': 'Encaminhamento'
         };

         const typeLabel = typeLabels[reportType] || 'Relatório';

         const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               therapistId: user?.id || 'demo-therapist',
               patientId: selectedPatient,
               title: `${typeLabel} - ${new Date().toLocaleDateString()}`,
               type: reportType,
               content: content,
               metadata: { generated_by_ai: true }
            })
         });

         if (res.ok) {
            loadReports(selectedPatient);
         }
      } catch (err) {
         console.error('Error saving report:', err);
      }
   };

   const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('Tem certeza que deseja excluir este relatório?')) return;

      try {
         const res = await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
         if (res.ok) {
            setSavedReports(prev => prev.filter(r => r.id !== id));
            if (currentReport && savedReports.find(r => r.id === id)?.content === currentReport) {
               setCurrentReport('');
            }
         }
      } catch (err) {
         console.error('Error deleting report:', err);
      }
   };

   const handleDownload = () => {
      if (!currentReport) return;

      import('jspdf').then(({ jsPDF }) => {
         const doc = new jsPDF();

         // Header
         doc.setFontSize(20);
         doc.setTextColor(40, 40, 40);
         doc.text("Relatório Clínico - TeraNexus", 20, 20);

         // Metadata
         doc.setFontSize(10);
         doc.setTextColor(100, 100, 100);
         const reportTitle = savedReports.find(r => r.content === currentReport)?.title || 'Relatório Gerado';
         doc.text(`Título: ${reportTitle}`, 20, 30);
         doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 35);
         if (selectedPatient) {
            const pName = patients.find(p => p.id === selectedPatient)?.name;
            doc.text(`Paciente: ${pName || 'N/A'}`, 20, 40);
         }

         // Content
         doc.setFontSize(12);
         doc.setTextColor(0, 0, 0);

         const splitText = doc.splitTextToSize(currentReport, 170);
         doc.text(splitText, 20, 50);

         // Footer
         const pageHeight = doc.internal.pageSize.height;
         doc.setFontSize(8);
         doc.setTextColor(150, 150, 150);
         doc.text("Gerado automaticamente por TeraNexus com Inteligência Artificial.", 20, pageHeight - 10);

         doc.save(`${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      });
   };

   const chartData = {
      labels: sudLabels,
      datasets: [
         {
            label: 'Nível de Desconforto (SUD)',
            data: sudData,
            borderColor: '#6366f1', // Indigo 500
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
         }
      ]
   };

   const chartOptions = {
      responsive: true,
      plugins: {
         legend: { display: false },
         tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: false,
            cornerRadius: 8,
         }
      },
      scales: {
         y: {
            min: 0,
            max: 10,
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
            border: { display: false }
         },
         x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } },
            border: { display: false }
         }
      },
      maintainAspectRatio: false,
   };

   return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen text-slate-800 dark:text-slate-100">
         {/* Header Section */}
         <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 animate-fade-in-up">
            <div className="flex-1"></div>

             {/* Patient Select Global */}
             <div className="w-full xl:w-80 shrink-0">
                 <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <select
                       value={selectedPatient}
                       onChange={(e) => setSelectedPatient(e.target.value)}
                       className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm"
                    >
                       <option value="">Selecione um paciente...</option>
                       {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                       <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                 </div>
             </div>

             {/* Tabs de Visualização */}
             <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1 shrink-0 overflow-x-auto w-full xl:w-auto">
                {[
                   { key: 'sessions', label: 'Dados da Sessão', icon: <FiList className="w-4 h-4" /> },
                   { key: 'ai',       label: 'Relatório IA',    icon: <FiActivity className="w-4 h-4" /> },
                   { key: 'all',      label: 'Visão Completa',  icon: <FiBook className="w-4 h-4" /> },
                ].map(tab => (
                   <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                         activeTab === tab.key
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                   >
                      {tab.icon}
                      <span>{tab.label}</span>
                   </button>
                ))}
             </div>
          </header>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Left Controls Column (4/12) - Hidden on 'sessions' tab */}
            {(activeTab === 'ai' || activeTab === 'all') && (
            <div className="lg:col-span-4 space-y-6">
               {/* Type Selection Card */}
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 backdrop-blur-xl transition-all hover:shadow-md">
                  <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                     <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                     Configuração
                  </h2>

                  <div className="space-y-5">
                     {/* Type Select */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1">Tipo de Documento</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['evolution', 'laudo', 'atestado', 'encaminhamento'].map(type => (
                              <button
                                 key={type}
                                 onClick={() => setReportType(type)}
                                 className={`py-3 px-2 text-sm font-semibold rounded-xl border-2 transition-all duration-200 ${reportType === type
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400'
                                    }`}
                              >
                                 {type === 'evolution' ? 'Evolução' : type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Clinical Notes Input */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1">
                           Observações / Contexto (IA)
                        </label>
                        <textarea
                           value={clinicalNotes}
                           onChange={(e) => setClinicalNotes(e.target.value)}
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm min-h-[100px] resize-none"
                           placeholder="Descreva brevemente o progresso, sintomas ou motivo documento para orientar a IA..."
                        />
                     </div>

                     <button
                        onClick={handleGenerate}
                        disabled={!selectedPatient || generating}
                        className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-white transition-all transform active:scale-95 shadow-lg shadow-indigo-500/25 ${!selectedPatient
                           ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                           : generating
                              ? 'bg-indigo-400 cursor-wait'
                              : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40'
                           }`}
                     >
                        {generating ? (
                           <><FiRefreshCw className="animate-spin w-5 h-5" /> Gerando Documento...</>
                        ) : (
                           <><FiActivity className="w-5 h-5" /> Gerar com Nexus IA</>
                        )}
                     </button>
                  </div>
               </div>

               {/* Session History Card Removido (Duplicado) */}
            </div>
            )}

            {/* Right Content Column (Expand to full width on sessions tab) */}
            <div className={`${activeTab === 'sessions' ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6 transition-all duration-300`}>

               {/* ── ABA: DADOS DA SESSÃO ─────────────────────────── */}
               {(activeTab === 'sessions' || activeTab === 'all') && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                     <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                        <FiList className="text-indigo-500" />
                        <h2 className="font-bold text-slate-700 dark:text-white">Dados das Sessões Registradas</h2>
                     </div>
                     <div className="p-4 space-y-3 max-h-[800px] overflow-y-auto custom-scrollbar">
                        {selectedPatient && sessionHistory.length > 0 && (
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                 <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Total de Sessões</p>
                                 <p className="text-3xl font-black text-slate-700 dark:text-slate-200">{sessionHistory.length}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                 <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Última Sessão</p>
                                 <p className="text-xl font-black text-slate-700 dark:text-slate-200 mt-1">
                                    {parseSafeDate(sessionHistory[0]?.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
                                 </p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                 <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Média de Desconforto (Geral)</p>
                                 <p className="text-3xl font-black text-indigo-500">
                                    {(() => {
                                       const allSuds = sessionHistory.flatMap(s => Object.values(s.sudLevels).filter((v:any) => typeof v === 'number' && v > 0) as number[]);
                                       return allSuds.length ? Math.round(allSuds.reduce((a,b)=>a+b,0)/allSuds.length) : 0;
                                    })()}
                                 </p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                 <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Pico de Desconforto</p>
                                 <p className="text-3xl font-black text-rose-500">
                                    {(() => {
                                       const allSuds = sessionHistory.flatMap(s => Object.values(s.sudLevels).filter((v:any) => typeof v === 'number' && v > 0) as number[]);
                                       return allSuds.length ? Math.max(...allSuds) : 0;
                                    })()}
                                 </p>
                              </div>
                           </div>
                        )}
                        {!selectedPatient ? (
                           <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                              <FiUser className="w-10 h-10 mb-2 opacity-30" />
                              <span className="text-sm">Selecione um paciente para ver os dados</span>
                           </div>
                        ) : sessionHistory.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                              <FiList className="w-10 h-10 mb-2 opacity-30" />
                              <span className="text-sm font-medium">Nenhuma sessão registrada ainda</span>
                              <span className="text-xs mt-1 opacity-70">Finalize uma sessão para os dados aparecerem aqui</span>
                           </div>
                        ) : (
                           sessionHistory.map(record => {
                              const isExpanded = expandedSession === record.id;
                              const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
                              const sudEntries = Object.entries(record.sudLevels).filter(([,v]) => v > 0);
                              return (
                                 <div key={record.id} className="rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                                    <button
                                       onClick={() => setExpandedSession(isExpanded ? null : record.id)}
                                       className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                                    >
                                       <div>
                                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Sessão #{record.sessionNumber}</p>
                                          <div className="flex items-center gap-3 mt-1">
                                             <span className="text-xs text-slate-400">
                                                {parseSafeDate(record.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
                                             </span>
                                             <span className="text-xs text-slate-400">⏱ {fmt(record.durationSeconds)}</span>
                                              {(() => {
                                                 const ageKeys = Object.keys(record.mentalHistory || {});
                                                 let displayRange = record.ageRange;
                                                 if (ageKeys.length > 1) {
                                                     const ranges = ageKeys.map(k => {
                                                         const match = k.match(/(\d+)-(\d+)/);
                                                         return match ? [parseInt(match[1]), parseInt(match[2])] : null;
                                                     }).filter(Boolean) as [number, number][];
                                                     if (ranges.length > 0) {
                                                         const min = Math.min(...ranges.map(r => r[0]));
                                                         const max = Math.max(...ranges.map(r => r[1]));
                                                         displayRange = `${min}-${max} anos`;
                                                     }
                                                 }
                                                 return displayRange ? <span className="text-xs text-indigo-500 font-medium">{displayRange}</span> : null;
                                              })()}
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          {sudEntries.length > 0 && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold">{sudEntries.length} SUD</span>}
                                          <FiCheckCircle className={`w-4 h-4 ${sudEntries.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                                       </div>
                                    </button>
                                    {isExpanded && (
                                       <SessionExpandedDetails record={record} />
                                    )}
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </div>
               )}

               {/* ── ABA: RELATÓRIO IA ─────────────────────────────── */}
               {(activeTab === 'ai' || activeTab === 'all') && (
                  <div className="flex flex-col gap-6">
                     {/* Editor/Preview Card */}
                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex flex-col flex-1 min-h-[500px] overflow-hidden">
                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                           <h2 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${currentReport ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                 {currentReport ? <FiCheckCircle /> : <FiAlertCircle />}
                              </span>
                              Relatório Gerado por IA
                              {generating && <span className="text-xs font-normal text-indigo-500 animate-pulse ml-2">• Escrevendo...</span>}
                           </h2>
                           <div className="flex gap-3">
                              <button onClick={handleDownload} disabled={!currentReport} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50">
                                 <FiDownload className="w-4 h-4" /> PDF
                              </button>
                              <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 shadow-md transition-all flex items-center gap-2">
                                 <FiShare2 className="w-4 h-4" /> Compartilhar
                              </button>
                           </div>
                        </div>
                        {/* Editor Area */}
                        <div className="flex-1 relative bg-slate-50/30 dark:bg-slate-950/30 min-h-[400px]">
                           {currentReport ? (
                              <textarea value={currentReport} onChange={(e) => setCurrentReport(e.target.value)} className="w-full h-full p-8 resize-none font-serif text-lg leading-loose text-slate-800 dark:text-slate-200 outline-none bg-transparent min-h-[400px]" placeholder="Comece a escrever..." />
                           ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                 <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                    <FiFileText className="w-8 h-8 opacity-40" />
                                 </div>
                                 <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Nenhum documento selecionado</h3>
                                 <p className="max-w-md text-slate-400 text-sm leading-relaxed">
                                    Selecione um paciente e clique em <strong className="text-indigo-500">Gerar com Nexus IA</strong> para criar um relatório clínico automaticamente.
                                 </p>
                              </div>
                           )}
                        </div>
                        {currentReport && (
                           <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                              <span>{currentReport.length} caracteres</span>
                              <button onClick={() => saveReport(currentReport)} className="text-indigo-500 font-bold hover:underline">Salvar Alterações</button>
                           </div>
                        )}
                     </div>

                     {/* Chart Section */}
                     <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                              <FiActivity className="text-indigo-500" /> Evolução Clínica (SUD)
                           </h3>
                        </div>
                        <div className="h-64 w-full">
                           <Line data={chartData} options={chartOptions} />
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default ReportsView;