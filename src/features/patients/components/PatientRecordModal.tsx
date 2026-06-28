import React, { useState, useRef } from 'react';
import {
  X, Mail, Phone, MessageCircle, Calendar, FileText, Activity,
  Briefcase, DollarSign, FileCheck, UploadCloud, File, Download,
  Trash2, PenTool, Loader2, ChevronRight, Clock, MapPin, FileBadge, Printer
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SkeletonSessionCard } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Patient } from 'types';
import { usePatientDetails } from '../api/usePatients';

interface PatientRecordModalProps {
  patient: Patient;
  onClose: () => void;
  onNavigateToAgenda?: (patientId: string, patientName?: string) => void;
  handleWhatsApp: (patient: Patient) => void;
}

export const PatientRecordModal: React.FC<PatientRecordModalProps> = ({ patient, onClose, onNavigateToAgenda, handleWhatsApp }) => {
  const { data: fetchedClientDetails, isLoading: loadingDetails } = usePatientDetails(patient.id);
  
  const clientDetails = fetchedClientDetails || { timeline: [], financial: { totalInvested: 0, pending: 0, history: [] }, documents: [] };
  
  const [viewingSession, setViewingSession] = useState<any | null>(null);
  
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState('contract');
  const [documents, setDocuments] = useState<any[]>(clientDetails.documents || []);
  const [uploadingFiles, setUploadingFiles] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mock file upload
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f, i) => ({
        id: Math.random().toString(),
        name: f.name,
        progress: 10,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB'
      }));
      setUploadingFiles(prev => [...prev, ...newFiles]);
      
      // Simulate progress
      newFiles.forEach(file => {
        let progress = 10;
        const interval = setInterval(() => {
          progress += 20;
          setUploadingFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress: Math.min(progress, 100) } : f));
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(f => f.id !== file.id));
              setDocuments(prev => [{ id: Math.random().toString(), name: file.name, date: new Date().toLocaleDateString('pt-BR'), size: file.size }, ...prev]);
            }, 500);
          }
        }, 300);
      });
    }
  };

  const handleGenerateDocument = () => {
    setIsDocModalOpen(false);
    toast.success('Documento gerado e baixado com sucesso!');
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText size={24} className="text-red-500" />;
    if (name.match(/\.(jpg|jpeg|png)$/)) return <File size={24} className="text-blue-500" />;
    return <File size={24} className="text-slate-500" />;
  };

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="p-0 overflow-hidden sm:max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] gap-0 [&>button]:top-4 [&>button]:right-4">
          <DialogTitle className="sr-only">Prontuário de {patient.name}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes, histórico e financeiro do paciente.</DialogDescription>
          
          {/* Modal Header */}
          <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary-600 dark:bg-secondary-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary-500/30 dark:shadow-secondary-600/20 shrink-0">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{patient.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${['ativo', 'active'].includes(patient.status?.toLowerCase() || '') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${['ativo', 'active'].includes(patient.status?.toLowerCase() || '') ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                    {['ativo', 'active'].includes(patient.status?.toLowerCase() || '') ? 'Ativo' : patient.status}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <MapPin size={12} /> São Paulo, SP
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Tabs Navigation */}

        {/* Tab Content */}
        <Tabs defaultValue="details" className="flex flex-col flex-1 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0">
            <TabsList className="h-auto bg-transparent p-0 rounded-none gap-0 justify-start">
              <TabsTrigger
                value="details"
                className="flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 border-transparent rounded-none bg-transparent shadow-none transition-colors whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 data-[state=active]:border-primary-500 dark:data-[state=active]:border-secondary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-secondary-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Briefcase size={16} /> Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 border-transparent rounded-none bg-transparent shadow-none transition-colors whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 data-[state=active]:border-primary-500 dark:data-[state=active]:border-secondary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-secondary-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Activity size={16} /> Histórico
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 border-transparent rounded-none bg-transparent shadow-none transition-colors whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 data-[state=active]:border-primary-500 dark:data-[state=active]:border-secondary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-secondary-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <DollarSign size={16} /> Financeiro
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 border-transparent rounded-none bg-transparent shadow-none transition-colors whitespace-nowrap text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 data-[state=active]:border-primary-500 dark:data-[state=active]:border-secondary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-secondary-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <FileCheck size={16} /> Documentos
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-900 flex-1">
            <TabsContent value="details" className="mt-0">
              <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informações de Contato</h3>
                  <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold">Email</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{patient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold">Telefone</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{patient.phone}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleWhatsApp(patient)}
                      className="w-full h-10 flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#075E54] dark:text-[#25D366] hover:bg-[#25D366]/20 rounded-lg text-sm font-bold transition-colors"
                    >
                      <MessageCircle size={16} /> Enviar Mensagem
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximos Passos</h3>
                  <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary-600 dark:text-primary-400" />
                        <div>
                          <p className="text-xs font-bold text-primary-800 dark:text-white">Próxima Sessão</p>
                          <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                            {patient.nextSession 
                              ? new Date(patient.nextSession).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' às') 
                              : 'Não agendada'}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => { onClose(); onNavigateToAgenda && onNavigateToAgenda(patient.id, patient.name); }} className="text-xs bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-bold px-3 py-1.5 rounded-md shadow-sm">Agendar</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anotações Gerais</h3>
                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed relative">
                  <FileText className="absolute top-4 right-4 text-amber-200 dark:text-amber-900/40" size={24} />
                  {patient.notes || "Sem anotações registradas."}
                </div>
              </div>
            </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-primary-500 dark:text-secondary-400" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Histórico de Sessões</h3>
                  {!loadingDetails && (clientDetails?.timeline?.length || 0) > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-secondary-900/30 text-primary-700 dark:text-secondary-400 text-xs font-bold">
                      {clientDetails.timeline.length} sessão(ões)
                    </span>
                  )}
                </div>
              </div>

              {loadingDetails && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <SkeletonSessionCard key={i} />
                  ))}
                </div>
              )}

              {!loadingDetails && (clientDetails?.timeline?.length || 0) === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                    <Calendar size={32} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-600 dark:text-slate-300">Nenhuma sessão registrada</p>
                  <p className="text-sm text-slate-400 mt-1">As sessões concluídas aparecerão aqui.</p>
                </div>
              )}

              {!loadingDetails && (clientDetails?.timeline || []).map((event: any, index: number) => (
                <div
                  key={event.id}
                  className="group bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-secondary-700/50 transition-all cursor-pointer"
                  onClick={() => setViewingSession(event)}
                >
                  <div className="p-5 flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 flex flex-col items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                      <span className="text-[10px] font-bold text-primary-400 dark:text-primary-500 uppercase leading-none">Nº</span>
                      <span className="text-lg font-black text-primary-600 dark:text-secondary-400 leading-none">
                        {(clientDetails?.timeline?.length || 0) - index}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors">
                              {event.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                              TRG
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={11} className="text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-400">
                              {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-500 dark:text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Ver detalhes <ChevronRight size={12} />
                        </span>
                      </div>

                      {event.desc && event.desc !== 'Sem anotações' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Anotações: </span>
                          {event.desc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-0">
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Investido (LTV)</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">R$ {clientDetails.financial.totalInvested.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Pendente</p>
                  <p className={`text-2xl font-bold ${clientDetails.financial.pending > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                    R$ {clientDetails.financial.pending.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 font-bold text-sm text-slate-700 dark:text-slate-200">
                  Histórico de Transações
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {(clientDetails?.financial?.history?.length || 0) === 0 ? <p className="p-4 text-slate-500 text-sm">Nenhuma transação registrada.</p> : (clientDetails?.financial?.history || []).map((t: any) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{t.desc}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 dark:text-white text-sm">R$ {t.value.toFixed(2)}</p>
                        <span className={`text-[10px] font-bold uppercase ${t.status === 'Pago' ? 'text-green-500' : 'text-amber-500'}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </TabsContent>

            <TabsContent value="docs" className="mt-0">
            <div className="space-y-6 animate-fade-in">
              <div
                className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-center group cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Clique ou Arraste arquivos aqui</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">Suporta múltiplos arquivos (PDF, Imagens, Docx). Máx 10MB por arquivo.</p>
                  </div>
                </div>
              </div>

              {uploadingFiles.length > 0 && (
                <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Enviando {uploadingFiles.length} arquivo(s)...
                  </h4>
                  {uploadingFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-4 animate-fade-in">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500"><File size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-end mb-1.5">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{file.name}</p>
                          <span className="text-xs font-mono text-slate-500">{file.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-200 ease-out" style={{ width: `${file.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileCheck size={18} className="text-green-500" /> Documentos Arquivados
                </h4>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <PenTool size={14} /> Gerar Novo
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-primary-300 dark:hover:border-secondary-600 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 rounded-xl shrink-0">
                        {getFileIcon(doc.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{doc.date}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span>{doc.size || '1MB'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-secondary-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Download size={18} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && <div className="text-center py-8 text-slate-400 italic text-sm">Nenhum documento encontrado.</div>}
              </div>
            </div>
            </TabsContent>
          </div>
        </Tabs>
        </DialogContent>
      </Dialog>

      {/* Document Generator Modal */}
      {isDocModalOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && setIsDocModalOpen(false)}>
          <DialogContent className="p-0 overflow-hidden sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col gap-0 [&>button]:top-4 [&>button]:right-4">
            <DialogTitle className="sr-only">Novo Documento</DialogTitle>
            <DialogDescription className="sr-only">Selecione o tipo de documento a ser gerado.</DialogDescription>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-800 dark:text-white">Novo Documento</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Tipo de Documento</label>
                <div className="grid grid-cols-1 gap-2">
                  {['contract', 'certificate', 'report'].map(type => (
                    <button
                      key={type}
                      onClick={() => setDocType(type)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${docType === type
                        ? 'bg-primary-50 dark:bg-secondary-900/20 border-primary-500 dark:border-secondary-500 ring-1 ring-primary-500 dark:ring-secondary-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                      <div className={`p-2 rounded-full ${docType === type ? 'bg-primary-500 dark:bg-secondary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {type === 'contract' ? <FileCheck size={16} /> : type === 'certificate' ? <FileBadge size={16} /> : <FileText size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white capitalize">
                          {type === 'contract' ? 'Contrato de Serviço' : type === 'certificate' ? 'Atestado de Comparecimento' : 'Laudo / Relatório'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Gerar PDF automático</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerateDocument} className="w-full h-12 bg-primary-600 hover:bg-primary-700 dark:bg-secondary-600 dark:hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2">
                <Printer size={18} /> Gerar e Baixar PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Session Read-Only Viewer Modal */}
      {viewingSession && (
        <Dialog open={true} onOpenChange={(open) => !open && setViewingSession(null)}>
          <DialogContent className="p-0 overflow-hidden sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] gap-0 [&>button]:top-4 [&>button]:right-4">
            <DialogTitle className="sr-only">Registro de Sessão</DialogTitle>
            <DialogDescription className="sr-only">Detalhes da sessão realizada.</DialogDescription>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-primary-50 dark:bg-primary-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-lg shadow-sm">
                  <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Registro de Sessão</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(viewingSession.date).toLocaleDateString('pt-BR')} • {patient?.name}</p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Anotações da Sessão</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewingSession.sessionData?.clinicalRecord?.observation || viewingSession.desc}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Evolução Clínica (SUD)</h4>
                <div className="flex items-end gap-2 h-24 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  {viewingSession.sessionData?.clinicalRecord?.sudLevels ? (
                    Object.entries(viewingSession.sessionData.clinicalRecord.sudLevels).map(([key, val]: [string, any], idx: number) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group" title={key}>
                        <div className="w-full bg-primary-400 dark:bg-primary-600 rounded-t-sm transition-all group-hover:bg-primary-500" style={{ height: `${(Number(val) / 10) * 100}%`, minHeight: '4px' }}></div>
                        <span className="text-[10px] font-bold text-slate-500">{val}</span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center text-xs text-slate-400">Nenhum registro de SUD disponível</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-1">Duração</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-white">
                    {viewingSession.sessionData?.clinicalRecord?.durationSeconds ? `${Math.floor(viewingSession.sessionData.clinicalRecord.durationSeconds / 60)} min` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">Sessão / Protocolo</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-white">Sessão {viewingSession.sessionData?.clinicalRecord?.sessionNumber || 1}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline">Ver Notas Completas</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
