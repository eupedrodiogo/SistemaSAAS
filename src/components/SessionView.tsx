import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Waves,
  Zap,
  Target,
  Smile,
  Flag,
  RotateCcw,
  ArrowRight,
  Video as VideoIcon,
  VideoOff,
  Mic,
  ChevronDown,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Play,
  Power,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useSessionMedia } from '../hooks/useSessionMedia';
import { ClientIntakeData } from 'types';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVideoCall } from '../hooks/useVideoCall';
import { api } from '../services/api';
// Sub-components
import { SessionTimer } from './Session/SessionTimer';
import { SessionVideo } from './Session/SessionVideo';
import { ProtocolPhases, ProtocolPhase } from './Session/ProtocolPhases';
import { ChronologicalPhase } from './Session/ChronologicalPhase';
import { StandardPhase } from './Session/StandardPhase';
import { SessionNotes } from './Session/SessionNotes';
import { SudScale } from './Session/SudScale';
import { TherapistScript } from './Session/TherapistScript';
import { CockpitPanel } from './Session/CockpitPanel';

interface PhaseRecord {
  duration: string;
  response: string;
  observation: string;
}

interface SessionRecording {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  duration: string;
  type: 'video' | 'audio';
  phase: string;
  size: string;
  blobUrl?: string;
}

const DEFAULT_PHASES: ProtocolPhase[] = [
  { id: 'anamnese', label: 'Anamnese', isSystem: true },
  { id: 'cronologico', label: '1. Cronológico', isSystem: true },
  { id: 'somatico', label: '2. Somático', isSystem: true },
  { id: 'tematico', label: '3. Temático', isSystem: true },
  { id: 'futuro', label: '4. Futuro', isSystem: true },
  { id: 'potencializacao', label: '5. Potencialização', isSystem: true },
];

interface SessionViewProps {
  onSessionActiveChange?: (isActive: boolean) => void;
  onNavigateToReports?: (patientId: string) => void;
}

const PipVideoPlayer = ({ stream, isLocal }: { stream: MediaStream | null, isLocal: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`absolute inset-0 w-full h-full object-cover z-10 ${isLocal ? '-scale-x-100' : ''}`}
    />
  );
};

const SessionView: React.FC<SessionViewProps> = ({ onSessionActiveChange, onNavigateToReports }) => {
  const { session } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Session Lifecycle State
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  // Timer State
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        // Se o visual viewport encolheu mais de 15% em relação ao viewport total,
        // é quase garantido que o teclado virtual abriu.
        const isShrunk = window.visualViewport.height < window.innerHeight * 0.85;
        // Só forçamos o falso se tiver voltado ao normal, se não deixamos
        // os eventos de focus gerenciarem a abertura.
        if (!isShrunk) {
            setIsKeyboardOpen(false);
        } else {
            setIsKeyboardOpen(true);
        }
      }
    };

    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Protocol & Phase State
  const [phase, setPhase] = useState('anamnese');
  const [phases, setPhases] = useState<ProtocolPhase[]>(DEFAULT_PHASES);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [isProtocolCollapsed, setIsProtocolCollapsed] = useState(false);
  const [isFasesOpen, setIsFasesOpen] = useState(true);
  const [customPhaseName, setCustomPhaseName] = useState('');
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  const handlePhaseChange = (newPhase: string) => {
    setPhase(newPhase);
    setSelectedCycle(1);
    setMentalSud(0);
    setPhysicalSud(0);
    if (isSessionStarted) {
      saveSessionData({ ...sessionDataRef.current, lastPhaseInProgress: newPhase });
    }
  };
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<'neutral' | 'stress' | 'calm'>('neutral');

  // Transcription & AI Modal State
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Phase Data State
  const [sudLevel, setSudLevel] = useState(0);
  const [phaseRecords, setPhaseRecords] = useState<Record<string, PhaseRecord>>({});
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [intakeData, setIntakeData] = useState<ClientIntakeData | null>(null);
  const [observation, setObservation] = useState('');

  // Persistent Session Data
  const [sessionData, setSessionData] = useState<any>({});
  const [appointmentObj, setAppointmentObj] = useState<any>(null);
  const sessionDataRef = useRef<any>({});

  // ── Cockpit State (Fase Cronológica) ──────────────────────────────
  const AGE_RANGES = ['0-10 anos', '11-20 anos', '21-30 anos', '31-40 anos', '41-50 anos', '51-60 anos', '61+ anos'];
  const [selectedAgeRange, setSelectedAgeRange] = useState(AGE_RANGES[0]);
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [mentalSud, setMentalSud]     = useState(0);
  const [physicalSud, setPhysicalSud] = useState(0);
  // Histórico de notas por faixa etária: { 'mentalHistory': {...}, 'physicalHistory': {...} }
  // Armazenado dentro de sessionData para persistência automática

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Onboarding Modal State
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    // Check onboarding
    const hasSeenOnboarding = localStorage.getItem('TRG_HAS_SEEN_ONBOARDING');
    if (!hasSeenOnboarding) {
      setShowOnboardingModal(true);
    }

    const savedData = localStorage.getItem('TRG_SESSION_DRAFT');
    if (savedData) {
      const parsed = JSON.parse(savedData);
    }
  }, []);

  // Sync ref
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  // ── AUTO-RESUME: efeito dedicado, roda após o appointment ser carregado ─────
  // Separado do fetchPatients para evitar race condition com operações async.
  // Verifica se havia uma sessão ativa gravada no localStorage e retoma.
  useEffect(() => {
    if (!appointmentObj) return;              // Ainda carregando
    if (isSessionStarted) return;             // Sessão já ativa, não fazer nada

    const flag = localStorage.getItem('TRG_SESSION_ACTIVE_APP_ID');
    const appId = appointmentObj.id;
    if (!flag || flag !== appId) return;      // Não havia sessão ativa para este appointment

    // Sessão deve ser retomada
    setIsSessionStarted(true);
    onSessionActiveChange?.(true);

    // Restaurar a fase em progresso (se existir)
    const lastPhase = sessionDataRef.current?.lastPhaseInProgress;
    if (lastPhase) setPhase(lastPhase);
    else setPhase('cronologico');

    // ── Restaurar o timer: calcula o tempo decorrido desde o início da sessão
    const startTs = parseInt(localStorage.getItem('TRG_SESSION_START_TS') || '0', 10);
    if (startTs > 0) {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      setTimer(elapsed > 0 ? elapsed : 0);
    }

    // Iniciar câmera automaticamente
    startCamera();

    // Iniciar timer
    setIsTimerRunning(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentObj]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  // AI & Video State
  const { currentAppointmentId: paramAppId } = useParams();
  const initialAppId = paramAppId || localStorage.getItem('TRG_CURRENT_APPOINTMENT_ID') || undefined;
  const navigate = useNavigate();

  // Media & Video Call Hooks
  const { user } = useAuth();
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 1. Local Media
  const {
    localStream,
    isVideoActive,
    startCamera,
    stopCamera,
    toggleMic,
    toggleVideo,
    isMicMuted,
    isVideoMuted,
    isRecording,
    startRecording,
    stopRecording,
    recordingTime,
    recordedChunks
  } = useSessionMedia();

  // 2. Video Connection
  // Standardized IDs:
  // Use activeAppId first, then fallback to selectedPatientId.
  const activeAppId = appointmentObj?.id || initialAppId;
  const roomKey = activeAppId || selectedPatientId;
  
  // Therapist peer ID is deterministic so the client can reliably find it.
  // Format: therapist-{roomKey}
  // The client targets exactly this ID.
  const myPeerId = React.useMemo(() => {
    return roomKey ? `therapist-${roomKey}` : '';
  }, [roomKey]);

  const { remoteStream, connectionStatus, messages, sendMessage, sendSyncData } = useVideoCall({
    myId: myPeerId,
    targetId: [
      roomKey ? `client-${roomKey}` : '',
      user?.id ? `client-${user.id}` : ''
    ].filter(Boolean),
    isInitiator: true,
    localStream
  });

  const saveSessionData = async (newData: any, isEndingSession: boolean = false) => {
    setSessionData(newData);
    // Real-time sync of SUD and session progress to the client
    if (sendSyncData) {
      if (isEndingSession) {
        sendSyncData({ type: 'SESSION_ENDED' });
      } else {
        sendSyncData({ type: 'SESSION_DATA_UPDATE', payload: newData });
      }
    }

    // ── Cache local: garante que os dados sobrevivam mesmo se o save no DB falhar
    if (activeAppId) {
      localStorage.setItem(`TRG_SESSION_DATA_${activeAppId}`, JSON.stringify(newData));
    }
    
    try {
      if (!activeAppId || !selectedPatientId) return;

      // Obter o token de autenticação para enviar na requisição
      const token = session?.access_token;
      if (!token) {
        console.warn('[saveSessionData] Sem token de auth — dados não serão persistidos no DB.');
        return;
      }

      const payload = {
        ...appointmentObj,
        sessionData: newData
      };

      if (isEndingSession) {
        payload.status = 'Concluído';
      }

      const response = await fetch(`/api/appointments?id=${activeAppId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('[saveSessionData] Erro ao salvar:', response.status, errData);
      }
    } catch (e) {
      console.error("Failed to save session data", e);
    }
  };

  // When client connects, immediately send the current session snapshot
  // so they don't have to wait for the next update
  React.useEffect(() => {

    if (connectionStatus === 'connected' && sessionData && sendSyncData) {
      sendSyncData({ type: 'SESSION_DATA_UPDATE', payload: sessionData });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  // Load SUD when phase changes
  useEffect(() => {
    let newSud = 0;
    if (phase === 'somatico') newSud = sessionData.somaticSud || 0;
    else if (phase === 'tematico') newSud = sessionData.thematicSud || 0;
    else if (phase === 'futuro') newSud = sessionData.futureSud || 0;
    else if (phase === 'potencializacao') newSud = sessionData.potentializationSud || 0;

    setSudLevel(newSud);
  }, [phase, sessionData.somaticSud, sessionData.thematicSud, sessionData.futureSud, sessionData.potentializationSud]);

  const handleSudChange = (newVal: number) => {
    setSudLevel(newVal);

    if (['somatico', 'tematico', 'futuro', 'potencializacao'].includes(phase)) {
      const newData = { ...sessionData };
      if (phase === 'somatico') newData.somaticSud = newVal;
      if (phase === 'tematico') newData.thematicSud = newVal;
      if (phase === 'futuro') newData.futureSud = newVal;
      if (phase === 'potencializacao') newData.potentializationSud = newVal;
      saveSessionData(newData);
    }
  };

  // Load Patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await api.patients.list();
        setPatients(data);

        // Helper to parse legacy pipe-separated notes
        const parseLegacyNotes = (notes: any): Partial<ClientIntakeData> => {
          if (!notes || typeof notes !== 'string') return {};
          const parts = notes.split('|').map(s => s.trim());
          
          let complaint = notes;
          const transtornos: {name: string, level: number}[] = [];
          const doresFisicas: {name: string, level: number}[] = [];
          const temasFuturo: {name: string, level: number}[] = [];

          parts.forEach(part => {
            if (part.toLowerCase().startsWith('queixa:')) {
              complaint = part.replace(/^queixa:\s*/i, '');
            }
            // "Transtornos: Abandono (10), Aborto (5)"
            else if (part.toLowerCase().startsWith('transtornos:')) {
              const itemsStr = part.replace(/^transtornos:\s*/i, '');
              itemsStr.split(',').forEach(item => {
                const match = item.match(/(.+?)\s*\((\d+)\)/);
                if (match) {
                  transtornos.push({ name: match[1].trim(), level: parseInt(match[2]) });
                }
              });
            }
            else if (part.toLowerCase().startsWith('dores físicas:') || part.toLowerCase().startsWith('dores:') || part.toLowerCase().startsWith('doenças físicas:')) {
              const itemsStr = part.replace(/^(dores físicas|dores|doenças físicas):\s*/i, '');
              itemsStr.split(',').forEach(item => {
                const match = item.match(/(.+?)\s*\((\d+)\)/);
                if (match) {
                  doresFisicas.push({ name: match[1].trim(), level: parseInt(match[2]) });
                }
              });
            }
            else if (part.toLowerCase().startsWith('temas:') || part.toLowerCase().startsWith('futuro:')) {
              const itemsStr = part.replace(/^(temas|futuro):\s*/i, '');
              itemsStr.split(',').forEach(item => {
                const match = item.match(/(.+?)\s*\((\d+)\)/);
                if (match) {
                  temasFuturo.push({ name: match[1].trim(), level: parseInt(match[2]) });
                }
              });
            }
          });

          return {
            complaint: parts.length > 1 ? complaint : notes,
            transtornos: transtornos.length > 0 ? transtornos : undefined,
            doresFisicas: doresFisicas.length > 0 ? doresFisicas : undefined,
            temasFuturo: temasFuturo.length > 0 ? temasFuturo : undefined,
          };
        };

        // Determine which appointment to load: Route param > LocalStorage
        const localAppId = localStorage.getItem('TRG_CURRENT_APPOINTMENT_ID');
        const targetAppointmentId = paramAppId || localAppId;

        const loadFallbackPatient = (pId: string) => {
          setSelectedPatientId(pId);
          const p = data.find((pat: any) => pat.id === pId);
          if (p) {
            // Tenta ler JSON completo salvo pelo portal no campo notes
            if (p.notes && typeof p.notes === 'string' && p.notes.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(p.notes);
                if (typeof parsed === 'object' && parsed !== null) {
                  setIntakeData({
                    nome: parsed.nome || p.name,
                    email: parsed.email || p.email,
                    celular: parsed.celular || p.phone || '',
                    ...parsed,
                    transtornos: parsed.transtornos || [],
                    doresFisicas: parsed.doresFisicas || [],
                    temasFuturo: parsed.temasFuturo || [],
                  } as ClientIntakeData);
                  return;
                }
              } catch (_) {}
            } else if (p.notes && typeof p.notes === 'object') {
               const notes = p.notes as any;
               setIntakeData({
                  nome: notes.nome || p.name,
                  email: notes.email || p.email,
                  celular: notes.celular || p.phone || '',
                  ...notes,
                  transtornos: notes.transtornos || [],
                  doresFisicas: notes.doresFisicas || [],
                  temasFuturo: notes.temasFuturo || [],
               } as ClientIntakeData);
               return;
            }
            // Fallback para formato legado
            const parsedLegacy = parseLegacyNotes(p.notes);
            setIntakeData({
              nome: p.name,
              email: p.email,
              complaint: parsedLegacy.complaint || (typeof p.notes === 'string' ? p.notes : '') || 'Anamnese não preenchida.',
              transtornos: parsedLegacy.transtornos || [],
              doresFisicas: parsedLegacy.doresFisicas || [],
              temasFuturo: parsedLegacy.temasFuturo || [],
            } as any);
          }
        };

        /**
         * Tenta parsear uma string como JSON de anamnese.
         * Retorna null se não for um JSON válido de anamnese.
         */
        const tryParseAnamneseJSON = (raw: any): ClientIntakeData | null => {
          if (!raw) return null;
          if (typeof raw === 'object') {
            return {
              ...raw,
              transtornos: raw.transtornos || [],
              doresFisicas: raw.doresFisicas || [],
              temasFuturo: raw.temasFuturo || [],
            } as ClientIntakeData;
          }
          if (typeof raw !== 'string') return null;
          const trimmed = raw.trim();
          if (!trimmed.startsWith('{')) return null;
          try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'object' && parsed !== null) {
              return {
                ...parsed,
                transtornos: parsed.transtornos || [],
                doresFisicas: parsed.doresFisicas || [],
                temasFuturo: parsed.temasFuturo || [],
              } as ClientIntakeData;
            }
          } catch (_) {}
          return null;
        };

        if (targetAppointmentId) {
          const appointment = await api.appointments.get(targetAppointmentId);
          
          if (appointment) {
            setAppointmentObj(appointment);
            const patientId = appointment.patientId;
            if (patientId) setSelectedPatientId(patientId);

            // Load session data — prefer DB, fallback to localStorage cache
            const lsKey = `TRG_SESSION_DATA_${targetAppointmentId}`;
            if (appointment.sessionData && Object.keys(appointment.sessionData).length > 0) {
              setSessionData(appointment.sessionData);
              localStorage.setItem(lsKey, JSON.stringify(appointment.sessionData));
            } else {
              const cached = localStorage.getItem(lsKey);
              if (cached) {
                try { setSessionData(JSON.parse(cached)); } catch (_) {}
              }
            }

            // ── Carregamento da Anamnese (SSoT: patient.notes > appointment.notes > legado) ──
            // PRIORIDADE 1: Buscar patient.notes diretamente do banco (JSON completo salvo pelo portal)
            let loaded = false;
            if (patientId) {
              const patientRecord = data.find((p: any) => p.id === patientId);
              const patientNotes = patientRecord?.notes;
              const fromPatientNotes = tryParseAnamneseJSON(patientNotes);
              if (fromPatientNotes) {
                // Complementa com dados do patient (nome, email, telefone)
                setIntakeData({
                  nome: fromPatientNotes.nome || patientRecord?.name || appointment.patientName,
                  email: fromPatientNotes.email || patientRecord?.email || '',
                  celular: fromPatientNotes.celular || patientRecord?.phone || '',
                  ...fromPatientNotes,
                });
                loaded = true;
              }
            }

            // PRIORIDADE 2: appointment.notes (JSON salvo quando o cliente preencheu anamnese ligada ao appointment)
            if (!loaded && appointment.notes) {
              const fromApptNotes = tryParseAnamneseJSON(
                typeof appointment.notes === 'string' ? appointment.notes : JSON.stringify(appointment.notes)
              );
              if (fromApptNotes) {
                setIntakeData({
                  nome: fromApptNotes.nome || appointment.patientName,
                  email: fromApptNotes.email || '',
                  ...fromApptNotes,
                });
                loaded = true;
              }
            }

            // PRIORIDADE 3: Formato legado (pipe-separated) em appointment.notes ou patient.notes
            if (!loaded) {
              const rawNotes = appointment.notes || (data.find((p: any) => p.id === patientId)?.notes) || '';
              const legacySource = typeof rawNotes === 'string' ? rawNotes : '';
              const parsedLegacy = parseLegacyNotes(legacySource);
              setIntakeData({
                nome: appointment.patientName,
                email: appointment.patient?.email || '',
                complaint: parsedLegacy.complaint || legacySource || 'Anamnese não preenchida.',
                transtornos: parsedLegacy.transtornos || [],
                doresFisicas: parsedLegacy.doresFisicas || [],
                temasFuturo: parsedLegacy.temasFuturo || [],
              } as ClientIntakeData);
            }

          } else {
            // Appointment não encontrado: fallback para patient do localStorage
            const savedPatientId = localStorage.getItem('TRG_CURRENT_PATIENT_ID');
            if (savedPatientId) loadFallbackPatient(savedPatientId);
          }
        } else {
          // Sem appointment: carrega patient do localStorage
          const savedPatientId = localStorage.getItem('TRG_CURRENT_PATIENT_ID');
          if (savedPatientId) loadFallbackPatient(savedPatientId);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };
    fetchPatients();
  }, [paramAppId, session]);

  // Sincroniza o sessionNumber sempre que um paciente é carregado (via hook ou manual)
  useEffect(() => {
    if (selectedPatientId) {
      api.appointments.list().then(apps => {
        const completed = apps.filter(a =>
          a.patientId === selectedPatientId &&
          (a.status === 'Concluído' || a.status === 'completed') &&
          a.sessionData?.clinicalRecord &&
          // Não contar o appointment atual (em progresso) como concluído
          a.id !== activeAppId
        );
        setSessionNumber(completed.length + 1);
      }).catch(err => {
        console.error("Erro ao buscar agendamentos", err);
        setSessionNumber(1);
      });
    }
  // activeAppId deriva de appointmentObj que muda depois do fetch inicial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId, activeAppId]);

  // Handle manual patient selection
  const handleManualPatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPatientId(pId);
    localStorage.setItem('TRG_CURRENT_PATIENT_ID', pId);

    const p = patients.find(pat => pat.id === pId);
    if (p) {
      // Clear specific appointment context if we switch manually to avoid confusion
      setAppointmentObj(null);
      localStorage.removeItem('TRG_CURRENT_APPOINTMENT_ID');

      let parsedIntake: Partial<ClientIntakeData> | null = null;
      
      if (p.notes) {
        if (typeof p.notes === 'string' && p.notes.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(p.notes);
            if (typeof parsed === 'object' && parsed !== null) {
              parsedIntake = {
                ...parsed,
                transtornos: parsed.transtornos || [],
                doresFisicas: parsed.doresFisicas || [],
                temasFuturo: parsed.temasFuturo || [],
              };
            }
          } catch (_) {}
        } else if (typeof p.notes === 'object') {
           parsedIntake = {
              ...p.notes,
              transtornos: p.notes.transtornos || [],
              doresFisicas: p.notes.doresFisicas || [],
              temasFuturo: p.notes.temasFuturo || [],
           };
        } else if (typeof p.notes === 'string') {
           // Fallback to legacy string parsing
           const parts = p.notes.split('|').map((s: string) => s.trim());
           parsedIntake = { complaint: parts.length > 1 ? p.notes : p.notes };
        }
      }

      setIntakeData({
        nome: parsedIntake?.nome || p.name,
        email: parsedIntake?.email || p.email || '',
        celular: parsedIntake?.celular || p.phone || '',
        complaint: parsedIntake?.complaint || 'Anamnese não preenchida.',
        transtornos: parsedIntake?.transtornos || [],
        doresFisicas: parsedIntake?.doresFisicas || [],
        temasFuturo: parsedIntake?.temasFuturo || [],
        ...parsedIntake
      } as ClientIntakeData);
    }
    
    // Atualizar número da sessão
    if (pId) {
      api.appointments.list().then(apps => {
        const completed = apps.filter(a => a.patientId === pId && (a.status === 'Concluído' || a.status === 'completed') && a.sessionData?.clinicalRecord);
        setSessionNumber(completed.length + 1);
      }).catch(err => {
        setSessionNumber(1);
      });
    }
  };

  // Video Integration — always re-apply srcObject when stream or ref changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !localStream) return;
    if (el.srcObject !== localStream) {
      el.srcObject = localStream;
      el.play().catch(() => {}); // mobile autoplay policy
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


  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);


  // AI Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            setTranscript((prev) => prev + ' ' + text);
            analyzeSentiment(text);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const analyzeSentiment = (text: string) => {
    // Simple keyword based sentiment analysis for demo
    const stressWords = ['medo', 'angústia', 'dor', 'triste', 'raiva', 'pânico', 'não consigo'];
    const calmWords = ['paz', 'tranquilo', 'melhor', 'alívio', 'bem', 'consegui'];

    const lowerText = text.toLowerCase();
    const hasStress = stressWords.some(w => lowerText.includes(w));
    const hasCalm = calmWords.some(w => lowerText.includes(w));

    if (hasStress) setSentiment('stress');
    else if (hasCalm) setSentiment('calm');
    else setSentiment('neutral');

    // Simulate AI suggestions based on keywords
    if (lowerText.includes('medo') || lowerText.includes('travado')) {
      setAiSuggestions(prev => [...prev, "Sugestão: Tente a técnica de respiração 4-7-8."].slice(-3));
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

  const handleStartSession = async () => {
    setIsSessionStarted(true);
    onSessionActiveChange?.(true);

    // Marca esta sessão como ativa no localStorage para que um reload a retome automaticamente
    if (activeAppId) {
      localStorage.setItem('TRG_SESSION_ACTIVE_APP_ID', activeAppId);
      // Salva o epoch do início da sessão para recuperar o timer após reload
      // Ajusta pelo tempo já decorrido (caso seja uma retomada com timer != 0)
      const adjustedStart = Date.now() - (timer * 1000);
      localStorage.setItem('TRG_SESSION_START_TS', String(adjustedStart));
    }
    
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`);
      });
    }
    
    // Inicia o timer automaticamente ao iniciar a sessão se ele estiver parado
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }
    
    // Inicia o vídeo automaticamente
    if (!isVideoActive) {
      startCamera();
    }
    
    // Determina a fase de entrada:
    // Se o sessionData atual já tem dados (retomada), vai para a última fase em progresso.
    // Se é uma sessão nova, vai para cronológico ou baseado no histórico.
    const savedPhase = sessionData?.lastPhaseInProgress;
    if (savedPhase) {
      setPhase(savedPhase);
      return; // Retomada — não sobrescreve o estado
    }

    if (selectedPatientId) {
      try {
        const apps = await api.appointments.list();
        const patientApps = apps.filter(a => a.patientId === selectedPatientId && (a.status === 'Concluído' || a.status === 'completed') && a.sessionData?.clinicalRecord);
        if (patientApps.length === 0) {
          setPhase('cronologico');
        } else {
          patientApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastSession = patientApps[0].sessionData.clinicalRecord;
          setPhase(lastSession?.lastPhase || 'cronologico');
        }
      } catch (err) {
        console.error("Error loading previous sessions for phase", err);
        setPhase('cronologico');
      }
    } else {
      setPhase('cronologico');
    }
  };

  const handleEndSession = () => {
    // 1. Desativa a sessão e para o timer
    setIsSessionStarted(false);
    setIsTimerRunning(false);
    onSessionActiveChange?.(false);

    // Remove todas as flags da sessão
    localStorage.removeItem('TRG_SESSION_ACTIVE_APP_ID');
    localStorage.removeItem('TRG_SESSION_START_TS');
    if (activeAppId) localStorage.removeItem(`TRG_SESSION_DATA_${activeAppId}`);
    
    // 2. Desliga a câmera
    if (isVideoActive) stopCamera();
    
    // 3. Persiste o registro completo desta sessão no banco
    if (selectedPatientId) {
      const sessionRecord = {
        id: `session-${Date.now()}`,
        sessionNumber,
        date: new Date().toISOString(),
        durationSeconds: timer,
        patientId: selectedPatientId,
        patientName: patients.find(p => p.id === selectedPatientId)?.name || 'Paciente',
        observation: observation,
        cycleNotes: sessionData.cycleNotes || {},
        transcript,
        phaseRecords,
        sudLevels: {
          somatico: sessionData.somaticSud || 0,
          tematico: sessionData.thematicSud || 0,
          futuro: sessionData.futureSud || 0,
          potencializacao: sessionData.potentializationSud || 0,
          mentalCronologico: mentalSud,
          fisicoCronologico: physicalSud,
        },
        ageRange: selectedAgeRange,
        lastPhase: phase,
      };

      // Ao encerrar, salva o clinicalRecord e marca como Concluído — remove o lastPhaseInProgress
      const finalData = { ...sessionData, clinicalRecord: sessionRecord };
      delete finalData.lastPhaseInProgress;
      saveSessionData(finalData, true);
      localStorage.removeItem(`TRG_SESSIONS_${selectedPatientId}`);
    }
    
    // 4. Sair da tela cheia
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    
    // 5. Zera a sessão para preparar a próxima
    setTimer(0);
    setSessionNumber(prev => prev + 1);
    setPhase('anamnese');
    setSessionData({});
    setPhaseRecords({});
    setObservation('');
    setSudLevel(0);
    setMentalSud(0);
    setPhysicalSud(0);
    setSelectedAgeRange(AGE_RANGES[0]);
    setSelectedCycle(1);
    setTranscript('');
    setAiSuggestions([]);
    
    // 6. Redirecionar
    navigate('.', { state: { sidebarCollapsed: true }, replace: true });
  };

  const saveRecordingToGallery = async () => {
    // Mock saving to gallery
    // For now, simpler feedback
    alert('Gravação Salva na Galeria!');
    console.log('Gravação salva, chunks:', recordedChunks.length);
  };

  // Phase Management
  const handleMovePhase = (index: number, direction: 'up' | 'down') => {
    const newPhases = [...phases];
    if (direction === 'up' && index > 0) {
      [newPhases[index], newPhases[index - 1]] = [newPhases[index - 1], newPhases[index]];
    } else if (direction === 'down' && index < newPhases.length - 1) {
      [newPhases[index], newPhases[index + 1]] = [newPhases[index + 1], newPhases[index]];
    }
    setPhases(newPhases);
  };

  const handleRenamePhase = (index: number, value: string) => {
    const newPhases = [...phases];
    newPhases[index].label = value;
    setPhases(newPhases);
  };

  const handleDeletePhase = (index: number) => {
    const newPhases = phases.filter((_, i) => i !== index);
    setPhases(newPhases);
  };

  const handleAddCustomPhase = () => {
    setPhases([...phases, { id: `custom - ${Date.now()} `, label: 'Nova Fase', isSystem: false }]);
  };

  const hasPhaseData = (phaseId: string) => {
    // Logic to check if we have data for this phase
    if (phaseId === 'anamnese' && observation.length > 0) return true;
    return !!phaseRecords[phaseId];
  };

  const updateCustomScript = (phaseId: string, text: string) => {
    setPhases(phases.map(p => p.id === phaseId ? { ...p, customScript: text } : p));
  };


  // ── Cockpit Handlers ────────────────────────────────────────────────
  const handleAgeRangeChange = (range: string) => {
    setSelectedAgeRange(range);
    setSelectedCycle(1);
    setMentalSud(0);
    setPhysicalSud(0);
    const nextData = { ...sessionData, activeAgeRange: range };
    saveSessionData(nextData);
  };

  // Sincroniza os valores de SUD no painel ao mudar de ciclo, fase ou faixa etária
  useEffect(() => {
    let mentalHist: number[] = [];
    let physicalHist: number[] = [];

    if (phase === 'cronologico') {
      mentalHist = (sessionData.mentalHistory || {})[selectedAgeRange] || [];
      physicalHist = (sessionData.physicalHistory || {})[selectedAgeRange] || [];
    } else if (phase === 'somatico') {
      mentalHist = sessionData.somaticMentalHistory || [];
      physicalHist = sessionData.somaticPhysicalHistory || [];
    } else if (phase === 'tematico') {
      mentalHist = sessionData.thematicMentalHistory || [];
      physicalHist = sessionData.thematicPhysicalHistory || [];
    } else if (phase === 'futuro') {
      mentalHist = sessionData.futureMentalHistory || [];
      physicalHist = sessionData.futurePhysicalHistory || [];
    } else if (phase === 'potencializacao') {
      mentalHist = sessionData.potentializationMentalHistory || [];
      physicalHist = sessionData.potentializationPhysicalHistory || [];
    } else {
      mentalHist = sessionData[`${phase}MentalHistory`] || [];
      physicalHist = sessionData[`${phase}PhysicalHistory`] || [];
    }

    const idx = selectedCycle - 1;
    if (mentalHist[idx] !== undefined) setMentalSud(mentalHist[idx]);
    else setMentalSud(0);

    if (physicalHist[idx] !== undefined) setPhysicalSud(physicalHist[idx]);
    else setPhysicalSud(0);
  }, [
    selectedCycle, phase, selectedAgeRange,
    sessionData.mentalHistory, sessionData.physicalHistory,
    sessionData.somaticMentalHistory, sessionData.somaticPhysicalHistory,
    sessionData.thematicMentalHistory, sessionData.thematicPhysicalHistory,
    sessionData.futureMentalHistory, sessionData.futurePhysicalHistory,
    sessionData.potentializationMentalHistory, sessionData.potentializationPhysicalHistory
  ]);

  const handleRegisterMentalSud = () => {
    const idx = selectedCycle - 1;
    const newSessionData = { ...sessionData };

    if (phase === 'cronologico') {
      const prev = (newSessionData.mentalHistory || {})[selectedAgeRange] || [];
      const newHistory = [...prev];
      newHistory[idx] = mentalSud;
      newSessionData.mentalHistory = { ...(newSessionData.mentalHistory || {}), [selectedAgeRange]: newHistory };
    } else {
      const key = phase === 'somatico' ? 'somaticMentalHistory' :
                  phase === 'tematico' ? 'thematicMentalHistory' :
                  phase === 'futuro' ? 'futureMentalHistory' :
                  phase === 'potencializacao' ? 'potentializationMentalHistory' :
                  `${phase}MentalHistory`;
      const prev = newSessionData[key] || [];
      const newHistory = [...prev];
      newHistory[idx] = mentalSud;
      newSessionData[key] = newHistory;
    }
    saveSessionData(newSessionData);
  };

  const handleRegisterPhysicalSud = () => {
    const idx = selectedCycle - 1;
    const newSessionData = { ...sessionData };

    if (phase === 'cronologico') {
      const prev = (newSessionData.physicalHistory || {})[selectedAgeRange] || [];
      const newHistory = [...prev];
      newHistory[idx] = physicalSud;
      newSessionData.physicalHistory = { ...(newSessionData.physicalHistory || {}), [selectedAgeRange]: newHistory };
    } else {
      const key = phase === 'somatico' ? 'somaticPhysicalHistory' :
                  phase === 'tematico' ? 'thematicPhysicalHistory' :
                  phase === 'futuro' ? 'futurePhysicalHistory' :
                  phase === 'potencializacao' ? 'potentializationPhysicalHistory' :
                  `${phase}PhysicalHistory`;
      const prev = newSessionData[key] || [];
      const newHistory = [...prev];
      newHistory[idx] = physicalSud;
      newSessionData[key] = newHistory;
    }
    saveSessionData(newSessionData);
  };

  const handleAdvancePhase = () => {
    const idx = phases.findIndex(p => p.id === phase);
    if (idx < phases.length - 1) {
      const nextPhase = phases[idx + 1].id;
      setPhase(nextPhase);
      setSelectedCycle(1);
      // Persiste a fase atual no banco para que um reload retome do ponto correto
      if (isSessionStarted) {
        saveSessionData({ ...sessionData, lastPhaseInProgress: nextPhase });
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };


  // ── Render: Conteúdo central por fase ────────────────────────────────
  const renderPhaseContent = () => {
    switch (phase) {
      case 'anamnese':
        return <SessionNotes intakeData={intakeData} observation={observation} onObservationChange={setObservation} />;

      case 'cronologico':
        // No Cockpit Mode, o centro mostra apenas o gráfico dual.
        // Script e controles de SUD ficam no CockpitPanel à direita.
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
        const currentPhaseObj = phases.find(p => p.id === phase);
        return (
          <div className="p-0 sm:p-3 h-full animate-fade-in flex flex-col">

            {phase === 'somatico' && (
              <StandardPhase
                mentalHistory={sessionData.somaticMentalHistory || []}
                physicalHistory={sessionData.somaticPhysicalHistory || []}
                type="distress"
              />
            )}
            {phase === 'tematico' && (
              <StandardPhase
                mentalHistory={sessionData.thematicMentalHistory || []}
                physicalHistory={sessionData.thematicPhysicalHistory || []}
                type="distress"
              />
            )}
            {phase === 'futuro' && (
              <StandardPhase
                mentalHistory={sessionData.futureMentalHistory || []}
                physicalHistory={sessionData.futurePhysicalHistory || []}
                type="distress"
              />
            )}
            {phase === 'potencializacao' && (
              <StandardPhase
                mentalHistory={sessionData.potentializationMentalHistory || []}
                physicalHistory={sessionData.potentializationPhysicalHistory || []}
                type="positive"
              />
            )}
            {!['somatico','tematico','futuro','potencializacao'].includes(phase) && (
              <StandardPhase
                mentalHistory={[]}
                physicalHistory={[]}
                type="distress"
              />
            )}
          </div>
        );
    }
  };


  const renderCockpitContent = () => (
    <CockpitPanel
      mode="dual"
      phaseLabel={phases.find(p => p.id === phase)?.label || 'Fase'}
      isKeyboardOpen={isKeyboardOpen}
      
      // Cronológico e outras Fases agora usam a mesma mecânica dual, mas gravam em propriedades diferentes
      showAgeRanges={phase === 'cronologico'}
      showMentalSud={phase !== 'somatico'}
      showPhysicalSud={phase === 'cronologico' || phase === 'somatico' || phase === 'tematico' || phase === 'futuro'}
      ageRanges={AGE_RANGES}
      selectedAgeRange={selectedAgeRange}
      onAgeRangeChange={handleAgeRangeChange}
      selectedCycle={selectedCycle}
      onCycleChange={setSelectedCycle}
      
      mentalSud={mentalSud}
      onMentalSudChange={setMentalSud}
      onRegisterMentalSud={handleRegisterMentalSud}
      mentalHistory={
          phase === 'cronologico' ? ((sessionData.mentalHistory || {})[selectedAgeRange] || []) :
          phase === 'somatico' ? (sessionData.somaticMentalHistory || []) :
          phase === 'tematico' ? (sessionData.thematicMentalHistory || []) :
          phase === 'futuro' ? (sessionData.futureMentalHistory || []) :
          phase === 'potencializacao' ? (sessionData.potentializationMentalHistory || []) :
          (sessionData[phase + 'MentalHistory'] || [])
      }

      physicalSud={physicalSud}
      onPhysicalSudChange={setPhysicalSud}
      onRegisterPhysicalSud={handleRegisterPhysicalSud}
      physicalHistory={
          phase === 'cronologico' ? ((sessionData.physicalHistory || {})[selectedAgeRange] || []) :
          phase === 'somatico' ? (sessionData.somaticPhysicalHistory || []) :
          phase === 'tematico' ? (sessionData.thematicPhysicalHistory || []) :
          phase === 'futuro' ? (sessionData.futurePhysicalHistory || []) :
          phase === 'potencializacao' ? (sessionData.potentializationPhysicalHistory || []) :
          (sessionData[phase + 'PhysicalHistory'] || [])
      }
      
      // Props legacy ignoradas ou zeradas
      singleSud={0}
      onSingleSudChange={() => {}}
      onRegisterSingleSud={() => {}}
      singleHistory={[]}
      isPositiveScale={phase === 'potencializacao'}

      clinicalNotes={
          phase === 'cronologico' 
              ? ((sessionData.cycleNotes && sessionData.cycleNotes[selectedAgeRange] && sessionData.cycleNotes[selectedAgeRange][selectedCycle]) || '')
              : ((sessionData.phaseNotes && sessionData.phaseNotes[phase] && sessionData.phaseNotes[phase][selectedCycle]) || '')
      }
      onClinicalNotesChange={(v) => {
         if (phase === 'cronologico') {
             const currentAgeNotes = sessionData.cycleNotes?.[selectedAgeRange] || {};
             const newCycleNotes = { ...sessionData.cycleNotes, [selectedAgeRange]: { ...currentAgeNotes, [selectedCycle]: v } };
             saveSessionData({ ...sessionData, cycleNotes: newCycleNotes });
         } else {
             const currentPhaseNotes = sessionData.phaseNotes?.[phase] || {};
             const newPhaseNotes = { ...sessionData.phaseNotes, [phase]: { ...currentPhaseNotes, [selectedCycle]: v } };
             saveSessionData({ ...sessionData, phaseNotes: newPhaseNotes });
         }
      }}
      onSaveClinicalNotes={() => {}}
      onAdvancePhase={handleAdvancePhase}
    />
  );

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">

      {/* Header */}
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

            {/* Nexus AI Status Header */}
            {isSessionStarted && (
              <div className="hidden lg:flex items-center gap-1.5 ml-2 text-[10px] sm:text-[11px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm transition-all shrink-0">
                 <Sparkles size={12} className={aiSuggestions.length === 0 ? "animate-pulse" : ""} />
                 <span className="truncate max-w-[180px] xl:max-w-none">{aiSuggestions.length > 0 ? aiSuggestions[aiSuggestions.length - 1] : "Nexus AI ativo"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Timer Component */}
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

      {/* ══════════════════════════════════════════════════════
           MODO COCKPIT — Layout de 3 colunas
           L: Fases | C: Vídeo + Conteúdo | R: Painel
          ══════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row p-3 pt-0 lg:pt-3 gap-0 lg:gap-3 relative">

        {/* ── COLUNA ESQUERDA: Menu de Fases (colapsável - Desktop Apenas) ──── */}
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

          {/* Histórico de Notas SUD */}
          {phase === 'cronologico' && isSessionStarted && (
             <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4 shrink-0 overflow-hidden flex flex-col h-[280px]">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 shrink-0 flex items-center gap-2">
                   Histórico SUD ({selectedAgeRange})
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                   {/* Mental List */}
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
                   {/* Físico List */}
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

        {/* Botão de toggle — fica grudado na borda esquerda da área central */}
        <button
          onClick={() => setIsFasesOpen(v => !v)}
          title={isFasesOpen ? 'Ocultar menu de fases' : 'Mostrar menu de fases'}
          className="
            hidden lg:flex items-center justify-center
            self-start mt-2 w-6 h-12 -ml-1 shrink-0
            bg-slate-800 hover:bg-slate-700
            border border-slate-700 rounded-r-xl
            text-slate-400 hover:text-white
            transition-all duration-150 shadow-sm
          "
        >
          {isFasesOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>

        {/* ── COLUNA CENTRAL: Vídeo (flex-1, domina) + Gráfico (rodapé fixo) ── */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar relative">

          {/* OVERLAY DA SALA DE ESPERA */}
          {!isSessionStarted && (
            <div className="absolute inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar rounded-2xl">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl flex flex-col items-center justify-center p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden m-auto animate-fade-in-up">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-slate-950/80 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center w-full">
                  <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 flex items-center justify-center shadow-lg border border-slate-700/50">
                    <VideoIcon size={32} className="text-slate-500" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight text-center">Sala de Espera</h2>
                  <p className="text-slate-400 mb-8 max-w-sm text-center text-sm sm:text-base leading-relaxed">
                    O ambiente está configurado e seguro. Clique abaixo para iniciar a sessão e revelar os painéis terapêuticos.
                  </p>
                  
                  {/* Marcador de Próximo Cliente e Seletor */}
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
                      onClick={() => setIsAnamneseModalOpen(true)}
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

          {/* Vídeo — cresce para preencher o espaço (desktop) ou sticky no topo (mobile) */}
          <div className={`sticky top-0 z-40 lg:relative lg:z-auto lg:flex-1 lg:min-h-0 shadow-xl lg:shadow-none bg-slate-950 pb-1 lg:pb-0 lg:bg-transparent -mx-3 px-3 lg:mx-0 lg:px-0 flex-col shrink-0 ${phase === 'anamnese' && isSessionStarted ? 'hidden lg:hidden' : 'flex'}`}>
            {isSessionStarted && (
              <SessionVideo
                isVideoActive={isVideoActive}
                videoRef={videoRef}
                remoteVideoRef={remoteVideoRef}
                stream={localStream}
                remoteStream={remoteStream}
                isMicMuted={isMicMuted}
                isVideoMuted={isVideoMuted}
                isRecording={isRecording}
                recordingTime={recordingTime}
                recordedChunksCount={recordedChunks.length}
                connectionStatus={connectionStatus}
                patientName={intakeData?.nome}
                currentAppointmentId={activeAppId}
                messages={messages}
                onSendMessage={sendMessage}
                onToggleMic={toggleMic}
                onToggleVideo={toggleVideo}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onSaveRecording={saveRecordingToGallery}
                isProtocolCollapsed={isProtocolCollapsed}
                onToggleProtocol={() => setIsProtocolCollapsed(!isProtocolCollapsed)}
                isKeyboardOpen={isKeyboardOpen}
              />
            )}
          </div>

          {/* Menu de Fases no Mobile (fica logo abaixo do vídeo, preservando a hierarquia do sticky video no topo) */}
          <div className="block lg:hidden shrink-0 mt-2 w-full mb-2">
             <ProtocolPhases
                phases={phases}
                currentPhase={phase}
                isEditing={isEditingProtocol}
                isSafetyOpen={isSafetyOpen}
                aiSuggestions={aiSuggestions}
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

          {/* NOVO: CockpitPanel no Mobile (fica logo abaixo do vídeo) */}
          {phase !== 'anamnese' && (
            <div className={`block lg:hidden shrink-0 mt-2 transition-all duration-500 ${!isSessionStarted ? 'opacity-30 blur-[2px] pointer-events-none saturate-50' : ''}`}>
              {renderCockpitContent()}
            </div>
          )}

          {/* Conteúdo da fase — gráfico como rodapé (altura fixa definida dentro do componente) */}
          <div className={`shrink-0 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden transition-all duration-500 ${!isSessionStarted && phase !== 'anamnese' ? 'opacity-30 blur-[2px] pointer-events-none saturate-50' : ''}`}>
            <div className="lg:overflow-y-auto custom-scrollbar h-full">
              {renderPhaseContent()}
            </div>
          </div>
        </div>

        {/* ── Picture-in-Picture: aparece apenas na Anamnese para manter contato visual ── */}
        {phase === 'anamnese' && isSessionStarted && (
          <div className="fixed top-24 right-6 z-50 flex flex-col gap-1.5 items-end pointer-events-auto animate-fade-in-up">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider px-2.5 py-1 bg-slate-900/90 rounded-full backdrop-blur-md border border-slate-700/50 shadow-sm flex items-center gap-1.5">
              {remoteStream ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Cliente Online</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Seu Vídeo (Aguardando)</>
              )}
            </span>
            <div className="w-48 sm:w-60 aspect-video rounded-xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl shadow-black/80 bg-slate-900 relative">
              {/* Fallback de UI */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <VideoIcon size={24} className="text-slate-600 animate-pulse" />
              </div>
              
              <PipVideoPlayer 
                stream={remoteStream || localStream} 
                isLocal={!remoteStream} 
              />
              
              {/* Indicador de câmera ativa */}
              {isVideoActive && (
                <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse z-20" />
              )}
            </div>
          </div>
        )}

        {/* ── COLUNA DIREITA: CockpitPanel ─────────────────────
             Visível em todas as fases exceto Anamnese.
          ─────────────────────────────────────────────────── */}
        {phase !== 'anamnese' ? (
          <div className={`hidden lg:block lg:w-72 xl:w-80 shrink-0 lg:h-full transition-all duration-500 ${!isSessionStarted ? 'opacity-30 blur-[2px] pointer-events-none saturate-50' : ''}`}>
            {renderCockpitContent()}
          </div>
        ) : (
          /* Painel de notas lateral simples apenas para a Anamnese */
          <div
            className={
              isNotesOpen
                ? 'w-72 xl:w-80 shrink-0 h-full flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden'
                : 'w-0 shrink-0 overflow-hidden'
            }
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <FileText size={16} className="text-indigo-400" />
                Anotações Clínicas
              </div>
              <button
                onClick={() => setIsNotesOpen(false)}
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={sessionData.notes || ''}
                onChange={(e) => saveSessionData({ ...sessionData, notes: e.target.value })}
                placeholder="Anotações livres. Salvamento automático..."
                className="w-full h-full bg-transparent resize-none outline-none text-slate-300 placeholder:text-slate-600 text-sm leading-relaxed"
              />
            </div>
          </div>
        )}

      </div>

      {/* Modal de Anamnese */}
      {isAnamneseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-3xl">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="text-indigo-600 dark:text-indigo-400" /> Revisão da Anamnese
              </h3>
              <button onClick={() => setIsAnamneseModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-0 sm:p-2 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-950/50">
              <SessionNotes intakeData={intakeData} observation={observation} onObservationChange={setObservation} />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900 rounded-b-3xl">
              <button onClick={() => setIsAnamneseModalOpen(false)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-colors">
                Fechar e Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <HelpCircle className="text-indigo-400" size={28} /> 
                Guia da Sessão TeraNexus
              </h3>
              <button 
                onClick={() => {
                  setShowOnboardingModal(false);
                  localStorage.setItem('TRG_HAS_SEEN_ONBOARDING', 'true');
                }} 
                className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-950/50 text-slate-300">
              
              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Target size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">O que é o SUD?</h4>
                  <p className="text-sm leading-relaxed">
                    SUD significa <strong>Unidades Subjetivas de Desconforto</strong>. É uma escala de 0 a 10 usada para medir o desconforto atual do cliente.<br/>
                    • <strong>0:</strong> Nenhum desconforto (Zerado, objetivo atingido).<br/>
                    • <strong>10:</strong> Máximo desconforto possível.
                  </p>
                  <p className="text-sm mt-2 text-indigo-300 font-medium">Nota: Na fase de Potencialização, a escala se inverte (0 = neutro, 10 = força máxima).</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <PanelLeftClose size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">Como usar o Painel (Cockpit)</h4>
                  <p className="text-sm leading-relaxed">
                    A coluna à direita (Painel de Controle) contém os botões numéricos. Durante a sessão, pergunte ao cliente a nota do desconforto, selecione o número correspondente no painel e clique no botão azul <strong>"Registrar"</strong>.
                  </p>
                  <p className="text-sm mt-2">
                    O gráfico no centro da tela desenhará automaticamente o progresso para que você acompanhe a evolução térmica da sessão.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <VideoIcon size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">Contato Visual e Vídeo Flutuante</h4>
                  <p className="text-sm leading-relaxed">
                    Durante a fase de <strong>Anamnese</strong>, o texto ocupará quase toda a tela. Para garantir que você não perca o contato visual com o paciente, o vídeo dele se transformará em um pequeno quadro flutuante (PiP) no canto inferior direito.
                  </p>
                </div>
              </div>

            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end bg-slate-900">
              <button 
                onClick={() => {
                  setShowOnboardingModal(false);
                  localStorage.setItem('TRG_HAS_SEEN_ONBOARDING', 'true');
                }} 
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/40 transition-all text-sm w-full sm:w-auto"
              >
                Entendi, vamos lá!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal (Simplified for now) */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900/85 backdrop-blur-2xl w-full max-w-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-900/30 text-indigo-400 rounded-lg">
                  <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-5 h-5 rounded" />
                </div>
                <h3 className="font-bold text-white">Assistente Nexus AI</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-center">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <div className={`absolute inset - 0 rounded - full bg - indigo - 500 / 20 ${isListening ? 'animate-ping' : ''} `}></div>
                <Mic size={32} className={`relative z - 10 ${isListening ? 'text-indigo-600' : 'text-slate-400'} `} />
              </div>
              <h4 className="text-lg font-bold mb-2">Transcrição em Tempo Real</h4>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                O assistente está {isListening ? 'ouvindo...' : 'pausado.'} Ele analisa padrões de fala para sugerir intervenções.
              </p>
              <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[100px] text-left text-sm text-slate-600 dark:text-slate-300 font-medium">
                {transcript || "Nenhuma fala detectada ainda..."}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
              <button onClick={toggleListening} className={`px - 4 py - 2 rounded - xl border font - bold text - sm transition - all ${isListening ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-white border-slate-200 hover:bg-slate-50'} `}>
                {isListening ? 'Pausar Escuta' : 'Iniciar Escuta'}
              </button>
              <button onClick={() => setShowAiModal(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none">
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionView;
