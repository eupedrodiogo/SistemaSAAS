
import React, { useState, useEffect } from 'react';
import {
   Plus,
   Target,
   BarChart2,
   Copy,
   MessageCircle,
   Instagram,
   X,
   GripVertical,
   ArrowRight,
   MoreHorizontal,
   Share2,
   Sparkles,
   Wand2,
   Send,
   Loader2,
   CheckCircle2,
   AlertCircle
} from 'lucide-react';
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   PieChart,
   Pie,
   Cell
} from 'recharts';
import { Lead } from 'types';

// --- MOCK DATA ---

const INITIAL_LEADS: Lead[] = [
   { id: '1', name: 'Juliana Paes', phone: '11999998888', source: 'Instagram', status: 'new', potentialValue: 1500, lastContact: '2h atrás' },
   { id: '2', name: 'Marcos Silva', phone: '11988887777', source: 'Google Ads', status: 'contacted', potentialValue: 2000, lastContact: '1d atrás' },
   { id: '3', name: 'Fernanda Lima', phone: '21977776666', source: 'Indicação', status: 'scheduled', potentialValue: 2500, lastContact: '3d atrás' },
   { id: '4', name: 'Roberto Justus', phone: '11966665555', source: 'Instagram', status: 'new', potentialValue: 1500, lastContact: '5h atrás' },
   { id: '5', name: 'Claudia Raia', phone: '21955554444', source: 'Google Ads', status: 'converted', potentialValue: 3000, lastContact: '1sem atrás' },
];

const SOURCE_DATA = [
   { name: 'Instagram', value: 45, color: '#E1306C' },
   { name: 'Google Ads', value: 30, color: '#4285F4' },
   { name: 'Indicação', value: 20, color: '#0F9D58' },
   { name: 'Outros', value: 5, color: '#F4B400' },
];

const CONVERSION_DATA = [
   { name: 'Novos', value: 120 },
   { name: 'Contato', value: 80 },
   { name: 'Agendou', value: 45 },
   { name: 'Fechou', value: 30 },
];

const KANBAN_COLUMNS = [
   { id: 'new', label: 'Novos Contatos', color: 'border-blue-500' },
   { id: 'contacted', label: 'Em Conversa', color: 'border-amber-500' },
   { id: 'scheduled', label: 'Sessão Agendada', color: 'border-purple-500' },
   { id: 'converted', label: 'Fechado (Ganho)', color: 'border-green-500' },
];

const SCRIPTS = [
   { id: 1, title: 'Boas-vindas WhatsApp', text: 'Olá {nome}! Vi seu interesse na terapia TRG. Sou o Dr. Ricardo. Gostaria de entender melhor o que você busca para te explicar como posso ajudar?' },
   { id: 2, title: 'Follow-up Agendamento', text: 'Oi {nome}! Tudo bem? Notei que não finalizamos seu agendamento. Tem alguma dúvida sobre os horários ou valores?' },
   { id: 3, title: 'Pós-sessão (Feedback)', text: 'Olá {nome}! Como você está se sentindo após nossa sessão de hoje? Lembre-se de beber água e descansar.' },
];

const MarketingView: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'pipeline' | 'analytics' | 'resources'>('pipeline');
   const [leads, setLeads] = useState<Lead[]>([]);

   useEffect(() => {
      const savedLeads = localStorage.getItem('TRG_LEADS');
      if (savedLeads) {
         setLeads(JSON.parse(savedLeads));
      }
   }, []);

   useEffect(() => {
      localStorage.setItem('TRG_LEADS', JSON.stringify(leads));
   }, [leads]);
   const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
   const [newLead, setNewLead] = useState<Partial<Lead>>({ status: 'new', source: 'Instagram' });

   // AI Content Gen State
   const [aiTopic, setAiTopic] = useState('');
   const [aiTone, setAiTone] = useState('Profissional');
   const [generatedContent, setGeneratedContent] = useState('');
   const [isGenerating, setIsGenerating] = useState(false);

   // WhatsApp/Twilio Integration State
   const [isWhatsModalOpen, setIsWhatsModalOpen] = useState(false);
   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
   const [selectedScriptId, setSelectedScriptId] = useState<number | string>('');
   const [messageBody, setMessageBody] = useState('');
   const [isSending, setIsSending] = useState(false);

   // Toast Notification State
   const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

   // Drag & Drop State
   const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

   const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(null), 4000);
   };

   const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedLeadId(id);
      e.dataTransfer.effectAllowed = "move";
   };

   const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
   };

   const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
      e.preventDefault();
      if (draggedLeadId) {
         setLeads(prev => prev.map(lead =>
            lead.id === draggedLeadId ? { ...lead, status } : lead
         ));
         setDraggedLeadId(null);
      }
   };

   const addLead = () => {
      if (newLead.name && newLead.phone) {
         const lead: Lead = {
            id: Date.now().toString(),
            name: newLead.name,
            phone: newLead.phone,
            source: newLead.source || 'Outros',
            status: 'new',
            potentialValue: newLead.potentialValue || 0,
            lastContact: 'Agora'
         };
         setLeads([lead, ...leads]);
         setIsLeadModalOpen(false);
         setNewLead({ status: 'new', source: 'Instagram' });
         showNotification("Lead adicionado com sucesso!");
      }
   };

   const copyScript = (text: string) => {
      navigator.clipboard.writeText(text);
      showNotification('Script copiado para a área de transferência!');
   };

   const handleGenerateContent = () => {
      if (!aiTopic) return;
      setIsGenerating(true);
      setGeneratedContent('');

      setTimeout(() => {
         const toneText = aiTone === 'Empático' ? 'com muita empatia e acolhimento' : 'de forma profissional e direta';
         const mockGen = `[Sugestão de Post/Mensagem sobre "${aiTopic}"]\n\nOlá! Hoje gostaria de falar sobre ${aiTopic}. \n\nMuitas pessoas sofrem com isso em silêncio, mas a TRG pode ajudar a reprocessar essas emoções. ${toneText}, quero dizer que há solução.\n\nAgende sua avaliação gratuita e vamos conversar. #TRG #Terapia #${aiTopic.replace(/\s/g, '')}`;
         setGeneratedContent(mockGen);
         setIsGenerating(false);
      }, 2000);
   };

   // --- TWILIO INTEGRATION LOGIC ---

   const openWhatsAppModal = (lead: Lead) => {
      setSelectedLead(lead);
      setSelectedScriptId('');
      setMessageBody('');
      setIsWhatsModalOpen(true);
   };

   const handleScriptSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const scriptId = parseInt(e.target.value);
      setSelectedScriptId(scriptId);
      const script = SCRIPTS.find(s => s.id === scriptId);
      if (script && selectedLead) {
         // Simple template replacement
         const personalizedText = script.text.replace('{nome}', selectedLead.name.split(' ')[0]);
         setMessageBody(personalizedText);
      }
   };

   const handleSendTwilio = async () => {
      if (!selectedLead || !messageBody) return;

      setIsSending(true);

      // --- SIMULATION OF BACKEND CALL ---
      // In a real app, you would call:
      // await fetch('/api/twilio/send-whatsapp', { 
      //   method: 'POST', 
      //   body: JSON.stringify({ to: selectedLead.phone, message: messageBody }) 
      // });

      setTimeout(() => {
         setIsSending(false);
         setIsWhatsModalOpen(false);

         // Update Lead Status to 'contacted' if it was 'new'
         if (selectedLead.status === 'new') {
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'contacted', lastContact: 'Agora' } : l));
         } else {
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, lastContact: 'Agora' } : l));
         }

         showNotification(`Mensagem enviada para ${selectedLead.name} via Twilio!`);
      }, 2000);
   };

   // --- RENDER FUNCTIONS ---

   const renderPipeline = () => (
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] min-h-[500px] items-start animate-fade-in">
         {KANBAN_COLUMNS.map(col => {
            const columnLeads = leads.filter(l => l.status === col.id);
            const totalValue = columnLeads.reduce((acc, curr) => acc + curr.potentialValue, 0);

            return (
               <div
                  key={col.id}
                  className="flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full max-h-full"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id as Lead['status'])}
               >
                  {/* Column Header */}
                  <div className={`p-4 border-b-2 ${col.color} bg-white dark:bg-slate-900 rounded-t-xl`}>
                     <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">{col.label}</h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                     </div>
                     <p className="text-xs text-slate-500 font-medium">R$ {totalValue.toLocaleString('pt-BR')} em potencial</p>
                  </div>

                  {/* Drop Area / Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                     {columnLeads.map(lead => (
                        <div
                           key={lead.id}
                           draggable
                           onDragStart={(e) => handleDragStart(e, lead.id)}
                           className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary-300 dark:hover:border-secondary-600 transition-all group relative"
                        >
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-slate-800 dark:text-white">{lead.name}</h4>
                              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><MoreHorizontal size={16} /></button>
                           </div>

                           <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                              <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${lead.source === 'Instagram' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                 {lead.source === 'Instagram' ? <Instagram size={10} /> : <Target size={10} />} {lead.source}
                              </span>
                              <span>• {lead.lastContact}</span>
                           </div>

                           <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                              <button
                                 onClick={() => openWhatsAppModal(lead)}
                                 className="flex-1 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                 title="Enviar WhatsApp via Twilio"
                              >
                                 <MessageCircle size={14} /> WhatsApp
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700" title="Ver Detalhes">
                                 <ArrowRight size={14} />
                              </button>
                           </div>
                        </div>
                     ))}
                     {columnLeads.length === 0 && (
                        <div className="text-center py-8 text-slate-400 italic text-xs border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                           Arraste leads para cá
                        </div>
                     )}
                  </div>
               </div>
            );
         })}
      </div>
   );

   const renderAnalytics = () => {
      const sourceData = [
         { name: 'Instagram', value: leads.filter(l => l.source === 'Instagram').length, color: '#E1306C' },
         { name: 'Google Ads', value: leads.filter(l => l.source === 'Google Ads').length, color: '#4285F4' },
         { name: 'Indicação', value: leads.filter(l => l.source === 'Indicação').length, color: '#0F9D58' },
         { name: 'Outros', value: leads.filter(l => l.source === 'Outros').length, color: '#F4B400' },
      ].filter(d => d.value > 0);

      const conversionData = [
         { name: 'Novos', value: leads.filter(l => l.status === 'new').length },
         { name: 'Contato', value: leads.filter(l => l.status === 'contacted').length },
         { name: 'Agendou', value: leads.filter(l => l.status === 'scheduled').length },
         { name: 'Fechou', value: leads.filter(l => l.status === 'converted').length },
      ];

      return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Target size={20} className="text-primary-500" /> Funil de Conversão
               </h3>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={CONVERSION_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} width={80} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30}>
                           {CONVERSION_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'][index]} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Sources Pie Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Share2 size={20} className="text-purple-500" /> Origem dos Leads
               </h3>
               <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={SOURCE_DATA}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {sourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-bold text-slate-800 dark:text-white">100%</span>
                     <span className="text-xs text-slate-500 uppercase font-bold">Distribuição</span>
                  </div>
               </div>
               <div className="flex justify-center gap-4 mt-4">
                  {sourceData.map((s, i) => (
                     <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{s.name}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      );
   };

   const renderResources = () => (
      <div className="space-y-8 animate-slide-up">

         {/* AI Content Generator */}
         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                     <Wand2 size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold">Estúdio de Criação IA</h3>
                     <p className="text-indigo-100 text-sm">Gere posts para Instagram e scripts de vendas em segundos.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                     <label className="text-xs font-bold text-indigo-100 uppercase mb-1 block">Sobre o que você quer falar?</label>
                     <input
                        className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-200 outline-none focus:bg-white/20 transition-all"
                        placeholder="Ex: Medo de dirigir, Ansiedade noturna..."
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-indigo-100 uppercase mb-1 block">Tom de Voz</label>
                     <select
                        className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:bg-white/20 cursor-pointer"
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                     >
                        <option className="text-slate-900">Profissional</option>
                        <option className="text-slate-900">Empático</option>
                        <option className="text-slate-900">Urgente (Vendas)</option>
                     </select>
                  </div>
               </div>

               <button
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !aiTopic}
                  className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isGenerating ? <span className="animate-pulse">Criando Mágica...</span> : <><Sparkles size={18} /> Gerar Conteúdo</>}
               </button>

               {generatedContent && (
                  <div className="mt-6 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 animate-fade-in">
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-indigo-200 uppercase">Resultado Gerado</span>
                        <button onClick={() => copyScript(generatedContent)} className="text-white hover:text-indigo-200"><Copy size={16} /></button>
                     </div>
                     <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed font-mono">{generatedContent}</p>
                  </div>
               )}
            </div>
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCRIPTS.map((script) => (
               <div key={script.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary-300 dark:hover:border-secondary-600 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                        <MessageCircle size={24} />
                     </div>
                     <button onClick={() => copyScript(script.text)} className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-secondary-400 transition-colors" title="Copiar">
                        <Copy size={18} />
                     </button>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">{script.title}</h4>
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mb-4 h-24 overflow-hidden relative">
                     <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{script.text}"</p>
                     <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>
                  </div>
                  <button onClick={() => copyScript(script.text)} className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                     Copiar Script
                  </button>
               </div>
            ))}
         </div>
      </div>
   );

   return (
      <div className="space-y-6 animate-fade-in pb-20 md:pb-0 relative">

         {/* Toast Notification */}
         {toast && toast.show && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-md animate-slide-up">
               <div className="bg-slate-800 dark:bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
                  <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                     {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <p className="text-sm font-medium flex-1">{toast.message}</p>
                  <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
               </div>
            </div>
         )}

         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Marketing & Vendas</h1>
               <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie leads, acompanhe campanhas e aumente sua conversão.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
               {[
                  { id: 'pipeline', label: 'Pipeline (Kanban)', icon: GripVertical },
                  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
                  { id: 'resources', label: 'Estúdio AI', icon: Wand2 },
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`
                 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                 ${activeTab === tab.id
                           ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                           : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}
               `}
                  >
                     <tab.icon size={16} />
                     {tab.label}
                  </button>
               ))}
               <button
                  onClick={() => setIsLeadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-secondary-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-700 dark:hover:bg-secondary-700 transition-colors active:scale-95 whitespace-nowrap"
               >
                  <Plus size={18} /> Novo Lead
               </button>
            </div>
         </div>

         {/* Content */}
         <div className="min-h-[500px]">
            {activeTab === 'pipeline' && renderPipeline()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'resources' && renderResources()}
         </div>

         {/* New Lead Modal */}
         {isLeadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLeadModalOpen(false)} />
               <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up p-6 ring-1 ring-slate-200 dark:ring-slate-800">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Target size={20} className="text-primary-500" /> Adicionar Lead
                     </h3>
                     <button onClick={() => setIsLeadModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nome do Interessado</label>
                        <input
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                           value={newLead.name || ''}
                           onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">WhatsApp / Telefone</label>
                        <input
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                           value={newLead.phone || ''}
                           onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Origem</label>
                           <select
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                              value={newLead.source}
                              onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                           >
                              <option>Instagram</option>
                              <option>Google Ads</option>
                              <option>Indicação</option>
                              <option>Outros</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor Potencial</label>
                           <input
                              type="number"
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                              placeholder="R$"
                              value={newLead.potentialValue || ''}
                              onChange={(e) => setNewLead({ ...newLead, potentialValue: parseFloat(e.target.value) })}
                           />
                        </div>
                     </div>
                     <button
                        onClick={addLead}
                        className="w-full py-3 bg-primary-600 dark:bg-secondary-600 hover:bg-primary-700 dark:hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg mt-2 transition-colors"
                     >
                        Salvar Lead
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Twilio WhatsApp Send Modal */}
         {isWhatsModalOpen && selectedLead && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setIsWhatsModalOpen(false)} />
               <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up p-6 ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                     <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                           <MessageCircle size={20} className="text-green-500" /> Enviar WhatsApp
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Integração via Twilio API</p>
                     </div>
                     <button onClick={() => setIsWhatsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                  </div>

                  <div className="space-y-4">
                     <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 font-bold">
                           {selectedLead.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedLead.name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLead.phone}</p>
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Selecione um Script</label>
                        <select
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                           value={selectedScriptId}
                           onChange={handleScriptSelect}
                        >
                           <option value="">-- Selecione para preencher --</option>
                           {SCRIPTS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Mensagem (Editável)</label>
                        <textarea
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white h-32 resize-none focus:ring-2 focus:ring-green-500"
                           value={messageBody}
                           onChange={(e) => setMessageBody(e.target.value)}
                           placeholder="Digite sua mensagem ou selecione um script..."
                        />
                     </div>

                     <button
                        onClick={handleSendTwilio}
                        disabled={isSending || !messageBody}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg mt-2 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSending ? 'Enviando...' : 'Enviar Mensagem'}
                     </button>

                     <p className="text-[10px] text-center text-slate-400 mt-2">
                        A mensagem será enviada usando seu número Twilio configurado.
                     </p>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};

export default MarketingView;
