import React, { useState, useEffect } from 'react';
import {
   FiFileText, FiDownload, FiShare2, FiClock, FiCheckCircle,
   FiAlertCircle, FiRefreshCw, FiBook, FiList, FiTrash2, FiUser, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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

export function ReportsView() {
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

   useEffect(() => {
      loadPatients();
   }, []);

   useEffect(() => {
      if (selectedPatient) {
         loadPatientData(selectedPatient);
         loadReports(selectedPatient);
      } else {
         setSavedReports([]);
         setCurrentReport('');
      }
   }, [selectedPatient]);

   const loadPatients = async () => {
      try {
         setLoading(true);
         const response = await fetch(`/api/patients?therapistId=${user?.id || 'demo-therapist'}`);
         if (response.ok) {
            const data = await response.json();
            setPatients(data);
         }
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
            const labels = sudRecords.map((r: any) => new Date(r.date || r.created_at).toLocaleDateString());
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
         <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
            <div>
               <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                     <FiBook className="w-8 h-8" />
                  </div>
                  Relatórios Inteligentes (IA)
               </h1>
               <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base max-w-2xl">
                  Geração automatizada de laudos, evoluções e documentos clínicos baseados em histórico.
               </p>
            </div>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Left Controls Column (4/12) */}
            <div className="lg:col-span-4 space-y-6">
               {/* Patient & Type Selection Card */}
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 backdrop-blur-xl transition-all hover:shadow-md">
                  <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                     <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                     Configuração
                  </h2>

                  <div className="space-y-5">
                     {/* Patient Select */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1">Paciente</label>
                        <div className="relative group">
                           <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                           <select
                              value={selectedPatient}
                              onChange={(e) => setSelectedPatient(e.target.value)}
                              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
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

               {/* History Card */}
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-[400px]">
                  <h2 className="text-lg font-bold mb-1 flex items-center justify-between text-slate-700 dark:text-slate-200">
                     <span className="flex items-center gap-2">
                        <FiClock className="text-slate-400" /> Histórico
                     </span>
                     {savedReports.length > 0 && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500 font-medium">
                           {savedReports.length}
                        </span>
                     )}
                  </h2>

                  <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3 custom-scrollbar">
                     {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 gap-2">
                           <FiRefreshCw className="animate-spin" />
                           <span className="text-xs">Atualizando...</span>
                        </div>
                     ) : savedReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                           <FiList className="w-8 h-8 mb-2 opacity-50" />
                           <span className="text-sm font-medium">Sem histórico</span>
                        </div>
                     ) : (
                        savedReports.map(report => (
                           <div
                              key={report.id}
                              onClick={() => setCurrentReport(report.content)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-md ${currentReport === report.content
                                 ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50'
                                 : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800'
                                 }`}
                           >
                              <div className="flex justify-between items-start">
                                 <div className="min-w-0">
                                    <h4 className={`font-semibold text-sm truncate ${currentReport === report.content ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                                       }`}>
                                       {report.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                       <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                          {report.type}
                                       </span>
                                       <span className="text-xs text-slate-400 flex items-center gap-1">
                                          <FiClock className="w-3 h-3" />
                                          {new Date(report.created_at).toLocaleDateString()}
                                       </span>
                                    </div>
                                 </div>
                                 <button
                                    onClick={(e) => handleDeleteReport(report.id, e)}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                    title="Excluir"
                                 >
                                    <FiTrash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* Right Content Column (8/12) */}
            <div className="lg:col-span-8 flex flex-col gap-6">

               {/* Editor/Preview Card */}
               <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex flex-col flex-1 min-h-[500px] overflow-hidden">
                  {/* Toolbar */}
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                     <h2 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${currentReport ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                           {currentReport ? <FiCheckCircle /> : <FiAlertCircle />}
                        </span>
                        Visualização
                        {generating && <span className="text-xs font-normal text-indigo-500 animate-pulse ml-2">• Escrevendo...</span>}
                     </h2>
                     <div className="flex gap-3">
                        <button
                           onClick={handleDownload}
                           disabled={!currentReport}
                           className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                           <FiDownload className="w-4 h-4" /> PDF
                        </button>
                        <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 shadow-md shadow-slate-300/20 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50">
                           <FiShare2 className="w-4 h-4" /> Compartilhar
                        </button>
                     </div>
                  </div>

                  {/* Editor Area */}
                  <div className="flex-1 relative bg-slate-50/30 dark:bg-slate-950/30">
                     {currentReport ? (
                        <textarea
                           value={currentReport}
                           onChange={(e) => setCurrentReport(e.target.value)}
                           className="w-full h-full p-8 resize-none font-serif text-lg leading-loose text-slate-800 dark:text-slate-200 outline-none bg-transparent"
                           placeholder="Comece a escrever..."
                        />
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                           <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                              <FiFileText className="w-8 h-8 opacity-40" />
                           </div>
                           <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Nenhum documento selecionado</h3>
                           <p className="max-w-md text-slate-400 text-sm leading-relaxed">
                              Selecione um paciente na barra lateral e clique em <strong className="text-indigo-500">Gerar com Nexus IA</strong> para criar um novo relatório clínico, ou selecione um item do histórico.
                           </p>
                        </div>
                     )}
                  </div>

                  {/* Footer Status */}
                  {currentReport && (
                     <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                        <span>{currentReport.length} caracteres</span>
                        <button
                           onClick={() => saveReport(currentReport)}
                           className="text-indigo-500 font-bold hover:underline"
                        >
                           Salvar Alterações
                        </button>
                     </div>
                  )}
               </div>

               {/* Chart Section */}
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <FiActivity className="text-indigo-500" />
                        Evolução Clínica (SUD)
                     </h3>
                     <select className="text-xs bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 font-medium text-slate-500 cursor-pointer outline-none">
                        <option>Últimas 5 sessões</option>
                        <option>Todo o período</option>
                     </select>
                  </div>
                  <div className="h-64 w-full">
                     <Line data={chartData} options={chartOptions} />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default ReportsView;