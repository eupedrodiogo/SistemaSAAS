
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
import { supabase } from '../lib/supabase';
import { useTherapistProfile, useUpdateTherapistProfile } from '../features/settings/api/useSettings';
import { ProfileTab } from '../features/settings/components/ProfileTab';
import { ClinicTab } from '../features/settings/components/ClinicTab';
import { NetworkTab } from '../features/settings/components/NetworkTab';
import { FinancialSettingsTab } from '../features/settings/components/FinancialSettingsTab';
import { IntegrationsTab } from '../features/settings/components/IntegrationsTab';
import { ScheduleTab } from '../features/settings/components/ScheduleTab';
import { SecurityTab } from '../features/settings/components/SecurityTab';
import { NotificationsTab } from '../features/settings/components/NotificationsTab';
import { HelpTab } from '../features/settings/components/HelpTab';

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
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

    specialty: 'Geral',
    is_verified: false,
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

  const { data: profileData, isLoading } = useTherapistProfile();
  const updateProfileMutation = useUpdateTherapistProfile();

  // Initialize form data when profileData is loaded
  useEffect(() => {
    if (profileData?.profile) {
      const { user, profile } = profileData;
      setFormData(prev => ({
        ...prev,
        name: profile.name || user.user_metadata.name || prev.name,
        email: user.email || prev.email,
        phone: profile.phone || user.user_metadata.phone || prev.phone,
        photo_url: profile.photo_url || prev.photo_url,
        specialty: profile.specialty || 'Geral',
        bio: profile.bio || '',
        citrg_code: profile.citrg_code || '',
        price: profile.price || '',
        session_duration: profile.session_duration || 50,
        is_verified: profile.is_verified || false,
        specialties: profile.specialties || (profile.specialty ? [profile.specialty] : []),
        certificates: profile.certificates || [],
        is_overflow_source: profile.is_overflow_source || false,
        pixKey: profile.pix_key || profile.pixKey || '',
        pixType: profile.pix_type || profile.pixType || 'cpf',
        invoiceNotes: profile.invoice_notes || profile.invoiceNotes || '',
        clinicName: profile.clinic_name || profile.clinicName || '',
        cnpj: profile.cnpj || '',
        address: profile.address || '',
      }));
    }

    const savedSettings = localStorage.getItem('TRG_SETTINGS');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setFormData(prev => ({ ...prev, ...parsed }));
      if (parsed.availability) {
        setAvailability(parsed.availability);
      }
    }
  }, [profileData]);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(formData);
      
      // Save Preferences to LocalStorage
      localStorage.setItem('TRG_BLOCKED_TIMES', JSON.stringify(blockedTimes));
      localStorage.setItem('TRG_SETTINGS', JSON.stringify({ ...formData, availability }));
      triggerToast('Alterações salvas com sucesso!', 'success');
    } catch (e: any) {
      console.error('Save Error:', e);
      triggerToast(`Erro ao salvar: ${e.message || 'Erro não esperado'}`, 'error');
    }
  };

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
  // Preferências de lembretes automáticos (opt-out: true por padrão)
  const [reminder15minEnabled, setReminder15minEnabled] = useState(true);
  const [reminder24hEnabled, setReminder24hEnabled] = useState(true);

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
          {activeTab === 'profile' && <ProfileTab formData={formData} setFormData={setFormData} triggerToast={triggerToast} availability={availability} />}
          {activeTab === 'clinic' && <ClinicTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'network' && <NetworkTab formData={formData} setFormData={setFormData} triggerToast={triggerToast} />}
          {activeTab === 'financial' && <FinancialSettingsTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'integrations' && <IntegrationsTab integrations={integrations} setIntegrations={setIntegrations} />}
          {activeTab === 'schedule' && <ScheduleTab availability={availability} setAvailability={setAvailability} blockedTimes={blockedTimes} setBlockedTimes={setBlockedTimes} />}
          {activeTab === 'security' && <SecurityTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'notifications' && <NotificationsTab formData={formData} setFormData={setFormData} reminder15minEnabled={reminder15minEnabled} setReminder15minEnabled={setReminder15minEnabled} reminder24hEnabled={reminder24hEnabled} setReminder24hEnabled={setReminder24hEnabled} whatsappTemplate={whatsappTemplate} setWhatsappTemplate={setWhatsappTemplate} showNotification={triggerToast} />}
          {activeTab === 'help' && <HelpTab helpView={helpView} setHelpView={setHelpView} helpSearch={helpSearch} setHelpSearch={setHelpSearch} selectedArticle={selectedArticle} setSelectedArticle={setSelectedArticle} guideSection={guideSection} setGuideSection={setGuideSection} supportForm={supportForm} setSupportForm={setSupportForm} handleSendSupport={handleSendSupport} HELP_ARTICLES={HELP_ARTICLES} SYSTEM_GUIDE={SYSTEM_GUIDE} />}
        </div>
      </div>


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

      {/* Toast Notification (showToast) */}
      {showToast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toastType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800/60 dark:text-green-300' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-800/60 dark:text-red-300'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" /> : <AlertCircle size={24} className="text-red-600 dark:text-red-400" />}
          <span className="font-bold text-sm">{toastMessage}</span>
          <button onClick={() => setShowToast(false)} className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Notification (notification state) */}
      {notification && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800/60 dark:text-green-300' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-800/60 dark:text-red-300'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" /> : <AlertCircle size={24} className="text-red-600 dark:text-red-400" />}
          <span className="font-bold text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}
    </div >
  );
};

export default SettingsView;
