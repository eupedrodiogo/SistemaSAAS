import React from 'react';
import { ArrowLeft, Sparkles, Minimize2, Maximize2, HelpCircle, Power, ChevronDown, Play } from 'lucide-react';
import { SessionTimer } from '../../../components/Session/SessionTimer';

interface SessionHeaderProps {
  handleStartSession: () => void;
  handleEndSession: () => void;
  selectedPatientId: string;
  handleManualPatientSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  patients: any[];
  isSessionStarted: boolean;
  aiSuggestions: string[];
  timer: number;
  isTimerRunning: boolean;
  toggleTimer: () => void;
  sessionNumber: number;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setShowOnboardingModal: (show: boolean) => void;
  setShowAiModal: (show: boolean) => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  handleStartSession,
  handleEndSession,
  selectedPatientId,
  handleManualPatientSelect,
  patients,
  isSessionStarted,
  aiSuggestions,
  timer,
  isTimerRunning,
  toggleTimer,
  sessionNumber,
  isFullscreen,
  toggleFullscreen,
  setShowOnboardingModal,
  setShowAiModal
}) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 flex items-center justify-between shadow-sm z-30 shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-4">
        <button
          onClick={handleEndSession}
          title="Sair da Sessão (Modo Foco)"
          className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors shrink-0"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
            <span className="hidden xs:inline">Sessão TeraNexus</span>
            <span className="xs:hidden">Sessão</span>
            <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[9px] sm:text-[10px] rounded-full uppercase tracking-wider font-extrabold border border-primary-200 dark:border-primary-800">TRG</span>
          </h1>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

          <div className="relative group min-w-[130px] xs:min-w-[160px] sm:min-w-[200px] max-w-[150px] xs:max-w-[200px] sm:max-w-none">
            <select
              value={selectedPatientId}
              onChange={handleManualPatientSelect}
              className="w-full appearance-none bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 outline-none cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <option value="" disabled>Selecione o Cliente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors sm:w-4 sm:h-4" />
          </div>

          {isSessionStarted && (
            <div className="hidden lg:flex items-center gap-1.5 ml-2 text-[10px] sm:text-[11px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm transition-all shrink-0">
               <Sparkles size={12} className={aiSuggestions.length === 0 ? "animate-pulse" : ""} />
               <span className="truncate max-w-[180px] xl:max-w-none">{aiSuggestions.length > 0 ? aiSuggestions[aiSuggestions.length - 1] : "Nexus AI ativo"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        <div className={`transition-opacity duration-300 ${!isSessionStarted ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <SessionTimer
            seconds={timer}
            isActive={isTimerRunning}
            onToggle={toggleTimer}
            sessionNumber={sessionNumber}
          />
        </div>

        <div className="hidden xs:block h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2 shrink-0"></div>

        <button
          onClick={toggleFullscreen}
          className="p-2 sm:px-3 rounded-xl transition-all font-bold flex items-center gap-2 text-sm shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia (Imersão)"}
        >
          {isFullscreen ? <Minimize2 size={18} className="w-[18px] h-[18px]" /> : <Maximize2 size={18} className="w-[18px] h-[18px]" />}
          <span className="hidden lg:inline">{isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}</span>
        </button>

        <button
          onClick={() => setShowOnboardingModal(true)}
          className="p-2 sm:px-3 rounded-xl transition-all font-bold flex items-center gap-2 text-sm shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
          title="Guia da Sessão (Ajuda)"
        >
          <HelpCircle size={18} className="w-[18px] h-[18px]" />
          <span className="hidden lg:inline">Ajuda</span>
        </button>

        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all font-bold text-sm shrink-0"
        >
          <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-[18px] h-[18px] rounded" /> <span className="hidden md:inline">Nexus AI</span>
        </button>

        {isSessionStarted && (
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-900/20 transition-all font-bold text-sm shrink-0 animate-in fade-in zoom-in duration-300"
            title="Finalizar Sessão e Voltar ao Dashboard"
          >
            <Power size={18} className="w-[18px] h-[18px]" /> <span className="hidden md:inline">Finalizar Sessão</span>
          </button>
        )}
      </div>
    </header>
  );
};
