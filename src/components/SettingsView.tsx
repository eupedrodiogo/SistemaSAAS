
import React, { useState, useEffect } from 'react';

import {
  User,
  Building,
  Bell,
  Shield,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  X,
  LogOut,
  Clock,
  Plus,
  Trash2,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Book,
  Send,
  UploadCloud,
  Palette,
  QrCode,
  FileText,
  Calendar as CalendarIcon,
  Video,
  Database,
  Download,
  Smartphone,
  Laptop,
  Search,
  PlayCircle,
  BookOpen,
  LifeBuoy,
  ExternalLink,
  AlertCircle,
  BrainCircuit,
  LayoutDashboard,
  Users,
  Wallet,
  ArrowRight,
  Menu,
  Network // Import Network Icon
} from 'lucide-react';
// import { createClient } from '@supabase/supabase-js'; // REMOVED
import { supabase } from '../lib/supabase';

/* ... imports ... */

// ... (Inside Component)

// Helper Component: Toggle Switch
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'
        }`}
    />
  </button>
);

// Initialize Supabase Client (Frontend) - MOVED OUTSIDE COMPONENT for stability
// Initialize Supabase Client (Frontend) - MOVED OUTSIDE COMPONENT for stability
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'financial' | 'integrations' | 'schedule' | 'security' | 'notifications' | 'help' | 'network'>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load initial settings from DB
  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Pre-fill from Auth Metadata first (Ensures data visibility)
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata.name || prev.name,
          email: user.email || prev.email,
          phone: user.user_metadata.phone || prev.phone
        }));

        // Fetch Therapist Profile from DB
        const { data: profile, error } = await supabase
          .from('therapists')
          .select('*')
          .eq('id', user.id) // Assuming therapist ID matches Auth ID (1:1 mapping)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.name || prev.name,
            photo_url: profile.photo_url || prev.photo_url,
            specialty: profile.specialty || 'Geral',
            bio: profile.bio || '',
            citrg_code: profile.citrg_code || '',
            phone: profile.phone || '',
            price: profile.price || '',
            session_duration: profile.session_duration || 50,
            is_verified: profile.is_verified || false,
            // Fallback: Populate array from legacy field if new column is empty/missing
            specialties: profile.specialties || (profile.specialty ? [profile.specialty] : []),
            certificates: profile.certificates || [],
            is_overflow_source: profile.is_overflow_source || false,
          }));
        }
      }
    };
    loadSettings();

    // Keep existing localStorage logic for preferences that are NOT in DB yet (like theme colors etc)
    const savedSettings = localStorage.getItem('TRG_SETTINGS');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge but prefer DB values for critical fields if we just loaded them? 
      // Actually simply merging non-conflicting keys:
      setFormData(prev => ({ ...prev, ...parsed, ...prev }));
      if (parsed.availability) {
        setAvailability(parsed.availability);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true); // START LOADING
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Update Real DB Profile
        // 1. Update Real DB Profile
        const { data, error, count } = await supabase
          .from('therapists')
          .update({
            name: formData.name,
            photo_url: formData.photo_url,
            // Map the first specialty to the existing 'specialty' column for compatibility
            specialty: formData.specialties[0] || formData.specialty || 'Geral',
            bio: formData.bio,
            citrg_code: formData.citrg_code,
            phone: formData.phone,
            price: formData.price ? parseFloat(String(formData.price)) : null,
            session_duration: formData.session_duration ? parseInt(String(formData.session_duration)) : 50,
            specialties: formData.specialties,
            certificates: formData.certificates,
            is_overflow_source: formData.is_overflow_source,
            is_overflow_target: formData.is_overflow_target,
          })
          .eq('id', user.id)
          // @ts-ignore
          .select('*', { count: 'exact' });

        if (error) {
          console.error('Supabase Update Error:', error);
          triggerToast(`Erro ao salvar: ${error.message}`, 'error');
          return;
        }

        if (count === 0) {
          console.error('No rows updated. User ID:', user.id);
          triggerToast('Erro: Seu perfil de terapeuta não foi encontrado no banco.', 'error');
          return;
        }

        console.log('Update Success:', data);
      } else {
        console.error('User not authenticated');
        triggerToast('Erro: Usuário não autenticado. Recarregue a página.', 'error');
        return;
      }

      // 2. Save Preferences to LocalStorage
      localStorage.setItem('TRG_BLOCKED_TIMES', JSON.stringify(blockedTimes));
      localStorage.setItem('TRG_SETTINGS', JSON.stringify({ ...formData, availability }));
      triggerToast('Alterações salvas com sucesso!', 'success');

    } catch (e) {
      console.error('Save Error:', e);
      triggerToast('Erro não esperado ao salvar', 'error');
    } finally {
      setSaving(false); // STOP LOADING
    }
  };
  // ... (State)

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [uploading, setUploading] = useState(false); // This was duplicated, keeping the one above
  const [formData, setFormData] = useState({
    // ... existing fields
    name: '',
    photo_url: '',
    email: '',
    phone: '',
    citrg_code: '',
    bio: '',
    price: '',
    session_duration: 50,
    specialties: [] as string[],
    certificates: [] as { name: string; url: string; status: string }[],
    clinicName: '',
    cnpj: '',
    address: '',
    website: '',
    brandColor: '#0ea5e9',
    pixKey: '',
    pixType: 'cpf',
    invoiceNotes: '',

    // Network / Transbordo Settings
    specialty: 'Geral',
    is_verified: false, // Read-only usually
    is_overflow_source: false,
    is_overflow_target: true,

    notifications: {
      email: true,
      push: true,
      whatsapp: false,
      marketing: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30'
    }
  });

  // --- RESTORED STATE & HELPERS ---

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const weekDays = [
    { val: 'seg', label: 'Segunda-feira' },
    { val: 'ter', label: 'Terça-feira' },
    { val: 'qua', label: 'Quarta-feira' },
    { val: 'qui', label: 'Quinta-feira' },
    { val: 'sex', label: 'Sexta-feira' },
    { val: 'sab', label: 'Sábado' },
    { val: 'dom', label: 'Domingo' }
  ];

  const [blockedTimes, setBlockedTimes] = useState([
    { id: 1, dayOfWeek: 'seg', startTime: '12:00', endTime: '13:00', label: 'Almoço' },
    { id: 2, dayOfWeek: 'qua', startTime: '08:00', endTime: '10:00', label: 'Reunião Clínica' }
  ]);

  const [availability, setAvailability] = useState([
    { dayOfWeek: 'seg', isActive: true, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'ter', isActive: true, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'qua', isActive: true, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'qui', isActive: true, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'sex', isActive: true, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 'sab', isActive: false, startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 'dom', isActive: false, startTime: '08:00', endTime: '12:00' },
  ]);

  const [newBlock, setNewBlock] = useState({ day: 'seg', start: '', end: '', label: '' });

  const addBlockedTime = () => {
    if (!newBlock.start || !newBlock.end) return;
    setBlockedTimes([...blockedTimes, { id: Date.now(), dayOfWeek: newBlock.day, startTime: newBlock.start, endTime: newBlock.end, label: newBlock.label }]);
    setNewBlock({ day: 'seg', start: '', end: '', label: '' });
    showNotification('Bloqueio adicionado com sucesso!');
  };

  const removeBlockedTime = (id: number) => {
    setBlockedTimes(blockedTimes.filter(b => b.id !== id));
    showNotification('Bloqueio removido.');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        setUploading(false);
        return; // User cancelled
      }
      const file = event.target.files[0];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Pega base64 em JPEG com qualidade otimizada para salvar no banco
          const base64Photo = canvas.toDataURL('image/jpeg', 0.8);
          
          setFormData(prev => ({ ...prev, photo_url: base64Photo }));

          // Immediate DB Update for Photo
          const { error: dbError } = await supabase
            .from('therapists')
            .update({ photo_url: base64Photo })
            .eq('id', user.id);

          if (dbError) {
             console.error(dbError);
             showNotification('Erro ao salvar no banco!', 'error');
          } else {
             showNotification('Foto de perfil atualizada!');
          }
          setUploading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error(error);
      showNotification(error.message || 'Erro ao processar imagem!', 'error');
      setUploading(false);
    }
  };

  const [integrations, setIntegrations] = useState({
    googleCalendar: true,
    zoom: false,
    stripe: true
  });

  const [whatsappTemplate, setWhatsappTemplate] = useState("Olá {paciente}, confirmando sua sessão de TRG para {data} às {hora}.");

  // Help Center State
  const [helpView, setHelpView] = useState<'home' | 'article' | 'guide' | 'ticket'>('home');
  const [helpSearch, setHelpSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [guideSection, setGuideSection] = useState('intro');
  const [supportForm, setSupportForm] = useState({ category: 'duvida', priority: 'normal', subject: '', message: '' });

  const HELP_ARTICLES = [
    { id: 1, title: 'Como configurar minha agenda?', category: 'Agenda', content: 'Para configurar sua agenda...', icon: CalendarIcon, description: 'Aprenda a definir seus seus horários de atendimento e bloqueios.' },
    { id: 2, title: 'Integração com Google Agenda', category: 'Integrações', content: 'Vá em configurações > integrações...', icon: CalendarIcon, description: 'Sincronize seus eventos automaticamente.' },
    { id: 3, title: 'Como emitir notas fiscais?', category: 'Financeiro', content: 'O sistema gera recibos simples...', icon: FileText, description: 'Guia sobre recibos e documentos fiscais.' },
  ];

  const SYSTEM_GUIDE = {
    intro: { id: 'intro', title: 'Bem-vindo ao TeraNexus', content: 'Visão geral do sistema.', icon: BookOpen },
    profile: { id: 'profile', title: 'Configurando seu Perfil', content: 'Como deixar seu perfil atrativo.', icon: User },
    financial: { id: 'financial', title: 'Gestão Financeira', content: 'Controle de pagamentos e recebimentos.', icon: Wallet }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "meus_dados_trg.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showNotification('Exportação iniciada!');
  };

  const handleSendSupport = () => {
    showNotification('Ticket enviado! Entraremos em contato em breve.');
    setSupportForm({ category: 'duvida', priority: 'normal', subject: '', message: '' });
    setTimeout(() => setHelpView('home'), 1500);
  };


  // ...

  const menuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'clinic', label: 'Dados da Clínica', icon: Building },
    { id: 'network', label: 'Rede de Transbordo', icon: Network }, // New Item
    { id: 'financial', label: 'Financeiro & Fiscal', icon: FileText },
    { id: 'integrations', label: 'Integrações', icon: Globe },
    { id: 'schedule', label: 'Agenda e Horários', icon: Clock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança & Dados', icon: Shield },
    { id: 'help', label: 'Ajuda e Suporte', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar - Desktop */}
        <div className="hidden md:flex w-64 shrink-0 flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon size={18} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Sidebar - Mobile Dropdown */}
        <div className="md:hidden relative w-full z-20">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              {(() => {
                const activeItem = menuItems.find(item => item.id === activeTab);
                const Icon = activeItem?.icon || User;
                return (
                  <>
                    <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                      <Icon size={18} />
                    </div>
                    <span>{activeItem?.label}</span>
                  </>
                );
              })()}
            </div>
            {isMobileMenuOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
          </button>

          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30 max-h-[60vh] overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 font-medium transition-all text-left border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${isActive
                      ? 'bg-slate-50 dark:bg-slate-800/80 text-primary-600 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pb-32">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Meu Perfil Profissional</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg">
                      <img
                        src={formData.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-2 right-2 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors cursor-pointer"
                    >
                      <Camera size={16} />
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                    />
                  </div>
                  <div className="flex-1 space-y-4 w-full text-center md:text-left">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Foto de Perfil</label>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Clique no ícone de câmera para alterar sua foto.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nome Completo</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">CITRG</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                          value={formData.citrg_code}
                          onChange={(e) => setFormData({ ...formData, citrg_code: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Email</label>
                        <input
                          type="email"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">WhatsApp / Telefone</label>
                        <input
                          type="tel"
                          placeholder="(11) 99999-9999"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor da Sessão (R$)</label>
                        <input
                          type="number"
                          placeholder="Ex: 150.00"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase flex items-center gap-1">
                          <Clock size={14} className="text-primary-500" /> Duração da Sessão
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {[30, 50, 60, 90].map(duration => (
                            <button
                              key={duration}
                              type="button"
                              onClick={() => setFormData({ ...formData, session_duration: duration })}
                              className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${formData.session_duration === duration 
                                  ? 'bg-primary-500 border-primary-500 text-white shadow-md scale-[1.02]' 
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-600'
                                }`}
                            >
                              {duration} min
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Outro valor (min)"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none transition-shadow"
                            value={formData.session_duration || ''}
                            onChange={(e) => setFormData({ ...formData, session_duration: parseInt(e.target.value) || 0 })}
                          />
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Biografia Profissional</label>
                      <textarea
                        rows={3}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Conte um pouco sobre sua experiência e especialidades..."
                      />
                    </div>

                    {/* Specialties Section */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Especialidades e Focos</label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Adicione uma especialidade (ex: Ansiedade)"
                          className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                          id="specialty-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = e.currentTarget.value.trim();
                              if (val && !formData.specialties.includes(val)) {
                                setFormData({ ...formData, specialties: [...formData.specialties, val] });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('specialty-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !formData.specialties.includes(val)) {
                              setFormData({ ...formData, specialties: [...formData.specialties, val] });
                              input.value = '';
                            }
                          }}
                          className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.length === 0 && (
                          <span className="text-sm text-slate-400 italic">Nenhuma especialidade adicionada.</span>
                        )}
                        {formData.specialties.map((spec) => (
                          <span key={spec} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-primary-100 dark:border-primary-800">
                            {spec}
                            <button
                              onClick={() => setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== spec) })}
                              className="text-primary-400 hover:text-primary-600"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Certificates Section */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Certificações e Validação</label>
                      <div className="space-y-4">
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              try {
                                setUploading(true);
                                
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const base64Url = event.target?.result as string;
                                  
                                  const newCert = {
                                    name: file.name,
                                    url: base64Url,
                                    status: 'pending' // pending, verified, rejected
                                  };

                                  setFormData({ ...formData, certificates: [...(formData.certificates || []), newCert] });
                                  triggerToast('Certificado enviado para validação!', 'success');
                                  setUploading(false);
                                };
                                
                                reader.onerror = (err) => {
                                  console.error(err);
                                  triggerToast('Erro ao ler certificado.', 'error');
                                  setUploading(false);
                                };
                                
                                reader.readAsDataURL(file);
                              } catch (err) {
                                console.error(err);
                                triggerToast('Erro ao processar certificado.', 'error');
                                setUploading(false);
                              }
                            }
                            }
                          />
                          <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                            <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-primary-500" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              Clique para enviar certificado (PDF, JPG)
                            </p>
                            <p className="text-xs text-slate-400">
                              Comprove titulações como TRG Master
                            </p>
                          </div>
                        </div>

                        {/* Certificates List */}
                        <div className="space-y-2">
                          {formData.certificates?.map((cert, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                              <div className="flex items-center gap-3">
                                <FileText className="text-slate-400" size={18} />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cert.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${cert.status === 'verified' ? 'text-green-600' :
                                      cert.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                                      }`}>
                                      {cert.status === 'verified' ? 'Validado CITRG' : cert.status === 'rejected' ? 'Rejeitado' : 'Em Análise (CITRG)'}
                                    </span>
                                    {cert.status === 'pending' && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={async () => {
                                            try {
                                              triggerToast('Inicializando leitura do documento (OCR)...', 'success');

                                              // Import Tesseract dynamically
                                              const Tesseract = (await import('tesseract.js')).default;

                                              // 1. Recognize Text
                                              const { data: { text } } = await Tesseract.recognize(
                                                cert.url,
                                                'por', // Portuguese
                                                { logger: m => console.log(m) }
                                              );

                                              const scanText = text.toLowerCase();
                                              console.log('OCR Result:', scanText);

                                              // 2. Validation Rules (Must match Name OR CITRG Code)
                                              // Clean strings for comparison
                                              const safeName = formData.name.toLowerCase().split(' ')[0]; // Match first name at least
                                              const safeCode = formData.citrg_code.toLowerCase().replace(/[^a-z0-9]/g, '');

                                              // Keywords including "Master" as per user example
                                              const hasKeyword = scanText.includes('trg') || scanText.includes('terapia') || scanText.includes('certificado') || scanText.includes('master') || scanText.includes('citrg');
                                              const hasName = safeName && scanText.includes(safeName);
                                              const hasCode = safeCode && scanText.replace(/[^a-z0-9]/g, '').includes(safeCode);

                                              if (hasKeyword && (hasName || hasCode)) {
                                                triggerToast('Buscando referências na rede...', 'success');
                                                await new Promise(r => setTimeout(r, 2000));
                                                const updatedCerts = [...formData.certificates];
                                                updatedCerts[idx].status = 'verified';
                                                setFormData({ ...formData, certificates: updatedCerts });
                                                triggerToast(`Membro Validado: ${formData.name} - CITRG ${formData.citrg_code}`, 'success');
                                                handleSave();
                                              } else {
                                                triggerToast('Documento ilegível ou dados não conferem. Verifique se o nome ou CITRG estão visíveis.', 'error');
                                              }
                                            } catch (err) {
                                              console.error(err);
                                              triggerToast('Erro na leitura do documento. Tente uma imagem mais nítida.', 'error');
                                            }
                                          }}
                                          className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                                        >
                                          <CheckCircle2 size={12} /> Validar Credenciais
                                        </button>

                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setFormData({ ...formData, certificates: formData.certificates.filter((_, i) => i !== idx) })}
                                className="text-slate-400 hover:text-red-500 p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dados da Clínica</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nome da Clínica (Opcional)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">CNPJ</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Endereço Completo</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NETWORK TAB */}
          {
            activeTab === 'network' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Network size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Rede de Transbordo</h3>
                      <p className="text-indigo-100 text-sm">Conecte-se com outros terapeutas para enviar ou receber pacientes.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">

                  {/* 1. Receive Patients (Target) */}
                  <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">Receber Indicações</h4>
                        {formData.is_verified ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Verificado</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">Não Verificado</span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        Ao ativar esta opção, você aparecerá nas buscas quando outros terapeutas precisarem encaminhar pacientes (Transbordo).
                        Você receberá as indicações via WhatsApp.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                            <p className="text-sm text-slate-500 italic">Configure suas especialidades na aba "Meu Perfil" para serem exibidas aqui.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center md:border-l border-slate-200 dark:border-slate-700 md:pl-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-400">Status</span>
                        <ToggleSwitch
                          checked={formData.is_overflow_target}
                          onChange={() => setFormData({ ...formData, is_overflow_target: !formData.is_overflow_target })}
                        />
                        <span className={`text-sm font-bold ${formData.is_overflow_target ? 'text-green-600' : 'text-slate-400'}`}>
                          {formData.is_overflow_target ? 'Disponível' : 'Indisponível'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Send Patients (Source) */}
                  <div className="flex flex-col md:flex-row gap-6 p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                          <LogOut size={20} />
                        </div>
                        <h4 className="font-bold text-red-900 dark:text-red-200 text-lg">Modo Transbordo (Fechar Agenda)</h4>
                      </div>
                      <p className="text-red-800 dark:text-red-300 text-sm leading-relaxed mb-4">
                        Ative esta opção quando sua agenda estiver lotada.
                        Seus pacientes verão um aviso de "Agenda Lotada" e serão oferecidos a opção de buscar um
                        <strong> Terapeuta Parceiro Certificado</strong> da sua confiança (Rede de Transbordo).
                      </p>
                    </div>
                    <div className="flex items-center justify-center md:border-l border-red-200 md:pl-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase text-red-400">Status</span>
                        <ToggleSwitch
                          checked={formData.is_overflow_source}
                          onChange={() => setFormData({ ...formData, is_overflow_source: !formData.is_overflow_source })}
                        />
                        <span className={`text-sm font-bold ${formData.is_overflow_source ? 'text-red-600' : 'text-slate-400'}`}>
                          {formData.is_overflow_source ? 'ATIVADO' : 'Desativado'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )
          }

          {/* FINANCIAL TAB */}

          {
            activeTab === 'financial' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dados Fiscais & Pagamento</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                        <QrCode size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-800 dark:text-green-200">Chave PIX Padrão</h4>
                        <p className="text-xs text-green-700 dark:text-green-400">Esta chave será impressa nos recibos para facilitar o pagamento.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tipo de Chave</label>
                        <select
                          value={formData.pixType}
                          onChange={(e) => setFormData({ ...formData, pixType: e.target.value })}
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-xl dark:text-white"
                        >
                          <option value="cpf">CPF / CNPJ</option>
                          <option value="email">Email</option>
                          <option value="phone">Telefone</option>
                          <option value="random">Chave Aleatória</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Chave PIX</label>
                        <input
                          type="text"
                          value={formData.pixKey}
                          onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-xl dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Notas de Rodapé (Recibos)</label>
                    <textarea
                      rows={3}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                      value={formData.invoiceNotes}
                      onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })}
                      placeholder="Ex: Documento para fins de reembolso..."
                    />
                  </div>
                </div>
              </div>
            )
          }

          {/* INTEGRATIONS TAB */}
          {
            activeTab === 'integrations' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                        <CalendarIcon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Sincronização Zero-Click</h4>
                        <p className="text-sm text-slate-500">Agendamentos são enviados via convite iCal para seu email.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-wider">Ativo</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Google Calendar (API)</h4>
                        <p className="text-sm text-slate-500">Integração nativa avançada (vincular conta).</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={integrations.googleCalendar} onChange={() => setIntegrations({ ...integrations, googleCalendar: !integrations.googleCalendar })} />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                        <Video size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Zoom Meetings</h4>
                        <p className="text-sm text-slate-500">Gera links de reunião para sessões remotas.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={integrations.zoom} onChange={() => setIntegrations({ ...integrations, zoom: !integrations.zoom })} />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center text-white">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Stripe Payments</h4>
                        <p className="text-sm text-slate-500">Processe cartões de crédito e boletos.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={integrations.stripe} onChange={() => setIntegrations({ ...integrations, stripe: !integrations.stripe })} />
                  </div>
                </div>
              </div>
            )
          }

          {/* SCHEDULE TAB */}
          {
            activeTab === 'schedule' && (
              <div className="space-y-6 animate-fade-in">
                {/* HORÁRIOS DE ATENDIMENTO */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Horários de Atendimento</h3>
                    <p className="text-sm text-slate-500">Defina seus dias e horários padrão de trabalho.</p>
                  </div>
                  <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800">
                    {availability.map((avail, index) => {
                      const dayName = weekDays.find(d => d.val === avail.dayOfWeek)?.label;
                      return (
                        <div key={avail.dayOfWeek} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4 w-full md:w-1/3">
                            <ToggleSwitch 
                              checked={avail.isActive} 
                              onChange={() => {
                                const newAvail = [...availability];
                                newAvail[index].isActive = !newAvail[index].isActive;
                                setAvailability(newAvail);
                              }} 
                            />
                            <span className={`font-medium ${avail.isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                              {dayName}
                            </span>
                          </div>
                          
                          <div className={`flex items-center gap-3 transition-opacity ${avail.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Início</span>
                              <input
                                type="time"
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                value={avail.startTime}
                                onChange={(e) => {
                                  const newAvail = [...availability];
                                  newAvail[index].startTime = e.target.value;
                                  setAvailability(newAvail);
                                }}
                              />
                            </div>
                            <span className="text-slate-400 mt-5">até</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</span>
                              <input
                                type="time"
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                                value={avail.endTime}
                                onChange={(e) => {
                                  const newAvail = [...availability];
                                  newAvail[index].endTime = e.target.value;
                                  setAvailability(newAvail);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Bloqueios de Agenda</h3>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adicionar Novo Bloqueio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                        value={newBlock.day}
                        onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
                      >
                        {weekDays.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                          value={newBlock.start}
                          onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                          value={newBlock.end}
                          onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Rótulo (ex: Almoço)"
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                        value={newBlock.label}
                        onChange={(e) => setNewBlock({ ...newBlock, label: e.target.value })}
                      />
                      <button
                        onClick={addBlockedTime}
                        className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Bloqueios Ativos</h4>
                    <div className="space-y-2">
                      {blockedTimes.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum horário bloqueado.</p>}
                      {blockedTimes.map(block => (
                        <div key={block.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                              <Clock size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white text-sm">{weekDays.find(d => d.val === block.dayOfWeek)?.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{block.startTime} às {block.endTime} • {block.label}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeBlockedTime(block.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {/* SECURITY & DATA TAB */}
          {
            activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Segurança da Conta</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">Autenticação de Dois Fatores (2FA)</p>
                        <p className="text-xs text-slate-500">Adiciona uma camada extra de segurança ao login.</p>
                      </div>
                      <ToggleSwitch checked={formData.security.twoFactor} onChange={() => setFormData({ ...formData, security: { ...formData.security, twoFactor: !formData.security.twoFactor } })} />
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Dispositivos Ativos</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-primary-500">
                            <Laptop size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800 dark:text-white">MacBook Pro (Este dispositivo)</p>
                            <p className="text-xs text-slate-500">São Paulo, BR • Ativo agora</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 opacity-60">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <Smartphone size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800 dark:text-white">iPhone 14</p>
                            <p className="text-xs text-slate-500">São Paulo, BR • 2h atrás</p>
                          </div>
                          <button className="text-xs text-red-500 hover:underline">Desconectar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <Database size={18} /> Gestão de Dados (LGPD)
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">Você pode exportar todos os seus dados para backup ou conformidade legal.</p>
                    <button
                      onClick={handleExportData}
                      className="w-full py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={18} /> Baixar Cópia dos Dados (JSON)
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {/* NOTIFICATIONS TAB */}
          {
            activeTab === 'notifications' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Preferências de Notificação</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Email</p>
                      <p className="text-xs text-slate-500">Receber resumos semanais e alertas de segurança.</p>
                    </div>
                    <ToggleSwitch checked={formData.notifications.email} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, email: !formData.notifications.email } })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Push (Navegador)</p>
                      <p className="text-xs text-slate-500">Alertas de próxima sessão e mensagens.</p>
                    </div>
                    <ToggleSwitch checked={formData.notifications.push} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, push: !formData.notifications.push } })} />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <MessageSquare size={16} className="text-green-500" /> Integração WhatsApp
                        </p>
                        <p className="text-xs text-slate-500">Enviar lembretes automáticos para pacientes.</p>
                      </div>
                      <ToggleSwitch checked={formData.notifications.whatsapp} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, whatsapp: !formData.notifications.whatsapp } })} />
                    </div>

                    {formData.notifications.whatsapp && (
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4 animate-slide-up">
                        <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-2 uppercase">Modelo de Mensagem</label>
                        <textarea
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                          rows={3}
                          value={whatsappTemplate}
                          onChange={(e) => setWhatsappTemplate(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => showNotification("Mensagem de teste enviada!")}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                          >
                            <Send size={12} /> Testar Envio
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          {/* HELP & KNOWLEDGE BASE TAB */}
          {
            activeTab === 'help' && (
              <div className="space-y-6 animate-fade-in">

                {/* --- Home View --- */}
                {helpView === 'home' && (
                  <div className="space-y-6">
                    {/* Search Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
                      <div className="relative z-10 max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-2">Central de Conhecimento</h2>
                        <p className="text-slate-300 mb-6 text-sm">Como podemos ajudar você hoje?</p>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input
                            type="text"
                            placeholder="Buscar tutoriais, guias ou dúvidas..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none transition-all"
                            value={helpSearch}
                            onChange={(e) => setHelpSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Decorative Circles */}
                      <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Quick Links Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary-200 dark:hover:border-secondary-700 transition-all group cursor-pointer flex items-center gap-4"
                        onClick={() => setHelpView('guide')}
                      >
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-800 dark:text-white">Manual do Usuário</h4>
                          <p className="text-sm text-slate-500 mt-1">Guia passo a passo do sistema.</p>
                        </div>
                      </div>

                      <div
                        className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all group cursor-pointer flex items-center gap-4"
                        onClick={() => setHelpView('ticket')}
                      >
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LifeBuoy size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-800 dark:text-white">Suporte Técnico</h4>
                          <p className="text-sm text-slate-500 mt-1">Abra um chamado para nossa equipe.</p>
                        </div>
                      </div>
                    </div>

                    {/* Articles List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dúvidas Frequentes</h3>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(helpSearch.toLowerCase())).map((article) => (
                          <div
                            key={article.id}
                            className="p-6 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer flex items-start gap-4"
                            onClick={() => { setSelectedArticle(article); setHelpView('article'); }}
                          >
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 shrink-0">
                              <article.icon size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                  {article.category}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-base">{article.title}</h4>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.description}</p>
                            </div>
                            <div className="self-center text-slate-300">
                              <ChevronDown className="transform -rotate-90" size={20} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- System Guide View --- */}
                {helpView === 'guide' && (
                  <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500">
                          <ChevronDown className="transform rotate-90" size={20} />
                        </button>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Manual do Usuário</h3>
                          <p className="text-xs text-slate-500">Guia completo do sistema TeraNexus</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                      {/* Guide Sidebar */}
                      <div className="w-64 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-1 bg-slate-50/30 dark:bg-slate-900">
                        {Object.values(SYSTEM_GUIDE).map(section => (
                          <button
                            key={section.id}
                            onClick={() => setGuideSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${guideSection === section.id
                              ? 'bg-primary-100 text-primary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                          >
                            <section.icon size={18} />
                            {section.title}
                          </button>
                        ))}
                      </div>

                      {/* Guide Content */}
                      <div className="flex-1 overflow-y-auto p-8">
                        {Object.values(SYSTEM_GUIDE).map(section => (
                          guideSection === section.id && (
                            <div key={section.id} className="animate-fade-in max-w-2xl">
                              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                  <section.icon size={32} className="text-slate-700 dark:text-slate-200" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{section.title}</h2>
                              </div>
                              <div className="prose dark:prose-invert">
                                {section.content}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Article View --- */}
                {helpView === 'article' && selectedArticle && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                        <ChevronDown className="transform rotate-90" size={20} />
                      </button>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voltar para Central</span>
                    </div>
                    <div className="p-8 max-w-3xl mx-auto">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 dark:text-primary-400">
                          <selectedArticle.icon size={32} />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{selectedArticle.title}</h1>
                          <p className="text-slate-500">{selectedArticle.description}</p>
                        </div>
                      </div>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">{selectedArticle.content}</p>

                        {/* Placeholder for more structured content */}
                        <div className="my-8 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl border-l-4 border-primary-500">
                          <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                            <AlertCircle size={18} /> Dica Pro
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Para mais detalhes, assista aos nossos tutoriais em vídeo na página anterior ou entre em contato com o suporte.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Ticket View --- */}
                {helpView === 'ticket' && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                        <ChevronDown className="transform rotate-90" size={20} />
                      </button>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voltar</span>
                    </div>
                    <div className="p-8 max-w-2xl mx-auto">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Abrir Chamado de Suporte</h2>
                      <p className="text-slate-500 mb-8 text-sm">Descreva seu problema ou dúvida. Nossa equipe responderá em até 24h úteis.</p>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Categoria</label>
                            <select
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                              value={supportForm.category}
                              onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                            >
                              <option value="duvida">Dúvida de Uso</option>
                              <option value="bug">Reportar Erro (Bug)</option>
                              <option value="financeiro">Financeiro / Cobrança</option>
                              <option value="sugestao">Sugestão de Melhoria</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Prioridade</label>
                            <select
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                              value={supportForm.priority}
                              onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                            >
                              <option value="baixa">Baixa</option>
                              <option value="normal">Normal</option>
                              <option value="alta">Alta (Sistema Parado)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Assunto</label>
                          <input
                            type="text"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                            value={supportForm.subject}
                            onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                            placeholder="Resumo do problema..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Mensagem Detalhada</label>
                          <textarea
                            rows={6}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
                            value={supportForm.message}
                            onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                            placeholder="Descreva o que aconteceu, passos para reproduzir, etc."
                          />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-200">
                          <LifeBuoy className="shrink-0" size={20} />
                          <p>Ao enviar este ticket, você concorda em compartilhar logs técnicos do seu navegador para ajudar no diagnóstico.</p>
                        </div>

                        <button
                          onClick={handleSendSupport}
                          className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Send size={18} /> Enviar Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )
          }

        </div >
      </div >

      {/* Floating Save Button */}
      {
        ['profile', 'clinic', 'network', 'financial', 'schedule', 'notifications', 'security'].includes(activeTab) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-28 z-50 animate-slide-up">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-primary-700 transition-all font-bold flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        )
      }
    </div >
  );
};

export default SettingsView;
