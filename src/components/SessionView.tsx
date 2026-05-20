import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,

  Settings,
  X,
  PlusCircle,
  Film,
  MessageSquare,
  Waves,
  Zap,
  Target,
  Smile,
  AlertTriangle,
  Flag,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowRight,
  Video as VideoIcon,
  VideoOff,
  Mic,
  ChevronDown,
  FileText
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

const SessionView: React.FC = () => {
  const { session } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Timer State
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(1);

  // Protocol & Phase State
  const [phase, setPhase] = useState('anamnese');
  const [phases, setPhases] = useState<ProtocolPhase[]>(DEFAULT_PHASES);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [customPhaseName, setCustomPhaseName] = useState('');
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
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
  const [intakeData, setIntakeData] = useState<ClientIntakeData | null>(null);
  const [observation, setObservation] = useState('');

  // Persistent Session Data
  const [sessionData, setSessionData] = useState<any>({});
  const [appointmentObj, setAppointmentObj] = useState<any>(null); // Moved up to valid scope
  const sessionDataRef = useRef<any>({}); // Ref to avoid closure stale state in autosave

  // Sync ref
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  // AI & Video State
  const { currentAppointmentId } = useParams();
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
  // My: therapist-{currentAppointmentId}
  // Target: client-{currentAppointmentId}
  const { remoteStream, connectionStatus } = useVideoCall({
    myId: currentAppointmentId ? `therapist - ${currentAppointmentId} ` : 'therapist-default',
    targetId: currentAppointmentId ? `client - ${currentAppointmentId} ` : 'appointment-default',
    isInitiator: true,
    localStream
  });

  const saveSessionData = async (newData: any) => {
    setSessionData(newData);
    try {
      if (!currentAppointmentId || !selectedPatientId) return;

      await fetch(`/api/appointments?id=${currentAppointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointmentObj,
          sessionData: newData
        })
      });
    } catch (e) {
      console.error("Failed to save session data", e);
    }
  };

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

        // Determine which appointment to load: Route param > LocalStorage
        const localAppId = localStorage.getItem('TRG_CURRENT_APPOINTMENT_ID');
        const targetAppointmentId = currentAppointmentId || localAppId;

        if (targetAppointmentId) {
          const appResponse = await fetch(`/api/appointments/${targetAppointmentId}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          });
          if (appResponse.ok) {
            const appointment = await appResponse.json();
            if (appointment) {
              setAppointmentObj(appointment); // Save full object
              if (appointment.patientId) setSelectedPatientId(appointment.patientId);

              // Load session data
              if (appointment.sessionData) {
                setSessionData(appointment.sessionData);
              }

              // Mock intake data for demo if not found

              // Attempt to load intake data from appointment notes (where it acts as anamnesis storage)
              // Attempt to load intake data from appointment notes (where it acts as anamnesis storage)
              if (appointment.notes) {
                try {
                  let parsedNotes = appointment.notes;
                  if (typeof parsedNotes === 'string') {
                    // Only parse if it looks like a JSON object/array
                    if (parsedNotes.trim().startsWith('{') || parsedNotes.trim().startsWith('[')) {
                      parsedNotes = JSON.parse(parsedNotes);
                    }
                  }

                  // Basic validation to see if it's anamnesis data (has at least one expected key or is object)
                  if (typeof parsedNotes === 'object' && parsedNotes !== null) {
                    setIntakeData({
                      ...parsedNotes,
                      // Ensure arrays exist even if empty in JSON
                      transtornos: parsedNotes.transtornos || [],
                      doresFisicas: parsedNotes.doresFisicas || [],
                      temasFuturo: parsedNotes.temasFuturo || []
                    } as ClientIntakeData);
                  } else {
                    // String legacy note case
                    throw new Error("Legacy string note");
                  }
                } catch (e) {
                  // Not JSON, assume simple string notes or legacy data
                  // We might still want to populate complaint if it's a simple string
                  if (!intakeData) {
                    setIntakeData({
                      nome: appointment.patientName,
                      email: 'cliente@exemplo.com',
                      complaint: typeof appointment.notes === 'string' ? appointment.notes : "Notas legadas",
                      transtornos: [],
                      doresFisicas: [],
                      temasFuturo: []
                    } as ClientIntakeData);
                  }
                }
              }

              if (!intakeData && !appointment.notes) {
                const mockIntake: ClientIntakeData = {
                  nome: appointment.patientName,
                  email: 'cliente@exemplo.com',
                  complaint: "Ansiedade generalizada e dificuldade de dormir.",
                  int_ansiedade: 'Muita',
                  int_medo: 'Média',
                  dataNascimento: '1985-05-15',
                  cidade: 'São Paulo',
                  uf: 'SP',
                  estadoCivil: 'Casado(a)',
                  profissao: 'Advogado(a)',
                  religiao: 'Católica',
                  insonia: 'Sim, dificuldade para iniciar',
                  nivelStress: 'Alto (8/10)',
                  medications: 'Clonazepam s/n',
                  maioresMedosHoje: 'Falhar profissionalmente',
                  sentimentoCulpa: 'Sim, por não dar atenção à família',
                  visaoFuturo: 'Me vejo mais calmo e organizado'
                };
                setIntakeData(mockIntake);
              }
            }
          }
        } else {
          // Fallback: If no specific appointment, try to load just the patient from LS
          const savedPatientId = localStorage.getItem('TRG_CURRENT_PATIENT_ID');
          if (savedPatientId) {
            setSelectedPatientId(savedPatientId);
            // Try to load basic info for this patient
            const p = data.find((pat: any) => pat.id === savedPatientId);
            if (p) {
              setIntakeData({
                nome: p.name,
                email: p.email,
                complaint: p.notes,
              } as any);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };
    fetchPatients();
  }, [currentAppointmentId, session]);

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

      setIntakeData({
        nome: p.name,
        email: p.email || '',
        complaint: p.notes || '', // Use notes as complaint
        // ... defaults
      } as ClientIntakeData);
    }
  };

  // Video Integration
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
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


  // Render Helpers
  const renderPhaseContent = () => {
    switch (phase) {
      case 'anamnese':
        return <SessionNotes intakeData={intakeData} observation={observation} onObservationChange={setObservation} />;

      default:
        const currentPhaseObj = phases.find(p => p.id === phase);
        return (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg">
                  {phase === 'cronologico' && <RotateCcw size={20} />}
                  {phase === 'somatico' && <Target size={20} />}
                  {phase === 'tematico' && <Waves size={20} />}
                  {phase === 'futuro' && <Zap size={20} />}
                  {phase === 'potencializacao' && <Smile size={20} />}
                  {!['cronologico', 'somatico', 'tematico', 'futuro', 'potencializacao'].includes(phase) && <Flag size={20} />}
                </span>
                {currentPhaseObj?.label}
              </h2>

              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border 
                    ${['potencializacao'].includes(phase)
                    ? (sudLevel > 7 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200')
                    : (sudLevel > 7 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200')
                  } `}>
                  {['potencializacao'].includes(phase) ? 'Nível Positivo' : 'SUD Atual'}: {sudLevel}
                </span>
              </div>
            </div >

            <SudScale
              value={sudLevel}
              onChange={handleSudChange}
              scaleType={['potencializacao'].includes(phase) ? 'positive' : 'distress'}
              label={['potencializacao'].includes(phase) ? 'Nível de Fortalecimento (0-10)' : undefined}
            />

            {
              phase === 'cronologico' && (
                <ChronologicalPhase
                  currentSud={sudLevel}
                  onSetSud={handleSudChange}
                  history={sessionData.chronologicalHistory || {}}
                  onUpdateHistory={(range, newHistory) => {
                    const newData = {
                      ...sessionData,
                      chronologicalHistory: {
                        ...(sessionData.chronologicalHistory || {}),
                        [range]: newHistory
                      }
                    };
                    saveSessionData(newData);
                  }}
                />
              )
            }

            {
              phase === 'somatico' && (
                <StandardPhase
                  currentValue={sudLevel}
                  onRegister={() => {
                    const currentHistory = sessionData.somaticHistory || [];
                    const newHistory = [...currentHistory, sudLevel];
                    saveSessionData({ ...sessionData, somaticHistory: newHistory });
                  }}
                  history={sessionData.somaticHistory || []}
                  type="distress"
                  scriptTitle="Foco Somático"
                  scriptContent={
                    "Concentre-se apenas na sensação física. Onde ela está localizada? Qual o tamanho? Tem cor? Temperatura? Apenas observe essa sensação, sem julgar, sem tentar mudar. Deixe que o seu cérebro faça o processamento..."
                  }
                  customScriptContent={currentPhaseObj?.customScript}
                  onUpdateScript={(val) => updateCustomScript(phase, val)}
                />
              )
            }

            {
              phase === 'tematico' && (
                <StandardPhase
                  currentValue={sudLevel}
                  onRegister={() => {
                    const currentHistory = sessionData.thematicHistory || [];
                    const newHistory = [...currentHistory, sudLevel];
                    saveSessionData({ ...sessionData, thematicHistory: newHistory });
                  }}
                  history={sessionData.thematicHistory || []}
                  type="distress"
                  scriptTitle="Foco Temático"
                  scriptContent={
                    "Concentre-se no tema que estamos trabalhando. O que vem à mente agora? Qual a pior parte disso?"
                  }
                  customScriptContent={currentPhaseObj?.customScript}
                  onUpdateScript={(val) => updateCustomScript(phase, val)}
                />
              )
            }

            {
              phase === 'futuro' && (
                <StandardPhase
                  currentValue={sudLevel}
                  onRegister={() => {
                    const currentHistory = sessionData.futureHistory || [];
                    const newHistory = [...currentHistory, sudLevel];
                    saveSessionData({ ...sessionData, futureHistory: newHistory });
                  }}
                  history={sessionData.futureHistory || []}
                  type="distress"
                  scriptTitle="Foco no Futuro"
                  scriptContent={
                    "Imagine a situação futura que te preocupa. Rode esse filme mentalmente. O que você sente ao imaginar isso?"
                  }
                  customScriptContent={currentPhaseObj?.customScript}
                  onUpdateScript={(val) => updateCustomScript(phase, val)}
                />
              )
            }

            {
              phase === 'potencializacao' && (
                <StandardPhase
                  currentValue={sudLevel}
                  onRegister={() => {
                    const currentHistory = sessionData.potentializationHistory || [];
                    const newHistory = [...currentHistory, sudLevel];
                    saveSessionData({ ...sessionData, potentializationHistory: newHistory });
                  }}
                  history={sessionData.potentializationHistory || []}
                  type="positive"
                  scriptTitle="Potencialização"
                  scriptContent={
                    "Conecte-se com essa sensação de vitória, de força. Sinta isso crescer dentro de você. De 0 a 10, quão forte é essa sensação boa?"
                  }
                  customScriptContent={currentPhaseObj?.customScript}
                  onUpdateScript={(val) => updateCustomScript(phase, val)}
                />
              )
            }

            {
              !['cronologico', 'somatico', 'tematico', 'futuro', 'potencializacao'].includes(phase) && !currentPhaseObj?.customScript && (
                <TherapistScript title="Script Padrão" editable onEdit={(val) => updateCustomScript(phase, val)}>
                  "Concentre-se no desconforto remanescente. O que vem agora?"
                </TherapistScript>
              )
            }

            {
              !['cronologico', 'somatico', 'tematico', 'futuro', 'potencializacao'].includes(phase) && currentPhaseObj?.customScript && (
                <TherapistScript title="Script Personalizado" editable onEdit={(val) => updateCustomScript(phase, val)}>
                  {currentPhaseObj.customScript}
                </TherapistScript>
              )
            }

            {/* Persistent Session Notes */}
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <FileText size={16} /> Notas da Sessão
              </h3>
              <textarea
                value={sessionData.notes || ''}
                onChange={(e) => {
                  const newNotes = e.target.value;
                  setSessionData({ ...sessionData, notes: newNotes });
                }}
                onBlur={() => saveSessionData(sessionData)}
                className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                placeholder="Registre observações importantes, insights ou reações do cliente..."
              />
            </div>

            <div className="flex justify-end pt-8">
              <button
                onClick={() => {
                  const idx = phases.findIndex(p => p.id === phase);
                  if (idx < phases.length - 1) setPhase(phases[idx + 1].id);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-primary-600 text-white rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-primary-500 transition-all font-bold"
              >
                Concluir Fase <ArrowRight size={18} />
              </button>
            </div>
          </div >
        );
    }
  };


  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">

      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
              Sessão TeraNexus
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] rounded-full uppercase tracking-wider font-extrabold border border-primary-200 dark:border-primary-800">TRG</span>
            </h1>

            <div className="flex items-center gap-2 mt-1">
              <div className="relative group min-w-[180px]">
                <select
                  value={selectedPatientId}
                  onChange={handleManualPatientSelect}
                  className="w-full appearance-none bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 pr-6 outline-none cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-0.5 rounded truncate"
                >
                  <option value="" disabled>Selecione o Cliente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500" />
              </div>

              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Component */}
          <SessionTimer
            seconds={timer}
            isActive={isTimerRunning}
            onToggle={toggleTimer}
            sessionNumber={sessionNumber}
          />

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

          <button
            onClick={() => !isVideoActive ? startCamera() : stopCamera()}
            className={`p - 2 rounded - xl transition - all ${isVideoActive ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'} `}
            title={isVideoActive ? "Encerrar Vídeo" : "Iniciar Vídeo"}
          >
            {isVideoActive ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all font-bold text-sm"
          >
            <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-[18px] h-[18px]" /> <span className="hidden sm:inline">Nexus AI</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-4 gap-4 relative">

        {/* Left Sidebar: Phases */}
        <ProtocolPhases
          phases={phases}
          currentPhase={phase}
          isEditing={isEditingProtocol}
          isSafetyOpen={isSafetyOpen}
          aiSuggestions={aiSuggestions}
          sentiment={sentiment}
          setPhase={setPhase}
          toggleEditing={() => setIsEditingProtocol(!isEditingProtocol)}
          toggleSafety={() => setIsSafetyOpen(!isSafetyOpen)}
          onMovePhase={handleMovePhase}
          onRenamePhase={handleRenamePhase}
          onDeletePhase={handleDeletePhase}
          onAddCustomPhase={handleAddCustomPhase}
          hasPhaseData={hasPhaseData}
        />

        {/* Middle: Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Video Area (if active) */}
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
            currentAppointmentId={currentAppointmentId}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onSaveRecording={saveRecordingToGallery}
          />

          {/* Dynamic Phase Content */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative z-0">
            <div className="overflow-y-auto custom-scrollbar h-full">
              {renderPhaseContent()}
            </div>
          </div>
        </div>

      </div>

      {/* AI Modal (Simplified for now) */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                  <img src="/logo-new.jpg" alt="TeraNexus Logo" className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Assistente Nexus AI</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
