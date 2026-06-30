import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useSessionState } from '../api/useSessionState';
import { SessionHeader } from './SessionHeader';
import { SessionSidebar } from './SessionSidebar';
import { SessionCenterView } from './SessionCenterView';
import { CockpitPanel } from '../../../components/Session/CockpitPanel';
import { useSessionMedia } from '../../../hooks/useSessionMedia';
import { useVideoCall } from '../../../hooks/useVideoCall';

const DEFAULT_PHASES = [
  { id: 'anamnese', label: 'Anamnese', isSystem: true },
  { id: 'cronologico', label: '1. Cronológico', isSystem: true },
  { id: 'somatico', label: '2. Somático', isSystem: true },
  { id: 'tematico', label: '3. Temático', isSystem: true },
  { id: 'futuro', label: '4. Futuro', isSystem: true },
  { id: 'potencializacao', label: '5. Potencialização', isSystem: true },
];

const AGE_RANGES = ['0-10 anos', '11-20 anos', '21-30 anos', '31-40 anos', '41-50 anos', '51-60 anos', '61+ anos'];

interface SessionViewProps {
  onSessionActiveChange?: (isActive: boolean) => void;
  onNavigateToReports?: (patientId: string) => void;
}

const SessionView: React.FC<SessionViewProps> = ({ onSessionActiveChange, onNavigateToReports }) => {
  const { id: paramAppId } = useParams();
  const navigate = useNavigate();

  const {
    patients,
    selectedPatientId,
    appointmentObj,
    sessionData,
    intakeData,
    sessionNumber,
    setSessionNumber,
    handleManualPatientSelect,
    saveSessionData,
    sessionDataRef
  } = useSessionState(paramAppId);

  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [phase, setPhase] = useState('anamnese');
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [isFasesOpen, setIsFasesOpen] = useState(true);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  
  const [selectedAgeRange, setSelectedAgeRange] = useState(AGE_RANGES[0]);
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [mentalSud, setMentalSud] = useState(0);
  const [physicalSud, setPhysicalSud] = useState(0);
  const [observation, setObservation] = useState('');

  const { localStream, startCamera, stopCamera, toggleVideo, toggleMic, isVideoActive, isMicMuted } = useSessionMedia();
  
  const activeAppId = appointmentObj?.id || paramAppId;
  const roomKey = activeAppId || selectedPatientId;
  const myPeerId = roomKey ? `therapist-${roomKey}` : '';

  const { remoteStream, connectionStatus, sendSyncData } = useVideoCall({
    myId: myPeerId,
    targetId: [roomKey ? `client-${roomKey}` : ''].filter(Boolean),
    isInitiator: true,
    localStream
  });

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    } else if (!isTimerRunning && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    if (connectionStatus === 'connected' && sessionData && sendSyncData) {
      sendSyncData({ type: 'SESSION_DATA_UPDATE', payload: sessionData });
    }
  }, [connectionStatus, sessionData, sendSyncData]);

  const handlePhaseChange = (newPhase: string) => {
    setPhase(newPhase);
    setSelectedCycle(1);
    setMentalSud(0);
    setPhysicalSud(0);
    if (isSessionStarted) {
      saveSessionData({ ...sessionDataRef.current, lastPhaseInProgress: newPhase }, false, sendSyncData);
    }
  };

  const handleAgeRangeChange = (range: string) => {
    setSelectedAgeRange(range);
    setSelectedCycle(1);
    setMentalSud(0);
    setPhysicalSud(0);
    saveSessionData({ ...sessionData, activeAgeRange: range }, false, sendSyncData);
  };

  const handleStartSession = () => {
    setIsSessionStarted(true);
    onSessionActiveChange?.(true);
    if (!isTimerRunning) setIsTimerRunning(true);
    if (!isVideoActive) startCamera();
  };

  const handleEndSession = () => {
    setIsSessionStarted(false);
    setIsTimerRunning(false);
    onSessionActiveChange?.(false);
    if (isVideoActive) stopCamera();

    if (selectedPatientId) {
      const sessionRecord = {
        id: `session-${Date.now()}`,
        sessionNumber,
        date: new Date().toISOString(),
        durationSeconds: timer,
        patientId: selectedPatientId,
        patientName: patients.find(p => p.id === selectedPatientId)?.name || 'Paciente',
        observation,
        cycleNotes: sessionData.cycleNotes || {},
        lastPhase: phase,
      };

      const finalData = { ...sessionData, clinicalRecord: sessionRecord };
      delete finalData.lastPhaseInProgress;
      saveSessionData(finalData, true, sendSyncData);
    }

    setTimer(0);
    setSessionNumber(prev => prev + 1);
    setPhase('anamnese');
    saveSessionData({}, false, sendSyncData);
    navigate('.', { replace: true });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <SessionHeader
        handleEndSession={handleEndSession}
        selectedPatientId={selectedPatientId}
        handleManualPatientSelect={(e) => handleManualPatientSelect(e.target.value)}
        patients={patients}
        isSessionStarted={isSessionStarted}
        aiSuggestions={[]}
        timer={timer}
        isTimerRunning={isTimerRunning}
        toggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        sessionNumber={sessionNumber}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        setShowOnboardingModal={setShowOnboardingModal}
        setShowAiModal={setShowAiModal}
      />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row p-3 pt-0 lg:pt-3 gap-0 lg:gap-3 relative">
        <SessionSidebar
          isFasesOpen={isFasesOpen}
          phases={phases}
          phase={phase}
          isEditingProtocol={isEditingProtocol}
          isSafetyOpen={isSafetyOpen}
          sentiment="neutral"
          handlePhaseChange={handlePhaseChange}
          setIsEditingProtocol={setIsEditingProtocol}
          setIsSafetyOpen={setIsSafetyOpen}
          handleMovePhase={() => {}}
          handleRenamePhase={() => {}}
          handleDeletePhase={() => {}}
          handleAddCustomPhase={() => {}}
          hasPhaseData={() => false}
          isSessionStarted={isSessionStarted}
          selectedAgeRange={selectedAgeRange}
          sessionData={sessionData}
        />

        <SessionCenterView
          phase={phase}
          phases={phases}
          isFasesOpen={isFasesOpen}
          setIsFasesOpen={setIsFasesOpen}
          intakeData={intakeData}
          observation={observation}
          setObservation={setObservation}
          selectedAgeRange={selectedAgeRange}
          handleAgeRangeChange={handleAgeRangeChange}
          AGE_RANGES={AGE_RANGES}
          sessionData={sessionData}
          isSessionStarted={isSessionStarted}
          localStream={localStream}
          remoteStream={remoteStream}
          isVideoActive={isVideoActive}
          startCamera={startCamera}
          stopCamera={stopCamera}
          toggleVideo={toggleVideo}
          toggleMic={toggleMic}
          isMicMuted={isMicMuted}
        />

        <CockpitPanel
          mode="dual"
          phaseLabel={phases.find(p => p.id === phase)?.label || 'Fase'}
          isKeyboardOpen={isKeyboardOpen}
          showAgeRanges={phase === 'cronologico'}
          showMentalSud={phase !== 'somatico'}
          showPhysicalSud={['cronologico', 'somatico', 'tematico', 'futuro'].includes(phase)}
          ageRanges={AGE_RANGES}
          selectedAgeRange={selectedAgeRange}
          onAgeRangeChange={handleAgeRangeChange}
          selectedCycle={selectedCycle}
          onCycleChange={setSelectedCycle}
          mentalSud={mentalSud}
          onMentalSudChange={setMentalSud}
          onRegisterMentalSud={() => {}}
          mentalHistory={[]}
          physicalSud={physicalSud}
          onPhysicalSudChange={setPhysicalSud}
          onRegisterPhysicalSud={() => {}}
          physicalHistory={[]}
          singleSud={0}
          onSingleSudChange={() => {}}
          onRegisterSingleSud={() => {}}
          singleHistory={[]}
          isPositiveScale={phase === 'potencializacao'}
          clinicalNotes={''}
          onClinicalNotesChange={() => {}}
          onSaveClinicalNotes={() => {}}
          onAdvancePhase={() => {
             const idx = phases.findIndex(p => p.id === phase);
             if (idx < phases.length - 1) handlePhaseChange(phases[idx + 1].id);
          }}
        />
      </div>
    </div>
  );
};

export default SessionView;
