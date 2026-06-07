import React, { useState, useRef, useEffect } from 'react';
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    Wind,
    ArrowUp,
    ArrowDown,
    ShieldCheck,
    PhoneOff,
    MessageSquare,
    Clock,
    Calendar,
    Download,
    Film,
    Maximize2,
    Minimize2,
    Send,
    X
} from 'lucide-react';
import { useClientData } from '../ClientPortal/ClientContext';
import ClientLayout from '../ClientPortal/ClientLayout';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useAdaptiveVideo } from '../../hooks/useAdaptiveVideo';
import { DraggablePip } from '../Session/DraggablePip';
import { ChronologicalPhase } from '../Session/ChronologicalPhase';

const ClientSessionView: React.FC = () => {
    const AGE_RANGES = ['0-10 anos', '11-20 anos', '21-30 anos', '31-40 anos', '41-50 anos', '51-60 anos', '61+ anos'];
    const [selectedAgeRange, setSelectedAgeRange] = useState(AGE_RANGES[0]);
    const { patient, appointments: rawAppointments } = useClientData();
    const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
    const [appointmentId, setAppointmentId] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordInterval = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const animationFrameRef = useRef<number | null>(null);
    const [isImmersiveMode, setIsImmersiveMode] = useState(false);

    // Find the current appointment details
    const currentAppointment = appointments.find(appt => appt.id === appointmentId) || appointments.find(appt => appt.status === 'Agendado');

    const [realtimeSessionData, setRealtimeSessionData] = useState<any>(null);

    // PeerJS Integration
    // Standardized IDs:
    // My: client-{roomKey}
    // Target: therapist-{roomKey}
    const roomKey = appointmentId || patient?.id || localStorage.getItem('client_portal_id') || '';
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    };

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const handleVideoContainerClick = () => {
        if (!showControls) {
            resetControlsTimeout();
        } else {
            setShowControls(false);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        }
    };


    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            videoContainerRef.current?.requestFullscreen?.().catch(console.error);
        } else {
            document.exitFullscreen?.();
        }
    };

    const { remoteStream, connectionStatus, messages, sendMessage, syncData } = useVideoCall({
        myId: roomKey ? `client-${roomKey}` : '',
        targetId: roomKey ? `therapist-${roomKey}` : '',
        isInitiator: false,
        localStream: stream
    });

    useEffect(() => {
        if (syncData?.data?.type === 'SESSION_DATA_UPDATE') {
            setRealtimeSessionData(syncData.data.payload);
        }
    }, [syncData]);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatText, setChatText] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Adaptive video: detects therapist aspect ratio and adjusts layout automatically
    const adaptiveRemote = useAdaptiveVideo(remoteVideoRef as React.RefObject<HTMLVideoElement | null>, remoteStream);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isChatOpen]);

    useEffect(() => {
        // Extract appointmentId from URL
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[2]) {
            const id = pathParts[2];
            setAppointmentId(id);
        } else if (currentAppointment) {
            // Fallback: use the ID of the active/scheduled appointment
            setAppointmentId(currentAppointment.id);
        }
    }, [currentAppointment]);

    // Auto-start camera ONCE on mount
    useEffect(() => {
        startCamera();
        return () => {
            // Cleanup stream on unmount
            setStream(prev => {
                prev?.getTracks().forEach(t => t.stop());
                return null;
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !isVideoActive || !stream) return;
        if (el.srcObject !== stream) {
            el.srcObject = stream;
            el.play().catch(e => {
                console.error(e);
                setCameraError("Erro ao acessar câmera. Verifique as permissões.");
            });
        }
    }, [isVideoActive, stream]);

    useEffect(() => {
        const el = remoteVideoRef.current;
        if (!el || !remoteStream) return;
        if (el.srcObject !== remoteStream) {
            el.srcObject = remoteStream;
            el.play().catch(console.error);
        }
    }, [remoteStream]);

    const [recordings, setRecordings] = useState<any[]>([]);

    useEffect(() => {
        const patientId = localStorage.getItem('client_portal_id');
        if (patientId) {
            fetch(`/api/client-portal?action=recordings&patientId=${patientId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setRecordings(data.map((r: any) => ({
                            id: r.id,
                            date: r.created_at,
                            duration: r.duration,
                            size: r.size,
                            phase: r.phase,
                            blobUrl: r.url
                        })));
                    }
                })
                .catch(console.error);
        }
    }, []);

    const startCamera = async () => {
        // Guard: don't re-initialize if stream is already active
        if (stream && stream.active) return;

        setCameraError(null);
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError("Seu navegador não suporta acesso à câmera.");
                return;
            }
            const isMobile = window.innerWidth < 768;
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: isMobile
                    ? { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }
                    : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            setStream(mediaStream);
            setIsVideoActive(true);
        } catch (err: any) {
            console.error('[Camera] getUserMedia error:', err.name, err.message);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError("Acesso à câmera negado. Toque no ícone 🔒 na barra do navegador e permita câmera e microfone.");
            } else if (err.name === 'NotFoundError') {
                setCameraError("Nenhuma câmera encontrada neste dispositivo.");
            } else if (err.name === 'NotReadableError') {
                setCameraError("Câmera em uso por outro aplicativo. Feche outros apps e tente novamente.");
            } else {
                setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
            }
        }
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    };

    const startRecording = () => {
        if (!stream || !remoteStream) {
            alert("Aguarde a conexão com o terapeuta para iniciar a gravação.");
            return;
        }
        setRecordedChunks([]);

        try {
            // 1. Setup Canvas
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            canvasRef.current = canvas;
            const ctx = canvas.getContext('2d');

            // 2. Setup Audio Mixing
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const dest = audioContext.createMediaStreamDestination();

            if (stream.getAudioTracks().length > 0) {
                const localSource = audioContext.createMediaStreamSource(stream);
                localSource.connect(dest);
            }
            if (remoteStream.getAudioTracks().length > 0) {
                const remoteSource = audioContext.createMediaStreamSource(remoteStream);
                remoteSource.connect(dest);
            }

            // 3. Draw Loop
            const draw = () => {
                if (!ctx) return;

                // Draw Remote (Therapist) - Full Screen
                if (remoteVideoRef.current) {
                    ctx.drawImage(remoteVideoRef.current, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw Local (Client) - PiP
                if (videoRef.current) {
                    const pipWidth = 320;
                    const pipHeight = 180;
                    const padding = 20;
                    const x = canvas.width - pipWidth - padding;
                    const y = canvas.height - pipHeight - padding;

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, pipWidth, pipHeight);

                    ctx.save();
                    ctx.translate(x + pipWidth, y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(videoRef.current, 0, 0, pipWidth, pipHeight);
                    ctx.restore();
                }

                animationFrameRef.current = requestAnimationFrame(draw);
            };
            draw();

            // 4. Create Stream & Start
            const canvasStream = canvas.captureStream(30);
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);

            const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp8,opus' });
            recorder.ondataavailable = (event) => { if (event.data.size > 0) setRecordedChunks(prev => [...prev, event.data]); };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            recordInterval.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

        } catch (e) {
            console.error(e);
            alert("Erro ao iniciar gravação.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (recordInterval.current) clearInterval(recordInterval.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            setIsRecording(false);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const handleEndCall = () => {
        if (window.confirm("Deseja sair da sessão e voltar ao portal?")) {
            if (stream) stream.getTracks().forEach(track => track.stop());
            window.location.href = '/portal-paciente/dashboard';
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const [isUploading, setIsUploading] = useState(false);

    const saveRecording = async () => {
        if (recordedChunks.length === 0) return;

        setIsUploading(true);
        try {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const duration = formatTime(recordingTime);
            const size = (blob.size / 1024 / 1024).toFixed(1) + ' MB';
            const patientId = localStorage.getItem('client_portal_id');

            // Upload to Cloud
            const response = await fetch(`/api/recordings?filename=client-session-${Date.now()}.webm&patientId=${patientId}&duration=${duration}&size=${size}&phase=Sessão`, {
                method: 'POST',
                body: blob
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Falha no upload');
            }

            const data = await response.json();

            setRecordedChunks([]);
            setRecordingTime(0);
            alert('Gravação salva na nuvem com sucesso! Você pode acessá-la na sua galeria.');

            // Refresh recordings list
            if (patientId) {
                fetch(`/api/client-portal?action=recordings&patientId=${patientId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setRecordings(data.map((r: any) => ({
                                id: r.id,
                                date: r.created_at,
                                duration: r.duration,
                                size: r.size,
                                phase: r.phase,
                                blobUrl: r.url
                            })));
                        }
                    })
                    .catch(console.error);
            }

        } catch (error: any) {
            console.error(error);
            alert(`Erro ao salvar gravação: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <ClientLayout activePage="session">
            <div className="h-full flex flex-col text-white font-sans bg-slate-950">
                {/* Header - Hide in Immersive Mode */}
                {!isImmersiveMode && (
                    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
                        <div className="flex items-center gap-4">
                            {/* Session Info (Desktop) */}
                            <div className="hidden md:flex items-center gap-4 pl-4 ml-2">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                                        {patient?.therapist_name?.charAt(0) || 'T'}
                                    </div>
                                    <span className="font-medium text-slate-300">
                                        {patient?.therapist_name || 'Seu Terapeuta'}
                                    </span>
                                </div>
                                {currentAppointment && (
                                    <div className="flex items-center gap-3 text-slate-400 text-xs border-l border-slate-800 pl-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            <span>
                                                {new Date(currentAppointment.date).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            <span>{currentAppointment.time}</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-bold">
                                            {(() => {
                                                // Calculate session number
                                                const sortedAppts = [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                                const index = sortedAppts.findIndex(a => a.id === currentAppointment.id);
                                                return `${index + 1}ª Sessão`;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase rounded-full border border-green-500/30 animate-pulse flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Ao Vivo
                            </span>
                        </div>
                    </header>
                )}


                {/* Main Content */}
                <main className={`flex-1 flex flex-col gap-6 w-full mx-auto transition-all duration-300 ${isImmersiveMode ? 'p-0 max-w-full' : 'p-4 md:p-6 max-w-6xl'}`}>

                    {/* Video Area */}
                    <div 
                        ref={videoContainerRef}
                        onClick={handleVideoContainerClick}
                        onMouseMove={() => showControls && resetControlsTimeout()}
                        className={`bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800 flex flex-col group/container cursor-pointer ${
                            isFullScreen 
                                ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none ring-0' 
                                : 'relative w-full min-h-[45vh] sm:aspect-video md:aspect-auto md:flex-1 md:min-h-[400px]'
                        }`}
                    >

                        {/* Therapist Video (Main View) — position absolute garante contain sem interferência do flex */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{ backgroundColor: '#020617' }}
                        >
                            {remoteStream ? (
                                <video
                                    ref={(el) => {
                                        if (el && remoteStream && el.srcObject !== remoteStream) {
                                            el.srcObject = remoteStream;
                                            el.play().catch(() => {});
                                        }
                                        remoteVideoRef.current = el;
                                    }}
                                    autoPlay
                                    playsInline
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-4 border-slate-700/50 shadow-xl transition-all">
                                        <span className="text-3xl font-bold text-slate-600">
                                            {patient?.therapist_name?.charAt(0) || <ShieldCheck size={40} />}
                                        </span>
                                    </div>
                                    <h3 className="text-slate-300 font-bold text-lg mb-1">
                                        {patient?.therapist_name ? `Aguardando ${patient.therapist_name}...` : 'Aguardando seu Terapeuta...'}
                                    </h3>
                                    <p className="text-slate-500 text-sm flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
                                        {connectionStatus === 'connecting' ? 'Conectando...' : 'Sua sessão começará em breve.'}
                                    </p>
                                </div>
                            )}
                            {/* Therapist Name Tag */}
                            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg flex items-center gap-2 z-10 transition-opacity">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-white tracking-wide">{patient?.therapist_name || "Terapeuta"}</span>
                                {remoteStream && adaptiveRemote.orientation !== 'unknown' && (
                                    <span className="ml-1 text-[9px] font-mono text-slate-400 uppercase opacity-60">
                                        {adaptiveRemote.orientation === 'portrait' ? '📱' : adaptiveRemote.orientation === 'landscape' ? '🖥️' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Chat Drawer Overlay */}
                        {isChatOpen && (
                            <div className="fixed inset-x-0 bottom-0 z-50 h-[75vh] flex flex-col bg-slate-900/85 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-t-3xl transition-transform animate-slide-up
                                            md:absolute md:inset-auto md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:w-[380px] md:h-[450px] md:rounded-3xl md:border md:shadow-2xl">
                                {/* Barra de puxar no Mobile */}
                                <div className="md:hidden w-full flex justify-center pt-4 pb-2">
                                    <div className="w-12 h-1.5 bg-slate-600/50 rounded-full"></div>
                                </div>
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-transparent">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <MessageSquare size={18} className="text-indigo-400" /> Chat com Terapeuta
                                    </h4>
                                    <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3" ref={chatContainerRef}>
                                    {messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-70">
                                            <MessageSquare size={40} className="mb-2" />
                                            <p className="text-xs italic text-center">Nenhuma mensagem ainda.<br/>Suas conversas aparecem aqui.</p>
                                        </div>
                                    ) : (
                                        messages.map(m => (
                                            <div key={m.id} className={`flex flex-col max-w-[85%] ${m.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-md ${m.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'}`}>
                                                    {m.text}
                                                </div>
                                                <span className="text-[10px] text-slate-500 mt-1 px-1 font-medium">
                                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 bg-slate-900/50 border-t border-white/5 rounded-b-3xl">
                                    <form 
                                        onSubmit={(e) => { 
                                            e.preventDefault(); 
                                            if(chatText.trim()) { 
                                                sendMessage(chatText.trim()); 
                                                setChatText(''); 
                                            }
                                        }} 
                                        className="flex gap-2"
                                    >
                                        <input 
                                            type="text" 
                                            value={chatText}
                                            onChange={e => setChatText(e.target.value)}
                                            placeholder="Mensagem..." 
                                            className="flex-1 bg-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:bg-slate-900 shadow-inner transition-all"
                                        />
                                        <button type="submit" disabled={!chatText.trim()} className="p-3 bg-indigo-600 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all">
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Client Self-View (Picture-in-Picture) */}
                        <DraggablePip 
                            containerRef={videoContainerRef}
                            className={`absolute z-10 aspect-[3/4] md:aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 transition-shadow duration-300 hover:shadow-black/50 ${isFullScreen ? 'w-32 md:w-64' : 'w-24 sm:w-28 md:w-48'}`}
                            defaultPosition={{ top: '1rem', right: '1rem' }}
                        >
                            {isVideoActive ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs">
                                    <VideoOff size={24} />
                                </div>
                            )}
                            {isVideoMuted && <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-900"><VideoOff size={24} /></div>}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm pointer-events-none">Você</div>
                        </DraggablePip>

                        {/* Controls Overlay */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); resetControlsTimeout(); }}
                            className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 md:gap-4 bg-slate-950/90 backdrop-blur-xl p-2 md:p-3 rounded-2xl border border-white/10 shadow-2xl w-[90%] md:w-auto justify-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <button
                                onClick={toggleMic}
                                className={`p-3 md:p-4 rounded-xl transition-all duration-200 ${isMicMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                title={isMicMuted ? "Ativar Microfone" : "Desativar Microfone"}
                            >
                                {isMicMuted ? <MicOff size={20} className="md:w-6 md:h-6" /> : <Mic size={20} className="md:w-6 md:h-6" />}
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`p-3 md:p-4 rounded-xl transition-all duration-200 ${isVideoMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                title={isVideoMuted ? "Ativar Câmera" : "Desativar Câmera"}
                            >
                                {isVideoMuted ? <VideoOff size={20} className="md:w-6 md:h-6" /> : <VideoIcon size={20} className="md:w-6 md:h-6" />}
                            </button>

                            <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2"></div>

                            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3 md:p-4 rounded-xl transition-all duration-200 relative ${isChatOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`} title="Chat">
                                <MessageSquare size={20} className="md:w-6 md:h-6" />
                                {messages.length > 0 && !isChatOpen && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-slate-900"></span>
                                )}
                            </button>

                            <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2"></div>

                            <button onClick={toggleFullScreen} className={`p-3 md:p-4 rounded-xl transition-all duration-200 bg-slate-800 text-white hover:bg-slate-700`} title="Tela Cheia">
                                {isFullScreen ? <Minimize2 size={20} className="md:w-6 md:h-6" /> : <Maximize2 size={20} className="md:w-6 md:h-6" />}
                            </button>

                            <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2"></div>

                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="p-3 md:p-4 bg-white hover:bg-slate-200 text-red-600 rounded-xl transition-all shadow-lg"
                                    title="Gravar Sessão"
                                >
                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-current"></div>
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="p-3 md:p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg animate-pulse"
                                    title={`Parar Gravação (${formatTime(recordingTime)})`}
                                >
                                    <div className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-sm"></div>
                                </button>
                            )}

                            {recordedChunks.length > 0 && !isRecording && (
                                <button
                                    onClick={saveRecording}
                                    className="p-3 md:p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg"
                                    title="Baixar Gravação"
                                >
                                    <Download size={20} className="md:w-6 md:h-6" />
                                </button>
                            )}

                            <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2"></div>

                            <button
                                onClick={() => setIsImmersiveMode(!isImmersiveMode)}
                                className={`p-3 md:p-4 rounded-xl transition-all duration-200 ${isImmersiveMode ? 'bg-primary-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                title={isImmersiveMode ? "Sair do Modo Imersivo" : "Modo Imersivo"}
                            >
                                {isImmersiveMode ? <Minimize2 size={20} className="md:w-6 md:h-6" /> : <Maximize2 size={20} className="md:w-6 md:h-6" />}
                            </button>

                            <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2"></div>

                            <button
                                onClick={handleEndCall}
                                className="p-3 md:p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg hover:scale-105"
                                title="Sair da Sessão"
                            >
                                <PhoneOff size={20} className="md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* Error Message */}
                        {cameraError && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm z-50">
                                {cameraError}
                            </div>
                        )}
                    </div>

                    {/* Safety Mechanism & Chat - Hide in Immersive Mode */}
                    {!isImmersiveMode && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Safety Mechanism (Prominent) */}
                            <div className="md:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-1 overflow-hidden">
                                <button
                                    onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                                    className={`w-full p-4 flex items-center justify-between rounded-xl transition-all ${isSafetyOpen ? 'bg-red-900/20 text-red-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isSafetyOpen ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                                            <Wind size={20} className={isSafetyOpen ? 'text-red-500' : 'text-slate-400'} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Mecanismo de Segurança</h4>
                                            <p className="text-xs opacity-70">Use se sentir desconforto intenso</p>
                                        </div>
                                    </div>
                                    {isSafetyOpen ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                                </button>

                                {isSafetyOpen && (
                                    <div className="p-6 bg-red-950/30 border-t border-red-900/30 animate-slide-up text-center">
                                        <p className="text-lg font-medium text-red-200 italic mb-4 leading-relaxed">
                                            "Feche os olhos, repouse suas mãos ao lado do corpo..."
                                        </p>
                                        <div className="inline-block px-6 py-3 bg-red-500/10 rounded-full border border-red-500/20">
                                            <p className="text-sm font-bold text-red-400 uppercase tracking-widest">
                                                "Cheira a florzinha 🌸 ... e sopra a velinha 🕯️"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SUD Progress */}
                            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-0 overflow-hidden flex flex-col justify-between relative">
                                <div className="absolute top-2 right-2 z-10">
                                    <select 
                                        value={selectedAgeRange}
                                        onChange={(e) => setSelectedAgeRange(e.target.value)}
                                        className="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 outline-none"
                                    >
                                        {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <ChronologicalPhase 
                                    selectedRange={selectedAgeRange}
                                    onRangeChange={setSelectedAgeRange}
                                    ranges={AGE_RANGES}
                                    mentalHistory={realtimeSessionData?.mentalHistory || currentAppointment?.sessionData?.mentalHistory || {}}
                                    physicalHistory={realtimeSessionData?.physicalHistory || currentAppointment?.sessionData?.physicalHistory || {}}
                                />
                            </div>
                        </div>
                    )}

                    {/* Recordings Gallery */}
                    {!isImmersiveMode && (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Film size={20} className="text-primary-500" /> Galeria de Gravações
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recordings.length > 0 ? (
                                    recordings.map((rec) => (
                                        <div key={rec.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden group hover:border-primary-500/50 transition-all">
                                            <div className="aspect-video bg-slate-900 relative">
                                                <video src={rec.blobUrl} className="w-full h-full object-cover" controls />
                                            </div>
                                            <div className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{new Date(rec.date).toLocaleDateString('pt-BR')}</p>
                                                        <p className="text-xs text-slate-500">{rec.duration} • {rec.size}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase">{rec.phase}</span>
                                                </div>
                                                <a
                                                    href={rec.blobUrl}
                                                    download={`sessao-${new Date(rec.date).toISOString().split('T')[0]}.webm`}
                                                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    <Download size={14} /> Baixar
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                                        Nenhuma gravação disponível.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div >
        </ClientLayout >
    );
};

export default ClientSessionView;
