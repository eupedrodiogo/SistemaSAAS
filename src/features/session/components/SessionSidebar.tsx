import React from 'react';
import { ProtocolPhases, ProtocolPhase } from '../../../components/Session/ProtocolPhases';

interface SessionSidebarProps {
  isFasesOpen: boolean;
  phases: ProtocolPhase[];
  phase: string;
  isEditingProtocol: boolean;
  isSafetyOpen: boolean;
  sentiment: 'neutral' | 'stress' | 'calm';
  handlePhaseChange: (phase: string) => void;
  setIsEditingProtocol: (v: boolean) => void;
  setIsSafetyOpen: (v: boolean) => void;
  handleMovePhase: (index: number, direction: 'up' | 'down') => void;
  handleRenamePhase: (index: number, value: string) => void;
  handleDeletePhase: (index: number) => void;
  handleAddCustomPhase: () => void;
  hasPhaseData: (phaseId: string) => boolean;
  isSessionStarted: boolean;
  selectedAgeRange: string;
  sessionData: any;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  isFasesOpen,
  phases,
  phase,
  isEditingProtocol,
  isSafetyOpen,
  sentiment,
  handlePhaseChange,
  setIsEditingProtocol,
  setIsSafetyOpen,
  handleMovePhase,
  handleRenamePhase,
  handleDeletePhase,
  handleAddCustomPhase,
  hasPhaseData,
  isSessionStarted,
  selectedAgeRange,
  sessionData
}) => {
  return (
    <div
      className={`
        hidden lg:flex flex-col gap-4
        transition-all duration-300 ease-in-out shrink-0 h-full
        ${isFasesOpen 
           ? 'lg:w-56 xl:w-60 opacity-100' 
           : 'lg:w-0 opacity-0 pointer-events-none'}
      `}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-1">
        <ProtocolPhases
          phases={phases}
          currentPhase={phase}
          isEditing={isEditingProtocol}
          isSafetyOpen={isSafetyOpen}
          aiSuggestions={[]}
          sentiment={sentiment}
          setPhase={handlePhaseChange}
          toggleEditing={() => setIsEditingProtocol(!isEditingProtocol)}
          toggleSafety={() => setIsSafetyOpen(!isSafetyOpen)}
          onMovePhase={handleMovePhase}
          onRenamePhase={handleRenamePhase}
          onDeletePhase={handleDeletePhase}
          onAddCustomPhase={handleAddCustomPhase}
          hasPhaseData={hasPhaseData}
        />
      </div>

      {phase === 'cronologico' && isSessionStarted && (
         <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4 shrink-0 overflow-hidden flex flex-col h-[280px]">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 shrink-0 flex items-center gap-2">
               Histórico SUD ({selectedAgeRange})
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
               <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">Emocional</p>
                  <div className="flex flex-wrap gap-1.5">
                     {((sessionData.mentalHistory || {})[selectedAgeRange] || []).map((val: number, i: number) => (
                        <span key={`m-${i}`} className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${val >= 7 ? 'bg-red-900/40 text-red-400' : val >= 4 ? 'bg-amber-900/40 text-amber-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                           {val}
                        </span>
                     ))}
                     {((sessionData.mentalHistory || {})[selectedAgeRange] || []).length === 0 && <span className="text-[10px] text-slate-500">Nenhum</span>}
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Físico</p>
                  <div className="flex flex-wrap gap-1.5">
                     {((sessionData.physicalHistory || {})[selectedAgeRange] || []).map((val: number, i: number) => (
                        <span key={`p-${i}`} className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${val >= 7 ? 'bg-red-900/40 text-red-400' : val >= 4 ? 'bg-amber-900/40 text-amber-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                           {val}
                        </span>
                     ))}
                     {((sessionData.physicalHistory || {})[selectedAgeRange] || []).length === 0 && <span className="text-[10px] text-slate-500">Nenhum</span>}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
