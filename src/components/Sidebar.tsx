import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Calendar,
  Wallet,
  Moon,
  Sun,
  Megaphone,
  Eye,
  EyeOff,
  BarChart2,
  MessageSquareHeart,
  Lock,
  Globe
} from 'lucide-react';
import { AppView, NavItem } from 'types';
import UpgradeModal from './Shared/UpgradeModal';
import { useAuth } from '../contexts/AuthContext';
import FeedbackModal from './Shared/FeedbackModal';

interface SidebarProps {
  isMobileOpen: boolean;
  toggleMobile: () => void;
  isDesktopCollapsed: boolean;
  toggleDesktop: () => void;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isPrivacyMode?: boolean;
  togglePrivacy?: () => void;
  onLogout?: () => void;
  hasAccess: (view: AppView) => boolean; // New prop
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  toggleMobile,
  isDesktopCollapsed,
  toggleDesktop,
  currentView,
  onChangeView,
  isDarkMode,
  toggleTheme,
  isPrivacyMode,
  togglePrivacy,
  onLogout,
  hasAccess // Destructure new prop
}) => {

  const { user } = useAuth();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; featureName?: string }>({ isOpen: false });
  // const { hasAccess, plan } = usePlanAccess(); // Removed to avoid circular dependency

  const navItems: NavItem[] = [
    { id: AppView.DASHBOARD, label: 'Painel Geral', icon: LayoutDashboard },
    { id: AppView.AGENDA, label: 'Agenda', icon: Calendar },
    { id: AppView.PATIENTS, label: 'Clientes', icon: Users },
    { id: AppView.THERAPY, label: 'Sessão TeraNexus', icon: BrainCircuit },
    { id: AppView.FINANCIAL, label: 'Financeiro', icon: Wallet },
    { id: AppView.MARKETING, label: 'Marketing & CRM', icon: Megaphone },
    { id: AppView.SITE_BUILDER, label: 'Site Profissional', icon: Globe },
    { id: AppView.REPORTS, label: 'Relatórios', icon: BarChart2 },
    { id: AppView.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  // Determine width classes based on state
  const desktopWidthClass = isDesktopCollapsed ? 'md:w-20' : 'md:w-72';
  const mobileTransformClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userName = user?.user_metadata?.name || 'Terapeuta';
  const userEmail = user?.email || 'email@exemplo.com';

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 
          bg-slate-900 dark:bg-slate-950 text-white shadow-2xl 
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          w-[85vw] max-w-[300px] sm:w-72 border-r border-slate-800 dark:border-slate-900
          md:static md:shadow-none md:transform-none md:h-screen
          ${mobileTransformClass}
          ${desktopWidthClass}
          flex flex-col
        `}
      >
        {/* Header / Logo Area */}
        <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-0 md:justify-center border-b border-slate-800 dark:border-slate-900 relative shrink-0">
          {/* Mobile Close Button */}
          <button
            onClick={toggleMobile}
            className="md:hidden p-2 text-slate-400 hover:text-white active:scale-95 transition-transform"
          >
            <X size={24} />
          </button>

          {/* Logo Content */}
          <div className={`flex items-center gap-3 ${isDesktopCollapsed ? 'md:hidden' : 'flex'}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20">
              <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Tera<span className="text-primary-500 dark:text-secondary-400">Nexus</span>
            </span>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleDesktop}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-full items-center justify-center hover:bg-primary-600 dark:hover:bg-secondary-600 hover:border-primary-500 dark:hover:border-secondary-500 transition-colors text-slate-400 hover:text-white hidden md:flex z-20 shadow-sm"
            aria-label={isDesktopCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isDesktopCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isLocked = !hasAccess(item.id);

            const handleClick = () => {
              if (isLocked) {
                setUpgradeModal({ isOpen: true, featureName: item.label });
              } else {
                onChangeView(item.id);
              }
            };

            return (
              <button
                key={item.id}
                onClick={handleClick}
                className={`
                  w-full flex items-center gap-4 px-3 py-3.5 md:py-3 rounded-xl transition-all duration-200 group
                  touch-manipulation relative
                  ${isActive && !isLocked
                    ? 'bg-primary-600 dark:bg-secondary-600 text-white shadow-lg shadow-primary-600/20 dark:shadow-secondary-600/20'
                    : isLocked
                      ? 'text-slate-500 hover:bg-slate-800/50 dark:hover:bg-slate-900/50 cursor-not-allowed opacity-60'
                      : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white'}
                  ${isDesktopCollapsed ? 'md:justify-center md:px-0' : ''}
                `}
                title={isDesktopCollapsed ? item.label : (isLocked ? `${item.label} (Plano Profissional)` : '')}
              >
                <Icon size={24} className={`shrink-0 ${isActive && !isLocked ? 'text-white' : isLocked ? 'text-slate-500' : 'text-slate-400 group-hover:text-white'} md:w-[22px] md:h-[22px]`} />

                <span className={`
                  whitespace-nowrap font-medium text-base md:text-sm transition-all duration-300 flex-1 text-left
                  ${isDesktopCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'md:w-auto md:opacity-100'}
                `}>
                  {item.label}
                </span>

                {/* Lock icon for restricted items */}
                {isLocked && !isDesktopCollapsed && (
                  <Lock size={14} className="text-slate-500 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / User Profile & Theme Toggle */}
        <div className="p-4 border-t border-slate-800 dark:border-slate-900 shrink-0 space-y-4">

          {/* Feedback Button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              text-primary-400 bg-primary-400/10 hover:bg-primary-400/20 border border-primary-400/20
              ${isDesktopCollapsed ? 'md:justify-center md:px-0' : ''}
            `}
            title="Dar Feedback"
          >
            <MessageSquareHeart size={20} className="shrink-0" />
            {!isDesktopCollapsed && <span className="text-sm font-bold">Avaliar Sistema</span>}
          </button>

          {/* Theme & Privacy Toggle */}
          <div className={`flex items-center ${isDesktopCollapsed ? 'flex-col gap-2' : 'justify-between'} bg-slate-800 dark:bg-slate-900 rounded-lg p-1`}>
            {!isDesktopCollapsed && <span className="text-xs text-slate-400 font-medium px-2">Opções</span>}
            <div className="flex gap-1 items-center">

              {togglePrivacy && (
                <button
                  onClick={togglePrivacy}
                  className={`p-1.5 rounded-md transition-colors ${isPrivacyMode ? 'text-primary-400 bg-slate-700 dark:bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-800'}`}
                  title={isPrivacyMode ? "Modo Privacidade Ativo" : "Ativar Modo Privacidade"}
                >
                  {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors"
                title={isDarkMode ? "Mudar para Claro" : "Mudar para Escuro"}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className={`flex items-center gap-3 ${isDesktopCollapsed ? 'md:justify-center' : ''}`}>
            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-700 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 border border-slate-600 dark:border-slate-700">
              {getInitials(userName)}
            </div>

            <div className={`flex flex-col min-w-0 transition-opacity duration-200 ${isDesktopCollapsed ? 'md:hidden' : 'flex'}`}>
              <span className="text-sm font-medium text-white truncate">{userName}</span>
              <span className="text-xs text-slate-400 truncate">Terapeuta TRG</span>
            </div>

            <button
              onClick={onLogout}
              className={`ml-auto text-slate-500 hover:text-red-400 transition-colors p-2 ${isDesktopCollapsed ? 'md:hidden' : 'block'}`}
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userType="therapist"
        userId={user?.id}
      />

      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false })}
        featureName={upgradeModal.featureName}
      />
    </>
  );
};

export default Sidebar;
