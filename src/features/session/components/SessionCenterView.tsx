import React, { useRef, useEffect } from 'react';
import { SessionNotes } from '../../../components/Session/SessionNotes';
import { ChronologicalPhase } from '../../../components/Session/ChronologicalPhase';
import { StandardPhase } from '../../../components/Session/StandardPhase';
import { ProtocolPhase } from '../../../components/Session/ProtocolPhases';
import { PanelLeftClose, PanelLeftOpen, VideoOff, Video as VideoIcon, Play, FileText, ChevronDown } from 'lucide-react';
import { ClientIntakeData } from 'types';

interface SessionCenterViewProps {
  phase: string;
  phases: ProtocolPhase[];
  isFasesOpen: boolean;
  setIsFasesOpen: (v: boolean) => void;
  intakeData: ClientIntakeData | null;
  observation: string;
  setObservation: (v: string) => void;
  selectedAgeRange: string;
  handleAgeRangeChange: (r: string) => void;
  AGE_RANGES: string[];
  sessionData: any;
  isSessionStarted: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoActive: boolean;
  startCamera: () => void;
  stopCamera: () => void;
  toggleVideo: () => void;
  toggleMic: () => void;
  isMicMuted: boolean;
  handleStartSession: () => void;
  patients: any[];
  selectedPatientId: string;
  handleManualPatientSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SessionCenterView: React.FC<SessionCenterViewProps> = ({
  phase,
  phases,
  isFasesOpen,
  setIsFasesOpen,
  intakeData,
  observation,
  setObservation,
  selectedAgeRange,
  handleAgeRangeChange,
  AGE_RANGES,
  sessionData,
  isSessionStarted,
  localStream,
  remoteStream,
  isVideoActive,
  startCamera,
  stopCamera,
  toggleVideo,
  toggleMic,
  isMicMuted,
  handleStartSession,
  patients,
  selectedPatientId,
  handleManualPatientSelect
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !localStream) return;
    if (el.srcObject !== localStream) {
      el.srcObject = localStream;
      el.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el || !remoteStream) return;
    if (el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
      el.play().catch(() => {});
    }
  }, [remoteStream]);

  const renderPhaseContent = () => {
    switch (phase) {
      case 'anamnese':
        return <SessionNotes intakeData={intakeData} observation={observation} onObservationChange={setObservation} />;

      case 'cronologico':
        return (
          <ChronologicalPhase
            selectedRange={selectedAgeRange}
            onRangeChange={handleAgeRangeChange}
            ranges={AGE_RANGES}
            mentalHistory={sessionData.mentalHistory || {}}
            physicalHistory={sessionData.physicalHistory || {}}
          />
        );

      default:
        return (
          <div className="p-0 sm:p-3 h-full animate-fade-in flex flex-col">
            {phase === 'somatico' && (
              <StandardPhase mentalHistory={sessionData.somaticMentalHistory || []} physicalHistory={sessionData.somaticPhysicalHistory || []} type="distress" />
            )}
            {phase === 'tematico' && (
              <StandardPhase mentalHistory={sessionData.thematicMentalHistory || []} physicalHistory={sessionData.thematicPhysicalHistory || []} type="distress" />
            )}
            {phase === 'futuro' && (
              <StandardPhase mentalHistory={sessionData.futureMentalHistory || []} physicalHistory={sessionData.futurePhysicalHistory || []} type="distress" />
            )}
            {phase === 'potencializacao' && (
              <StandardPhase mentalHistory={sessionData.potentializationMentalHistory || []} physicalHistory={sessionData.potentializationPhysicalHistory || []} type="positive" />
            )}
            {!['somatico', 'tematico', 'futuro', 'potencializacao'].includes(phase) && (
              <StandardPhase mentalHistory={[]} physicalHistory={[]} type="distress" />
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-0 lg:gap-3 relative">
      <button
        onClick={() => setIsFasesOpen(!isFasesOpen)}
        className="hidden lg:flex absolute top-1/2 -left-6 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-md text-slate-500 hover:text-indigo-600 transition-colors"
        title={isFasesOpen ? "Recolher Fases" : "Expandir Fases"}
      >
        {isFasesOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      <div className={`transition-all duration-500 ${isSessionStarted ? 'h-32 sm:h-48 lg:h-64 mb-3' : 'h-[60vh]'} shrink-0 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/50 shadow-inner group`}>
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <VideoOff size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium">{isSessionStarted ? 'Aguardando cliente conectar...' : 'Câmera desativada'}</p>
          </div>
        )}

        {!isSessionStarted && (
          <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg flex flex-col items-center justify-center p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden m-auto animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-slate-950/80 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 flex items-center justify-center shadow-lg border border-slate-700/50">
                  <VideoIcon size={32} className="text-slate-500" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight text-center">Sala de Espera</h2>
                <p className="text-slate-400 mb-8 text-center text-sm sm:text-base leading-relaxed">
                  O ambiente está configurado e seguro. Clique abaixo para iniciar a sessão e revelar os painéis terapêuticos.
                </p>
                
                <div className="mb-8 p-1.5 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center shadow-lg w-full max-w-md relative z-20 transition-all hover:border-indigo-500/50">
                  <div className="flex items-center justify-center pl-4 pr-2 shrink-0">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="relative group flex-1 min-w-0">
                    <select
                      value={selectedPatientId}
                      onChange={handleManualPatientSelect}
                      className="w-full appearance-none bg-transparent text-sm font-bold text-white pl-2 pr-10 py-3 rounded-xl outline-none cursor-pointer group-hover:text-indigo-300 transition-colors truncate"
                    >
                      <option value="" disabled>Selecione o Cliente</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id} className="text-slate-200 bg-slate-900 text-left">
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <button
                    className="group bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm md:text-base font-bold py-3.5 px-6 rounded-full shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center gap-2 border border-indigo-500/30"
                    title="Revisar dados da anamnese preenchida pelo cliente"
                  >
                    <FileText className="w-5 h-5" />
                    Ver anamnese?
                  </button>

                  <button
                    onClick={handleStartSession}
                    className="group bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold py-4 px-10 rounded-full shadow-[0_0_25px_rgba(5,150,105,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center gap-3 border border-emerald-400/30"
                  >
                    <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                    Iniciar Sessão
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSessionStarted && localStream && (
          <div className="absolute bottom-4 right-4 w-24 sm:w-32 lg:w-40 aspect-video rounded-xl overflow-hidden border-2 border-slate-800 shadow-xl bg-black">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          </div>
        )}


      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-none lg:rounded-2xl border-x lg:border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative z-20">
        <div className="lg:hidden p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex overflow-x-auto no-scrollbar gap-2 shrink-0">
          {phases.map(p => (
            <button
              key={p.id}
              onClick={() => { /* setPhase here via props if needed on mobile */ }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${phase === p.id ? 'bg-primary-600 border-primary-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderPhaseContent()}
        </div>
      </div>
    </div>
  );
};
