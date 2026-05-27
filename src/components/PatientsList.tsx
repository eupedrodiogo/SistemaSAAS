import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  FileText,
  MoreVertical,
  X,
  MessageCircle,
  Activity,
  Clock,
  Filter,
  DollarSign,
  FileCheck,
  Briefcase,
  MapPin,
  Tag,
  Download,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Printer,
  ChevronRight,

  FileBadge,
  Save,
  UploadCloud,
  File,
  Loader2,
  FileImage,
  Film
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Patient } from 'types';
import { MOCK_PATIENTS } from '../constants';
import { api } from '../services/api';
import RecordingGallery from './Shared/RecordingGallery';
import AddSUDModal from './AddSUDModal';
import WhatsAppModal from './WhatsAppModal';

interface PatientsListProps {
  highlightPatientId?: string | null;
  onNavigateToSession?: () => void;
}

// Mock extensions for Client CRM features
const CLIENT_TAGS = ['VIP', 'Particular', 'Convênio', 'Indicação', 'Corporativo'];

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  size: string;
}

const ClientsList: React.FC<PatientsListProps> = ({ highlightPatientId, onNavigateToSession }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // SSoT: busca pacientes já enriquecidos com totais financeiros dinâmicos
        const data = await api.patients.listWithFinancials();
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Ativo' | 'Inativo' | 'Leads'>('Todos');

  // Full Record Modal State
  const [viewingClient, setViewingClient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'financial' | 'docs' | 'recordings'>('details');
  const [clientDetails, setClientDetails] = useState<any>({ timeline: [], financial: { totalInvested: 0, pending: 0, history: [] }, documents: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);

  // SUD State
  const [sudHistory, setSudHistory] = useState<any[]>([]);
  const [isSUDModalOpen, setIsSUDModalOpen] = useState(false);
  const [addingSUD, setAddingSUD] = useState(false);

  // WhatsApp Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<Patient | null>(null);

  useEffect(() => {
    if (viewingClient) {
      setLoadingDetails(true);

      // Fetch Client Details
      api.patients.details(viewingClient.id)
        .then(data => setClientDetails(data))
        .catch(err => console.error("Error loading details:", err));

      // Fetch SUD History
      api.patients.sud.list(viewingClient.id)
        .then(data => setSudHistory(data))
        .catch(err => console.error("Error loading SUD history:", err))
        .finally(() => setLoadingDetails(false));
    }
  }, [viewingClient]);

  const handleSaveSUD = async (score: number, notes: string) => {
    if (!viewingClient) return;
    setAddingSUD(true);
    try {
      const therapistStr = localStorage.getItem('therapist');
      const therapist = therapistStr ? JSON.parse(therapistStr) : null;

      const newRecord = await api.patients.sud.create({
        therapistId: therapist?.id,
        patientId: viewingClient.id,
        score,
        notes
      });

      if (newRecord) {
        // Refresh SUD history
        setSudHistory(prev => [...prev, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setIsSUDModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving SUD:", error);
      alert('Erro ao salvar SUD');
    } finally {
      setAddingSUD(false);
    }
  };

  // Edit/Add Modal State
  const [editingClient, setEditingClient] = useState<Patient | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});

  // Document Generator State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState('contract');
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // Session Viewer State
  const [viewingSession, setViewingSession] = useState<any | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    patientId: string | null;
  }>({ visible: false, x: 0, y: 0, patientId: null });

  // Refs for Long Press logic - Using any to avoid TS Node/Browser timeout mismatches
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open patient record if ID is passed via prop
  useEffect(() => {
    if (highlightPatientId) {
      const p = patients.find(pat => pat.id === highlightPatientId);
      if (p) {
        setViewingClient(p);
        setSearchTerm(p.name);
      }
    }
  }, [highlightPatientId, patients]);

  // Close menu on global click or scroll
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick, true);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick, true);
    };
  }, [contextMenu]);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'Todos' ||
      (activeFilter === 'Leads' ? p.status === 'Em Pausa' : p.status === activeFilter); // Mapping 'Em Pausa' to Leads for demo
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja arquivar este cliente?')) {
      try {
        await api.patients.delete(id);
        setPatients(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Erro ao excluir cliente. Tente novamente.');
      }
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleEdit = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    if (p) {
      setEditingClient(p);
      setEditForm(p);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleSaveEdit = async () => {
    if (isAddingClient && editForm.name) {
      try {
        const newClient = await api.patients.create({
          ...editForm,
          status: editForm.status || 'Ativo',
        });
        if (newClient) {
          setPatients(prev => [newClient, ...prev]);
          setIsAddingClient(false);
        }
      } catch (error) {
        console.error('Error creating patient:', error);
        alert('Erro ao criar cliente.');
      }
    } else if (editingClient && editForm) {
      try {
        const updated = await api.patients.update(editingClient.id, editForm);
        if (updated) {
          setPatients(prev => prev.map(p => p.id === editingClient.id ? updated : p));
          setEditingClient(null);
        }
      } catch (error) {
        console.error('Error updating patient:', error);
        alert('Erro ao atualizar cliente.');
      }
    }
  };

  const handleAddNewClient = () => {
    setEditForm({ name: '', email: '', phone: '', status: 'Ativo' });
    setIsAddingClient(true);
  };

  const handleViewRecord = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    if (p) {
      setViewingClient(p);
      setActiveTab('details');
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleWhatsApp = (patient: Patient) => {
    setWhatsAppTarget(patient);
    setIsWhatsAppModalOpen(true);
  };

  const handleGenerateDocument = () => {
    // Simulate generation
    const newDoc = {
      id: Date.now(),
      name: docType === 'contract' ? `Contrato - ${viewingClient?.name}.pdf` :
        docType === 'certificate' ? `Atestado - ${viewingClient?.name}.pdf` : `Laudo - ${viewingClient?.name}.pdf`,
      date: new Date().toLocaleDateString('pt-BR'),
      size: '120 KB',
      type: 'pdf'
    };
    setDocuments([newDoc, ...documents]);
    setIsDocModalOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    alert('Upload de documentos: Funcionalidade em desenvolvimento (Vercel Blob).');
    if (fileInputRef.current) fileInputRef.current.value = '';
    return;
    /* 
    // Previous Simulation Logic commented out
    const files = event.target.files; 
    ... 
    */
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText size={20} className="text-red-500" />;
    if (fileName.match(/\.(jpg|jpeg|png)$/i)) return <FileImage size={20} className="text-blue-500" />;
    if (fileName.match(/\.(doc|docx)$/i)) return <FileText size={20} className="text-blue-600" />;
    return <File size={20} className="text-slate-500" />;
  };

  // Right Click Handler
  const handleContextMenu = (e: React.MouseEvent, patientId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      patientId
    });
  };

  // --- Touch/Long Press Handlers ---
  const handleTouchStart = (e: React.TouchEvent, patientId: string) => {
    isLongPress.current = false;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setContextMenu({
        visible: true,
        x,
        y,
        patientId
      });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Base de contatos, histórico clínico e financeiro.</p>
        </div>
        <button 
          onClick={handleAddNewClient}
          className="w-full sm:w-auto bg-primary-600 dark:bg-secondary-600 hover:bg-primary-700 dark:hover:bg-secondary-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-medium">Novo Cliente</span>
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar clientes, emails, telefones..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter size={18} className="text-slate-400 shrink-0" />
          {['Todos', 'Ativo', 'Leads', 'Inativo'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`
                   px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border
                   ${activeFilter === filter
                  ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
               `}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative select-none cursor-pointer hover:border-primary-200 dark:hover:border-slate-700 flex flex-col md:flex-row gap-5"
            onClick={() => handleViewRecord(client.id)}
            onContextMenu={(e) => handleContextMenu(e, client.id)}
            onTouchStart={(e) => handleTouchStart(e, client.id)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            {/* Left: Avatar & Main Info */}
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-slate-800 group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors border-2 border-transparent group-hover:border-primary-100 dark:group-hover:border-slate-700">
                {client.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${client.status === 'Ativo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        client.status === 'Em Pausa' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                        {client.status}
                      </span>
                      {/* Random Tag for Demo */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        <Tag size={10} />
                        {CLIENT_TAGS[Math.floor(Math.random() * CLIENT_TAGS.length)]}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-1 md:hidden">
                    <button
                      className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                      onClick={(e) => { e.stopPropagation(); handleWhatsApp(client); }}
                    >
                      <MessageCircle size={20} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ visible: true, x: e.clientX - 150, y: e.clientY + 10, patientId: client.id });
                      }}
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Phone size={14} className="shrink-0" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock size={14} className="shrink-0" />
                    Última: {client.lastSession ? new Date(client.lastSession).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions & Metrics (Desktop) */}
            <div className="hidden md:flex flex-col items-end justify-between border-l border-slate-100 dark:border-slate-800 pl-5 shrink-0 min-w-[180px]">
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase">Investimento Total</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total_invested ?? 0)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(client.id); }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-secondary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                  title="Editar Cliente"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); /* Handle Calendar */ }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-secondary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                  title="Agendar Sessão"
                >
                  <Calendar size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); /* Handle Bill */ }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-green-600 hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-slate-800 transition-colors"
                  title="Novo Lançamento Financeiro"
                >
                  <DollarSign size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleWhatsApp(client); }}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-green-600 hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-slate-800 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum cliente encontrado.</p>
            <p className="text-sm opacity-60">Tente ajustar os filtros ou adicione um novo.</p>
          </div>
        )}
      </div>

      {/* Context Menu Portal */}
      {contextMenu.visible && contextMenu.patientId && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[180px] animate-fade-in overflow-hidden"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
        >
          <button onClick={() => handleViewRecord(contextMenu.patientId!)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-secondary-400 flex items-center gap-3 transition-colors">
            <Briefcase size={16} /> Ver Ficha Completa
          </button>
          <button onClick={() => handleEdit(contextMenu.patientId!)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-secondary-400 flex items-center gap-3 transition-colors">
            <Edit2 size={16} /> Editar Dados
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-green-600 flex items-center gap-3 transition-colors">
            <DollarSign size={16} /> Registrar Pagamento
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
          <button onClick={() => handleDelete(contextMenu.patientId!)} className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
            <Trash2 size={16} /> Arquivar Cliente
          </button>
        </div>
      )}

      {/* Edit/Add Client Modal */}
      {(editingClient || isAddingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => { setEditingClient(null); setIsAddingClient(false); }}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {isAddingClient ? <Plus size={18} /> : <Edit2 size={18} />} 
                {isAddingClient ? 'Novo Cliente' : 'Editar Cliente'}
              </h3>
              <button onClick={() => { setEditingClient(null); setIsAddingClient(false); }}><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Telefone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status</label>
                <div className="flex gap-2">
                  {['Ativo', 'Em Pausa', 'Inativo'].map(status => (
                    <button
                      key={status}
                      onClick={() => setEditForm({ ...editForm, status: status as any })}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${editForm.status === status
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Notas Rápidas</label>
                <textarea
                  rows={3}
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSaveEdit}
                className="w-full py-3 bg-primary-600 dark:bg-secondary-600 hover:bg-primary-700 dark:hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                <Save size={18} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Full Record Modal */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setViewingClient(null)}
          />
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-200 dark:ring-slate-800">

            {/* Modal Header */}
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-primary-600 dark:bg-secondary-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary-500/30 dark:shadow-secondary-600/20 shrink-0">
                  {viewingClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{viewingClient.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${viewingClient.status === 'Ativo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewingClient.status === 'Ativo' ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                      {viewingClient.status}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <MapPin size={12} /> São Paulo, SP
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingClient(null)}
                className="absolute top-4 right-4 md:static p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 shrink-0">
              {[
                { id: 'details', label: 'Visão Geral', icon: Briefcase },
                { id: 'history', label: 'Histórico', icon: Activity },
                { id: 'financial', label: 'Financeiro', icon: DollarSign },
                { id: 'docs', label: 'Documentos', icon: FileCheck }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                     flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
                     ${activeTab === tab.id
                      ? 'border-primary-500 dark:border-secondary-500 text-primary-600 dark:text-secondary-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                   `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-900 flex-1">

              {activeTab === 'details' && (
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
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{viewingClient.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-bold">Telefone</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{viewingClient.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleWhatsApp(viewingClient)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-[#25D366]/10 text-[#075E54] dark:text-[#25D366] hover:bg-[#25D366]/20 rounded-lg text-sm font-bold transition-colors"
                        >
                          <MessageCircle size={16} /> Enviar Mensagem
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximos Passos</h3>
                      <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary-600 dark:text-primary-400" />
                            <div>
                              <p className="text-xs font-bold text-primary-800 dark:text-primary-300">Próxima Sessão</p>
                              <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{viewingClient.nextSession ? new Date(viewingClient.nextSession).toLocaleDateString('pt-BR') : 'Não agendada'}</p>
                            </div>
                          </div>
                          <button className="text-xs bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-bold px-3 py-1.5 rounded-md shadow-sm">Agendar</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anotações Gerais</h3>
                    <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed relative">
                      <FileText className="absolute top-4 right-4 text-amber-200 dark:text-amber-900/40" size={24} />
                      {viewingClient.notes || "Sem anotações registradas."}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6 animate-fade-in">
                  {/* SUD Chart Section */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative z-20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500" />
                        Monitoramento de SUD (Nível de Desconforto)
                      </h3>
                      <button
                        onClick={() => setIsSUDModalOpen(true)}
                        className="text-xs bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        + Novo Registro
                      </button>
                    </div>

                    {sudHistory.length > 0 ? (
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sudHistory}>
                            <defs>
                              <linearGradient id="colorSud" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              dy={10}
                            />
                            <YAxis
                              domain={[0, 10]}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                            />
                            <Tooltip
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                              labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                            />
                            <Area
                              type="monotone"
                              dataKey="score"
                              stroke="#6366f1"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorSud)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[150px] flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Activity size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Sem registros de SUD ainda.</p>
                        <button
                          onClick={() => setIsSUDModalOpen(true)}
                          className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                        >
                          Registrar primeiro ponto
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative space-y-6">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-2 bottom-0 w-px bg-slate-200 dark:bg-slate-800"></div>

                    {loadingDetails ? <p className="p-4 text-slate-500">Carregando histórico...</p> : clientDetails.timeline.length === 0 ? <p className="p-4 text-slate-500">Nenhum histórico encontrado.</p> : clientDetails.timeline.map((event: any) => (
                      <div
                        key={event.id}
                        className={`flex gap-4 relative ${event.type === 'session' ? 'cursor-pointer group' : ''}`}
                        onClick={() => event.type === 'session' ? setViewingSession(event) : null}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-900 z-10 transition-transform ${event.type === 'session' ? 'group-hover:scale-110' : ''} ${event.type === 'session' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' :
                          event.type === 'financial' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                          {event.type === 'session' ? <Briefcase size={16} /> : event.type === 'financial' ? <DollarSign size={16} /> : <MessageCircle size={16} />}
                        </div>
                        <div className="pt-1 pb-6">
                          <span className="text-xs font-bold text-slate-400">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                          <h4 className={`font-bold text-slate-800 dark:text-white mt-0.5 ${event.type === 'session' ? 'group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors' : ''}`}>
                            {event.title}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{event.desc}</p>
                          {event.type === 'session' && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary-600 dark:text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Ver Detalhes <ChevronRight size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'financial' && (
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
                      {clientDetails.financial.history.length === 0 ? <p className="p-4 text-slate-500 text-sm">Nenhuma transação registrada.</p> : clientDetails.financial.history.map((t: any) => (
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
              )}

              {activeTab === 'docs' && (
                <div className="space-y-6 animate-fade-in">

                  {/* Multiple File Upload Area */}
                  <div
                    className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-center group cursor-pointer relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform">
                        <UploadCloud size={32} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Clique ou Arraste arquivos aqui</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                          Suporta múltiplos arquivos (PDF, Imagens, Docx). Máx 10MB por arquivo.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Uploads Progress List */}
                  {uploadingFiles.length > 0 && (
                    <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" /> Enviando {uploadingFiles.length} arquivo(s)...
                      </h4>
                      {uploadingFiles.map(file => (
                        <div key={file.id} className="flex items-center gap-4 animate-fade-in">
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                            <File size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-end mb-1.5">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{file.name}</p>
                              <span className="text-xs font-mono text-slate-500">{file.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-200 ease-out"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Document List Header */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileCheck size={18} className="text-green-500" /> Documentos Arquivados
                    </h4>
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      <PenTool size={14} />
                      Gerar Novo
                    </button>
                  </div>

                  {/* Documents List */}
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
                              <span>{doc.size}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-secondary-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Baixar">
                            <Download size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <div className="text-center py-8 text-slate-400 italic text-sm">
                        Nenhum documento encontrado.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Generator Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDocModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-800 dark:text-white">Novo Documento</h3>
              <button onClick={() => setIsDocModalOpen(false)}><X size={20} className="text-slate-400" /></button>
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
              <button
                onClick={handleGenerateDocument}
                className="w-full py-3 bg-primary-600 dark:bg-secondary-600 hover:bg-primary-700 dark:hover:bg-secondary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                <Printer size={18} />
                Gerar e Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Read-Only Viewer Modal */}
      {viewingSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingSession(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-primary-50 dark:bg-primary-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-lg shadow-sm">
                  <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Registro de Sessão</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(viewingSession.date).toLocaleDateString('pt-BR')} • {viewingClient?.name}</p>
                </div>
              </div>
              <button onClick={() => setViewingSession(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resumo</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                  {viewingSession.desc}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Evolução Clínica (SUD)</h4>
                <div className="flex items-end gap-2 h-24 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  {[8, 6, 4, 2, 0].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full bg-primary-400 dark:bg-primary-600 rounded-t-sm transition-all group-hover:bg-primary-500"
                        style={{ height: `${(val / 10) * 100}%`, minHeight: '4px' }}
                      ></div>
                      <span className="text-[10px] font-bold text-slate-500">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-1">Duração</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-white">55 min</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">Protocolo</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-white">Somático</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline">Ver Notas Completas</button>
            </div>
          </div>
        </div>
      )}

      <AddSUDModal
        isOpen={isSUDModalOpen}
        onClose={() => setIsSUDModalOpen(false)}
        onSave={handleSaveSUD}
        loading={addingSUD}
      />

      {whatsAppTarget && (
        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          patient={whatsAppTarget}
          therapistName={JSON.parse(localStorage.getItem('therapist') || '{}').name || 'Especialista'}
        />
      )}

    </div>
  );
};

export default ClientsList;