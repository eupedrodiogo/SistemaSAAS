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
    Minimize2
} from 'lucide-react';
import { useClientData } from '../ClientPortal/ClientContext';
import ClientLayout from '../ClientPortal/ClientLayout';
import { useVideoCall } from '../../hooks/useVideoCall';

const ClientSessionView: React.FC = () => {
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

    // PeerJS Integration
    // Standardized IDs:
    // My: client-{appointmentId}
    // Target: therapist-{appointmentId}
    const { remoteStream, connectionStatus } = useVideoCall({
        myId: appointmentId ? `client-${appointmentId}` : '',
        targetId: appointmentId ? `therapist-${appointmentId}` : '',
        isInitiator: false,
        localStream: stream
    });

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
        // Auto-start camera for client convenience
        startCamera();
    }, [currentAppointment]);

    useEffect(() => {
        if (isVideoActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => {
                console.error(e);
                setCameraError("Erro ao acessar câmera. Verifique as permissões.");
            });
        }
    }, [isVideoActive, stream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(console.error);
        }
    }, [remoteStream]);

    const [recordings, setRecordings] = useState<any[]>([]);

    useEffect(() => {
        const patientId = localStorage.getItem('client_portal_id');
        if (patientId) {
            fetch(`/api/recordings?patientId=${patientId}`)
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
        setCameraError(null);
        try {
            if (navigator.mediaDevices) {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                setStream(mediaStream);
                setIsVideoActive(true);
            } else {
                setCameraError("Seu navegador não suporta acesso à câmera.");
            }
        } catch (err) {
            setCameraError("Não foi possível acessar a câmera. Verifique se você permitiu o acesso.");
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
                fetch(`/api/recordings?patientId=${patientId}`)
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
                    <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-800 flex-1 min-h-[400px]">

                        {/* Therapist Placeholder (Main View) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse border-4 border-slate-800 shadow-xl">
                                        <span className="text-3xl font-bold text-slate-600">
                                            {patient?.therapist_name?.charAt(0) || <ShieldCheck size={40} />}
                                        </span>
                                    </div>
                                    <h3 className="text-slate-300 font-bold text-lg mb-1">
                                        {patient?.therapist_name ? `Aguardando ${patient.therapist_name}...` : 'Aguardando seu Terapeuta...'}
                                    </h3>
                                    <p className="text-slate-500 text-sm flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connecting' ? 'bg-amber-500 animate-bounce' : 'bg-slate-600'}`}></span>
                                        {connectionStatus === 'connecting' ? 'Conectando...' : 'Sua sessão começará em breve.'}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Client Self-View (Picture-in-Picture) */}
                        <div className="absolute top-4 right-4 md:top-auto md:bottom-4 md:right-4 w-28 md:w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700 z-20 group transition-all">
                            {isVideoActive ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-xs">
                                    Câmera Off
                                </div>
                            )}
                            {isVideoMuted && <div className="absolute inset-0 flex items-center justify-center text-white/50"><VideoOff size={24} /></div>}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">Você</div>
                            {/* Debug Info */}
                            <div className="absolute top-2 left-2 bg-black/50 text-[10px] text-white p-1 rounded font-mono opacity-50 hover:opacity-100">
                                My: client-{appointmentId?.slice(0, 8)}...<br />
                                Target: therapist-{appointmentId?.slice(0, 8)}...
                            </div>
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 md:gap-4 bg-slate-950/90 backdrop-blur-xl p-2 md:p-3 rounded-2xl border border-white/10 shadow-2xl w-[90%] md:w-auto justify-center">
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

                            {/* Chat / Support Placeholder */}
                            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <MessageSquare size={14} /> Chat com Terapeuta
                                    </h4>
                                    <div className="h-24 flex items-center justify-center text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-lg">
                                        Nenhuma mensagem
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Digite uma mensagem..."
                                    className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
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
