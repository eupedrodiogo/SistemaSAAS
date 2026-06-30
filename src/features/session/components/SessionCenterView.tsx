import React, { useRef, useEffect } from 'react';
import { SessionNotes } from '../../../components/Session/SessionNotes';
import { ChronologicalPhase } from '../../../components/Session/ChronologicalPhase';
import { StandardPhase } from '../../../components/Session/StandardPhase';
import { ProtocolPhase } from '../../../components/Session/ProtocolPhases';
import { PanelLeftClose, PanelLeftOpen, VideoOff } from 'lucide-react';
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
  isMicMuted
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
